"""
Business Impact Agent — VERA
Computes per-provider and batch-level financial impact using industry-standard 
3-layer ROI methodology (CAQH/CMS benchmarks).

Layer 1: Operational Efficiency (manual time avoided)
Layer 2: Denial & Rework Prevention (error detection improvement)
Layer 3: Fraud & Compliance Avoidance (risk-weighted penalties)
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# ─── CONFIGURABLE ASSUMPTIONS (from CMS/CAQH industry benchmarks) ───
NETWORK_SIZE = 10_000                 # Reference payer network size
ERROR_RATE = 0.40                     # 40% of entries have material errors (CMS audit range: 29-48%)
CLAIMS_PER_ERROR_PROVIDER = 5         # Problematic claims/year per erroneous entry
COST_PER_PROBLEMATIC_CLAIM = 200      # USD per denied/reworked claim (admin + write-offs)

MANUAL_MINUTES_PER_PROVIDER = 30      # Manual verification baseline
HOURLY_RATE = 30                      # USD fully loaded staff cost
AUTO_APPROVE_FRACTION = 0.60          # Low-risk providers bypassing manual review
REVIEW_TIME_REDUCTION = 0.50          # 50% time reduction for triaged reviews

BASELINE_DETECTION_RATE = 0.50        # Manual catches 50% of errors
VERA_DETECTION_RATE = 0.80            # VERA catches 80% of errors
DETECTION_IMPROVEMENT = VERA_DETECTION_RATE - BASELINE_DETECTION_RATE  # 0.30

ANNUAL_PLATFORM_COST = 250_000        # USD/year (licenses + infra + integration)


def compute_provider_impact(
    risk_score: float, 
    status: str, 
    n_conflicts: int,
    is_auto_approved: bool = False
) -> Dict[str, Any]:
    """
    Compute per-provider dollar impact using 3-layer model.
    
    Returns:
        Dict with operational_saving, denial_prevention, fraud_prevention, total_impact
    """
    # Layer 1: Operational savings (manual time avoided)
    manual_cost = (MANUAL_MINUTES_PER_PROVIDER / 60) * HOURLY_RATE  # $15 baseline
    if is_auto_approved:
        ops_saving = manual_cost  # Full manual cost avoided ($15)
    else:
        ops_saving = manual_cost * REVIEW_TIME_REDUCTION  # 50% reduction ($7.50)
    
    # Layer 2: Denial & rework prevention
    # Only for providers where we actually found issues that can be corrected
    if n_conflicts > 0:
        # Each corrected provider prevents: improvement_rate × claims × cost_per_claim
        denial_saving = DETECTION_IMPROVEMENT * CLAIMS_PER_ERROR_PROVIDER * COST_PER_PROBLEMATIC_CLAIM
        # $300 per flagged provider
    else:
        denial_saving = 0.0
    
    # Layer 3: Fraud & compliance avoidance (risk-weighted)
    if risk_score > 70:
        # High-risk: potential OIG exclusion, credential issues
        fraud_saving = 500.0
    elif risk_score > 35:
        # Medium-risk: monitoring value, early intervention
        fraud_saving = 100.0
    else:
        fraud_saving = 0.0
    
    total = ops_saving + denial_saving + fraud_saving
    
    return {
        "operational_saving": round(ops_saving, 2),
        "denial_prevention": round(denial_saving, 2),
        "fraud_prevention": round(fraud_saving, 2),
        "total_impact": round(total, 2)
    }


def compute_batch_roi(records: list) -> Dict[str, Any]:
    """
    Aggregate ROI across all providers in a batch.
    Scales to full network size for annualized projection.
    """
    total_ops = 0.0
    total_denial = 0.0
    total_fraud = 0.0
    batch_size = len(records) if records else 1
    
    auto_approved = 0
    flagged = 0
    high_risk = 0
    
    for rec in records:
        is_auto = (rec.status == "Verified" and rec.riskScore <= 35)
        n_conflicts = len(rec.conflicts) if rec.conflicts else 0
        
        impact = compute_provider_impact(rec.riskScore, rec.status, n_conflicts, is_auto)
        total_ops += impact["operational_saving"]
        total_denial += impact["denial_prevention"]
        total_fraud += impact["fraud_prevention"]
        
        if is_auto:
            auto_approved += 1
        if rec.status == "Flagged":
            flagged += 1
        if rec.riskScore > 70:
            high_risk += 1
    
    batch_total = total_ops + total_denial + total_fraud
    
    # Annualize: scale batch results to full network
    scale_factor = NETWORK_SIZE / max(batch_size, 1)
    annualized_benefit = batch_total * scale_factor
    roi_percentage = ((annualized_benefit - ANNUAL_PLATFORM_COST) / ANNUAL_PLATFORM_COST) * 100
    
    hours_saved = batch_size * (MANUAL_MINUTES_PER_PROVIDER / 60) * AUTO_APPROVE_FRACTION
    
    return {
        "batch_savings": round(batch_total, 2),
        "operational_savings": round(total_ops, 2),
        "denial_prevention": round(total_denial, 2),
        "fraud_prevention": round(total_fraud, 2),
        "annualized_benefit": round(annualized_benefit, 2),
        "roi_percentage": round(max(0, roi_percentage), 1),
        "hours_saved": round(hours_saved, 1),
        "auto_approved_count": auto_approved,
        "flagged_count": flagged,
        "high_risk_count": high_risk,
    }


def generate_deterministic_summary(records: list, batch_roi: Dict[str, Any]) -> str:
    """
    Generate a meaningful, data-driven summary without LLM.
    Used for the fast/deterministic path (run_efficiently=True).
    """
    batch_size = len(records)
    flagged = batch_roi["flagged_count"]
    high_risk = batch_roi["high_risk_count"]
    auto_approved = batch_roi["auto_approved_count"]
    
    # Find highest-risk providers
    sorted_by_risk = sorted(records, key=lambda r: r.riskScore, reverse=True)
    top_risk = sorted_by_risk[:3] if len(sorted_by_risk) >= 3 else sorted_by_risk
    
    # Find most common issues
    all_conflicts = []
    for r in records:
        if r.conflicts:
            all_conflicts.extend(r.conflicts)
    
    # Build state distribution
    state_counts: Dict[str, int] = {}
    for r in records:
        state_counts[r.state] = state_counts.get(r.state, 0) + 1
    top_states = sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Build summary
    lines = []
    lines.append(f"VERA Validation Cycle — {datetime.now().strftime('%b %d, %Y %I:%M %p')}")
    lines.append(f"Processed {batch_size} providers | Auto-approved: {auto_approved} | Flagged: {flagged} | High-risk: {high_risk}")
    lines.append("")
    
    if high_risk > 0:
        risk_names = [f"{r.name} (NPI: {r.npi}, risk: {r.riskScore})" for r in top_risk if r.riskScore > 70]
        if risk_names:
            lines.append(f"HIGH-RISK PROVIDERS: {', '.join(risk_names[:3])}")
    
    lines.append(f"FINANCIAL IMPACT")
    lines.append(f"  Batch savings: ${batch_roi['batch_savings']:,.0f}")
    lines.append(f"  Operational: ${batch_roi['operational_savings']:,.0f} | "
                 f"Denial prevention: ${batch_roi['denial_prevention']:,.0f} | "
                 f"Fraud mitigation: ${batch_roi['fraud_prevention']:,.0f}")
    lines.append(f"  Annualized (10K network): ${batch_roi['annualized_benefit']:,.0f}/yr | ROI: {batch_roi['roi_percentage']:.0f}%")
    
    if top_states:
        state_str = ", ".join([f"{s[0]}: {s[1]}" for s in top_states])
        lines.append(f"\nTOP REGIONS: {state_str}")
    
    if all_conflicts:
        lines.append(f"DISCREPANCIES: {len(all_conflicts)} total across {flagged} providers")
    
    return "\n".join(lines)


async def generate_llm_executive_brief(
    records: list,
    batch_roi: Dict[str, Any],
    llm: Optional[Any] = None
) -> str:
    """
    Generate an LLM-powered Executive Intelligence Brief.
    Takes structured batch results and synthesizes into actionable narrative.
    Falls back to deterministic summary if LLM unavailable.
    """
    if llm is None:
        return generate_deterministic_summary(records, batch_roi)
    
    # Build a compact data package for the LLM
    batch_size = len(records)
    
    # Top-risk providers
    sorted_by_risk = sorted(records, key=lambda r: r.riskScore, reverse=True)
    top_risk_summaries = []
    for r in sorted_by_risk[:5]:
        conflicts_str = "; ".join(r.conflicts[:3]) if r.conflicts else "none"
        top_risk_summaries.append(
            f"- {r.name} (NPI: {r.npi}, {r.specialty}, {r.state}): risk={r.riskScore}, "
            f"status={r.status}, conflicts: {conflicts_str}"
        )
    
    # State/specialty distribution
    state_counts: Dict[str, int] = {}
    specialty_counts: Dict[str, int] = {}
    for r in records:
        state_counts[r.state] = state_counts.get(r.state, 0) + 1
        specialty_counts[r.specialty] = specialty_counts.get(r.specialty, 0) + 1
    
    prompt_data = f"""VERA Validation Batch Results:
