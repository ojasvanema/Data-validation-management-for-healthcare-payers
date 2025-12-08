from ..models import MainAgentState, FraudAnalysis, FraudRiskLevel
import asyncio

async def fraud_agent_node(state: MainAgentState) -> MainAgentState:
    """
    Fraud Detection Agent:
    Acts as a security guard, running continuous checks on licenses and billing 
    patterns to flag and prevent fraudulent activity.
    """
    print(f"[{state.job_id}] [Fraud Agent] Analyzing patterns...")
    
    await asyncio.sleep(0.2)
    
    risk_score = 0.0
    flags = []
    
    # Rule 1: OIG Exclusion is High Risk
    if state.validation_result and state.validation_result.oig_excluded:
        risk_score += 90.0
        flags.append("OIG Exclusion Match")
        
    # Rule 2: Invalid NPI is Medium-High Risk
    if state.validation_result and not state.validation_result.npi_valid:
        risk_score += 60.0
        flags.append("Invalid NPI")
    
    # Rule 3: Data Inconsistencies (name mismatch, etc.) - Low-Medium Risk
    if state.validation_result and not state.validation_result.is_consistent:
        risk_score += 25.0
        flags.append("Data Inconsistency")
        
    # Determine Level with adjusted thresholds
    level = FraudRiskLevel.LOW
    if risk_score >= 80:
        level = FraudRiskLevel.HIGH
    elif risk_score >= 20:
        level = FraudRiskLevel.MEDIUM
        
    communication_required = False
    if level == FraudRiskLevel.HIGH:
        print(f"[{state.job_id}] [Fraud Agent] CRITICAL: High fraud risk detected.")
        communication_required = True
        
    return {
        "fraud_analysis": FraudAnalysis(
            risk_score=risk_score,
            risk_level=level,
            flagged_patterns=flags
        ),
        "communication_required": communication_required
    }