- Providers processed: {batch_size}
- Auto-approved (low risk): {batch_roi['auto_approved_count']}
- Flagged: {batch_roi['flagged_count']}
- High-risk (>70): {batch_roi['high_risk_count']}

Financial Impact:
- Operational savings: ${batch_roi['operational_savings']:,.0f}
- Denial prevention: ${batch_roi['denial_prevention']:,.0f}  
- Fraud mitigation: ${batch_roi['fraud_prevention']:,.0f}
- Batch total: ${batch_roi['batch_savings']:,.0f}
- Annualized (10K network): ${batch_roi['annualized_benefit']:,.0f}
- ROI: {batch_roi['roi_percentage']:.0f}%

Top Risk Providers:
{chr(10).join(top_risk_summaries)}

Geographic Distribution: {dict(sorted(state_counts.items(), key=lambda x: x[1], reverse=True))}
Specialty Distribution: {dict(sorted(specialty_counts.items(), key=lambda x: x[1], reverse=True))}"""

    system_prompt = """You are VERA's Business Intelligence Agent for a healthcare payer operations team.
Generate a concise Executive Intelligence Brief (max 200 words) from the validation batch results.

Structure:
1. One-line overview (providers processed, key finding)
2. KEY FINDINGS: Cross-correlate patterns across providers (geographic clusters, specialty concentration, related discrepancies)
3. FINANCIAL IMPACT: Summarize the 3-layer savings
4. RECOMMENDED ACTIONS: 2-3 specific, prioritized next steps for the ops team

CRITICAL FORMATTING RULES:
- Do NOT use any emojis whatsoever
- Do NOT use any markdown formatting (no **, no ##, no *, no _)
- Use UPPERCASE for section headers (e.g., KEY FINDINGS:)
- Use plain numbered lists (1. 2. 3.) for actions
- Write in clean, professional plain text only
- Be direct and actionable — this goes straight to the operations manager."""

    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_data)
        ]
        
        response = await llm.ainvoke(messages)
        return response.content
    except Exception as e:
        logger.error(f"LLM executive brief failed: {e}")
        return generate_deterministic_summary(records, batch_roi)
