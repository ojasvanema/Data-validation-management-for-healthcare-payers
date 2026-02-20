from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from typing import List
import os
import csv
import uuid
import datetime
import random
import httpx
import asyncio
import json


from ..domain.models import (
    ProviderRecord, MainAgentState, AnalysisResult, 
    FrontendProviderRecord, AgentThought, ChartDataPoint
)
from ..core.config import STATES, SPECIALTIES, CSV_PATH, PROVIDER_LIMIT
from ..core.state import complaint_store, job_store
from ..services.workflow import orchestrator_graph
from ..services.validation import (
    validate_single_provider, load_complaints, load_complaints_from_text, cross_reference_complaints
)
from ..services.ocr import extract_text, parse_provider_fields
from ..database.session import save_provider, get_all_providers, update_provider_status
from ..services.detailed_agents import DetailedAgentService, ValidationOutput, PredictiveOutput, ROIOutput
from fastapi import Form

detailed_agent_service = DetailedAgentService()


router = APIRouter()

class StatusUpdate(ProviderRecord): # Re-using pydantic model for status update payload
    # Actually main.py defined a specific class for this
    pass

from pydantic import BaseModel
class StatusUpdatePayload(BaseModel):
    status: str

@router.put("/providers/{provider_id}/status", response_model=FrontendProviderRecord)
async def update_status(provider_id: str, update: StatusUpdatePayload):
    updated_record = update_provider_status(provider_id, update.status)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Provider not found")
    return updated_record


@router.post("/upload-complaints")
async def upload_complaints(file: UploadFile = File(...)):
    """
    Upload a complaint directory CSV. This is separate from provider data upload.
    The complaint data is stored in memory and used during validation to cross-reference
    member complaints against validation findings.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    text = content.decode("utf-8")

    complaints_dict = load_complaints_from_text(text)

    # Update global store
    complaint_store.clear()
    complaint_store.update(complaints_dict)
    
    total_complaints = sum(len(v) for v in complaints_dict.values())
    providers_affected = len(complaints_dict)

    print(f"[VERA] Complaint directory uploaded: {total_complaints} complaints across {providers_affected} providers")

    return {
        "status": "success",
        "total_complaints": total_complaints,
        "providers_affected": providers_affected,
        "filename": file.filename,
    }


@router.get("/complaints-status")
async def complaints_status():
    """Check if a complaint directory has been uploaded."""
    total = sum(len(v) for v in complaint_store.values())
    return {
        "loaded": len(complaint_store) > 0,
        "total_complaints": total,
        "providers_affected": len(complaint_store),
    }


@router.delete("/upload-complaints")
async def clear_complaints():
    """Clear the uploaded complaint directory."""
    complaint_store.clear()
    print("[VERA] Complaint directory cleared.")
    return {"status": "cleared"}


@router.post("/historical-data", response_model=AnalysisResult)
async def generate_historical_data(run_efficiently: bool = True):
    """
    Load providers from test_dirty_providers.csv, validate each against
    NPPES + Census Geocoder + Medicare APIs, compute 3D Trust Score,
    and return real analysis results.
    """
    # Check if data already exists in DB (cached from previous run)
    existing_records = get_all_providers()
    records = []

    if existing_records and len(existing_records) > 0:
        print(f"[VERA] Loading {len(existing_records)} cached records from DB")
        records = existing_records

        # Re-apply complaint penalties if complaint directory is uploaded
        complaints_dict = complaint_store
        if complaints_dict:
            print(f"[VERA] Re-applying complaint penalties to {len(records)} cached records...")
            for rec in records:
                provider_complaints = complaints_dict.get(str(rec.npi), [])
                if provider_complaints:
                    # Gather agent thoughts text for cross-referencing
                    all_findings = []
                    if rec.agentThoughts:
                        for t in rec.agentThoughts:
                            thought_text = t.thought if hasattr(t, 'thought') else str(t)
                            all_findings.append(thought_text)
                    all_findings.extend(rec.conflicts or [])

                    complaint_result = cross_reference_complaints(str(rec.npi), provider_complaints, all_findings)

                    if complaint_result["lambda_boost"] > 0:
                        boost = complaint_result["lambda_boost"]
                        current_trust = 100.0 - rec.riskScore
                        adjusted_trust = current_trust * (1.0 - boost)
                        rec.riskScore = round(max(0, min(100, 100.0 - adjusted_trust)), 1)
                        print(f"[VERA]   {rec.name} (NPI: {rec.npi}): {len(provider_complaints)} complaints, boost={boost}, risk→{rec.riskScore}")

                        if rec.riskScore > 70:
                            rec.status = "Flagged"
                        elif rec.riskScore > 35:
                            rec.status = "Review"
                        # Low risk items stay as they were (likely Pending or Verified if already processed)

                    # Add complaint thoughts (avoid duplicates)
                    existing_thoughts = {t.thought for t in (rec.agentThoughts or []) if hasattr(t, 'thought')}
                    for thought in complaint_result["thoughts"]:
                        if thought.thought not in existing_thoughts:
                            rec.agentThoughts.append(thought)
    else:
        # ─── Load CSV ───
        csv_path = os.path.normpath(CSV_PATH)
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=500, detail=f"Dataset not found: {csv_path}")

        print(f"[VERA] Loading providers from {csv_path}")
        csv_rows = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                csv_rows.append(row)

        csv_rows = csv_rows[:PROVIDER_LIMIT]
        total = len(csv_rows)
        print(f"[VERA] Processing {total} providers with real API validation...")

        # Use uploaded complaint directory (if any)
        complaints_dict = complaint_store
        if complaints_dict:
            print(f"[VERA] Using uploaded complaint directory: {sum(len(v) for v in complaints_dict.values())} complaints across {len(complaints_dict)} providers")
        else:
            print(f"[VERA] No complaint directory uploaded. Skipping complaint cross-referencing.")

        # ─── Validate each provider ───
        async with httpx.AsyncClient() as client:
            for idx, row in enumerate(csv_rows):
                npi = row.get("NPI", "")
                name = f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip()
                print(f"[VERA] [{idx+1}/{total}] Validating {name} (NPI: {npi})...")

                provider_input = {
                    "npi": npi,
                    "first_name": row.get("First_Name", ""),
                    "last_name": row.get("Last_Name", ""),
                    "specialty": row.get("Specialty", ""),
                    "state": row.get("State", ""),
                    "address": row.get("Address", ""),
                    "city": row.get("City", ""),
                    "phone": row.get("Phone", "")
                }
                
                try:
                    res = await detailed_agent_service.analyze_provider(provider_input, None, run_efficiently)
                    
                    if "predictive" in res:
                        risk_score = res["predictive"].get("risk_score", 0)
                        conflicts = res["predictive"].get("factors", [])
                        decay_prob = res["predictive"].get("decay_probability", 0.1)
                    else:
                        risk_score = res.get("risk_score", 0)
                        conflicts = res.get("discrepancies", [])
                        decay_prob = res.get("fraud_probability", 10.0) / 100.0
                        
                    status = "Pending"
                    if risk_score > 70:
                        status = "Flagged"
                    elif risk_score > 35:
                        status = "Review"

                    result = {
                        "npi": npi,
                        "name": name,
                        "specialty": row.get("Specialty", "Unknown"),
                        "state": row.get("State", ""),
                        "risk_score": float(risk_score),
                        "decay_prob": float(decay_prob),
                        "status": status,
                        "conflicts": conflicts,
                        "thoughts": res.get("agent_thoughts", []),
                        "last_updated": row.get("Last_Updated", ""),
                        "locations": [{"address": f"{row.get('Address', '')}, {row.get('City', '')} {row.get('State', '')}", "updated": row.get("Last_Updated", "")}],
                        "contact_numbers": [{"number": row.get("Phone", ""), "type": "Office"}] if row.get("Phone") else [],
                    }
                except Exception as e:
                    print(f"[VERA] Error validating {npi}: {e}")
                    # Create a fallback record with error status
                    result = {
                        "npi": npi,
                        "name": name,
                        "specialty": row.get("Specialty", "Unknown"),
                        "state": row.get("State", ""),
                        "risk_score": 50.0,
                        "decay_prob": 0.5,
                        "status": "Review",
                        "conflicts": [f"Validation error: {str(e)[:80]}"],
                        "thoughts": [AgentThought(
                            agentName="Validation Agent",
                            thought=f"API validation failed: {str(e)[:100]}",
                            verdict="warn",
                            timestamp=datetime.datetime.now().isoformat()
                        )],
                        "last_updated": row.get("Last_Updated", ""),
                        "locations": [{"address": f"{row.get('Address', '')}, {row.get('City', '')} {row.get('State', '')}", "updated": row.get("Last_Updated", "")}],
                        "contact_numbers": [{"number": row.get("Phone", ""), "type": "Office"}] if row.get("Phone") else [],
                    }

                # ─── Complaint Directory Cross-Reference ───
                provider_complaints = complaints_dict.get(str(npi), [])
                if provider_complaints:
                    # Collect all validation findings for cross-referencing
                    all_findings = []
                    if isinstance(result.get("thoughts"), list):
                        for t in result["thoughts"]:
                            thought_text = t.thought if hasattr(t, 'thought') else str(t)
                            all_findings.append(thought_text)
                    all_findings.extend(result.get("conflicts", []))

                    complaint_result = cross_reference_complaints(str(npi), provider_complaints, all_findings)

                    # Apply lambda boost to risk score
                    if complaint_result["lambda_boost"] > 0:
                        boost = complaint_result["lambda_boost"]
                        current_trust = 100.0 - result["risk_score"]
                        adjusted_trust = current_trust * (1.0 - boost)
                        result["risk_score"] = round(max(0, min(100, 100.0 - adjusted_trust)), 1)
                        print(f"[VERA]   Complaints: {len(provider_complaints)} filed, boost={boost}, risk {100-current_trust:.1f}→{result['risk_score']:.1f}")

                        # Re-evaluate status after adjustment
                        if result["risk_score"] > 70:
                            result["status"] = "Flagged"
                        elif result["risk_score"] > 35:
                            result["status"] = "Review"

                    # Add complaint agent thoughts
                    if isinstance(result.get("thoughts"), list):
                        result["thoughts"].extend(complaint_result["thoughts"])
                    else:
                        result["thoughts"] = complaint_result.get("thoughts", [])

                # Generate feedback (simulated — no real feedback data in CSV)
                feedback_score = round(random.uniform(2.5, 5.0), 1) if result["status"] == "Verified" else round(random.uniform(1.0, 3.5), 1)
                feedback_data = {
                    "score": feedback_score,
                    "trend": [round(random.uniform(max(1.0, feedback_score - 1), min(5.0, feedback_score + 0.5)), 1) for _ in range(6)],
                    "recent_reviews": (
                        ["Excellent care!", "Very professional staff.", "Best specialist in town."]
                        if feedback_score > 4.0
                        else ["Average experience.", "Good doctor, okay wait times."]
                        if feedback_score > 2.5
                        else ["Difficult to reach.", "Had issues with billing.", "Long wait times."]
                    )
                }

                rec = FrontendProviderRecord(
                    id=f"VERA-{idx + 1}",
                    name=result["name"],
                    npi=str(result["npi"]),
                    specialty=result["specialty"],
                    riskScore=float(result["risk_score"]),
                    decayProb=float(result["decay_prob"]),
                    status=result["status"],
                    conflicts=result["conflicts"],
                    agentThoughts=result["thoughts"],
                    lastUpdated=result.get("last_updated", "") or datetime.datetime.now().isoformat(),
                    state=result["state"],
                    feedback=feedback_data,
                    locations=result["locations"],
                    contact_numbers=result["contact_numbers"]
                )

                records.append(rec)
                save_provider(rec)

                # Rate limiting: 0.5s between API calls to be respectful
                await asyncio.sleep(0.5)

        print(f"[VERA] Validation complete. {len(records)} providers processed.")

    # ─── Calculate Aggregates ───
    total_risk = sum(r.riskScore for r in records)
    avg_risk = round(total_risk / len(records)) if records else 0
    discrepancies = len([r for r in records if r.status != "Verified"])

    # ROI: each verified record saves ~$300/year in prevented claim denials
    verified_count = len([r for r in records if r.status == "Verified"])
    roi = verified_count * 300

    # Timeline Data — simulate progressive validation
    steps = 6
    batch = len(records) // steps if records else 1
    timeline_data = []
    running_disc = 0
    for i in range(steps):
        end_idx = min((i + 1) * batch, len(records))
        batch_records = records[:end_idx]
        batch_disc = len([r for r in batch_records if r.status != "Verified"])
        running_disc = batch_disc
        minutes = i * 5
        timeline_data.append(ChartDataPoint(
            name=f'{minutes:02d}:{0:02d}',
            value=end_idx,
            secondaryValue=running_disc
        ))

    # Risk Distribution
    low_risk = len([r for r in records if r.riskScore <= 30])
    med_risk = len([r for r in records if 30 < r.riskScore <= 70])
    high_risk = len([r for r in records if r.riskScore > 70])

    risk_distribution = [
        ChartDataPoint(name='Low Risk', value=low_risk),
        ChartDataPoint(name='Medium Risk', value=med_risk),
        ChartDataPoint(name='High Risk', value=high_risk)
    ]

    now_iso = datetime.datetime.now().isoformat()
    return AnalysisResult(
        roi=roi,
        fraudRiskScore=avg_risk,
        providersProcessed=len(records),
        discrepanciesFound=discrepancies,
        timelineData=timeline_data,
        riskDistribution=risk_distribution,
        records=records,
        agentLogs=[
            {"agent": "ORCHESTRATOR", "log": f"Loaded {len(records)} providers from test_dirty_providers.csv", "timestamp": now_iso},
            {"agent": "VALIDATION", "log": f"Cross-validated against NPPES, Census Geocoder, and Medicare APIs", "timestamp": now_iso},
            {"agent": "FRAUD", "log": f"Identified {discrepancies} discrepancies via 3D Trust Score analysis", "timestamp": now_iso},
            {"agent": "DEGRADATION", "log": f"Computed decay probabilities for all {len(records)} records", "timestamp": now_iso},
            {"agent": "GRAPHICAL", "log": "Heatmap and risk distribution data aggregated.", "timestamp": now_iso}
        ],
        summary=f'Validated {len(records)} providers. Found {discrepancies} discrepancies. Trust Score: avg {100 - avg_risk}/100.'
    )


async def run_validation_workflow(job_id: str, provider_data: ProviderRecord):
    print(f"Starting workflow for Job {job_id}")
    initial_state = MainAgentState(job_id=job_id, provider_data=provider_data)
    try:
        final_state = await orchestrator_graph.ainvoke(initial_state)
        job_store[job_id] = final_state
        print(f"Job {job_id} completed.")
    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        initial_state.errors.append(str(e))
        job_store[job_id] = initial_state


@router.get("/")
async def root():
    return {"message": "Multi-Agent Validation System is Online"}


@router.post("/ingest")
async def ingest_provider_data(files: List[UploadFile], background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    upload_dir = os.path.join(os.getcwd(), "uploads", job_id)
    os.makedirs(upload_dir, exist_ok=True)
    # Load entire dirty dataset
    csv_file_path = os.path.join("data", "csvs", "test_dirty_providers_with_docs.csv")
    if not os.path.exists(csv_file_path):
        # Fallback to the original dirty one if with_docs doesn't exist
        csv_file_path = os.path.join("data", "csvs", "test_dirty_providers.csv")
        if not os.path.exists(csv_file_path):
            csv_file_path = "test_dirty_providers.csv"

    providers = []
    saved_files = []
    for file in files:
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        saved_files.append(file_path)

    # Initialize state with file paths
    # We use a dummy provider record initially, populated by the parser later
    provider = ProviderRecord(raw_data={"files": saved_files})
    
    job_store[job_id] = {"status": "processing", "provider": provider}
    background_tasks.add_task(run_validation_workflow, job_id, provider)
    return {"job_id": job_id, "status": "queued"}


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_data = job_store[job_id]
    
    # If still processing (dict)
    if isinstance(job_data, dict):
        return {"job_id": job_id, "status": "processing"}
    
    # If completed specific State object
    if isinstance(job_data, MainAgentState):
        # Transform to AnalysisResult
        final_state = job_data
        
        # Construct detailed agent thoughts
        thoughts = []
        if final_state.validation_result:
            thoughts.append(AgentThought(
                agentName="Validation Agent",
                thought=final_state.validation_result.details,
                verdict="pass" if final_state.validation_result.npi_valid else "fail",
                timestamp=datetime.datetime.now().isoformat()
            ))
        if final_state.fraud_analysis:
            thoughts.append(AgentThought(
                agentName="Fraud Detection",
                thought=f"Risk Score: {final_state.fraud_analysis.risk_score}. Flags: {final_state.fraud_analysis.flagged_patterns}",
                verdict="pass" if final_state.fraud_analysis.risk_score < 50 else "warn",
                timestamp=datetime.datetime.now().isoformat()
            ))
        
        # Single Record for the ingested file
        record = FrontendProviderRecord(
            id=final_state.provider_data.id,
            name=f"{final_state.provider_data.first_name} {final_state.provider_data.last_name}" if final_state.provider_data.first_name else "Unknown Provider",
            npi=final_state.provider_data.npi or "N/A",
            specialty="Unknown",
            riskScore=final_state.fraud_analysis.risk_score if final_state.fraud_analysis else 0,
            decayProb=0.1, # Mock
            status="Verified" if not final_state.business_impact or final_state.business_impact.estimated_savings == 0 else "Flagged",
            conflicts=final_state.fraud_analysis.flagged_patterns if final_state.fraud_analysis else [],
            agentThoughts=thoughts,
            lastUpdated=datetime.datetime.now().isoformat(),
            state=random.choice(STATES)
        )
        
        result = AnalysisResult(
            roi=final_state.business_impact.estimated_savings if final_state.business_impact else 0,
            fraudRiskScore=final_state.fraud_analysis.risk_score if final_state.fraud_analysis else 0,
            providersProcessed=1,
            discrepanciesFound=len(final_state.fraud_analysis.flagged_patterns) if final_state.fraud_analysis else 0,
            timelineData=[ChartDataPoint(name="Now", value=1)],
            riskDistribution=[ChartDataPoint(name="Low", value=1)],
            records=[record],
            agentLogs=[{"agent": "ORCHESTRATOR", "log": "Processing completed.", "timestamp": datetime.datetime.now().isoformat()}],
            summary=final_state.business_impact.notes if final_state.business_impact else "Analysis complete."
        )
        
        return {
            "job_id": job_id,
            "status": "completed",
            "analysis_result": result.dict()
        }
    
    return {"job_id": job_id, "status": "unknown"}


@router.post("/upload-csv", response_model=AnalysisResult)
async def upload_csv(file: UploadFile = File(...), run_efficiently: bool = True):
    """
    Accept a CSV file upload, validate all providers through the same pipeline
    as /demo-data (NPPES + Census + Medicare + Complaints), and return results.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    text = content.decode("utf-8")

    # Parse CSV
    import io as _io
    reader = csv.DictReader(_io.StringIO(text))
    csv_rows = list(reader)

    if not csv_rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no valid rows")

    csv_rows = csv_rows[:PROVIDER_LIMIT]
    total = len(csv_rows)
    print(f"[VERA] CSV Upload: Processing {total} providers...")

    # Use uploaded complaint directory (if any)
    complaints_dict = complaint_store

    records = []
    async with httpx.AsyncClient() as client:
        for idx, row in enumerate(csv_rows):
            npi = row.get("NPI", "")
            name = f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip()
            print(f"[VERA] [{idx+1}/{total}] Validating {name} (NPI: {npi})...")

            provider_input = {
                "npi": npi,
                "first_name": row.get("First_Name", ""),
                "last_name": row.get("Last_Name", ""),
                "specialty": row.get("Specialty", ""),
                "state": row.get("State", ""),
                "address": row.get("Address", ""),
                "city": row.get("City", ""),
                "phone": row.get("Phone", "")
            }
            try:
                res = await detailed_agent_service.analyze_provider(provider_input, None, run_efficiently)
                
                if "predictive" in res:
                    risk_score = res["predictive"].get("risk_score", 0)
                    conflicts = res["predictive"].get("factors", [])
                    decay_prob = res["predictive"].get("decay_probability", 0.1)
                else:
                    risk_score = res.get("risk_score", 0)
                    conflicts = res.get("discrepancies", [])
                    decay_prob = res.get("fraud_probability", 10.0) / 100.0
                    
                status = "Pending"
                if risk_score > 70:
                    status = "Flagged"
                elif risk_score > 35:
                    status = "Review"

                result = {
                    "npi": npi,
                    "name": name,
                    "specialty": row.get("Specialty", "Unknown"),
                    "state": row.get("State", ""),
                    "risk_score": float(risk_score),
                    "decay_prob": float(decay_prob),
                    "status": status,
                    "conflicts": conflicts,
                    "thoughts": res.get("agent_thoughts", []),
                    "last_updated": row.get("Last_Updated", ""),
                    "locations": [{"address": f"{row.get('Address', '')}, {row.get('City', '')} {row.get('State', '')}", "updated": row.get("Last_Updated", "")}],
                    "contact_numbers": [{"number": row.get("Phone", ""), "type": "Office"}] if row.get("Phone") else [],
                }
            except Exception as e:
                print(f"[VERA] Error validating {npi}: {e}")
                result = {
                    "npi": npi,
                    "name": name,
                    "specialty": row.get("Specialty", "Unknown"),
                    "state": row.get("State", ""),
                    "risk_score": 50.0,
                    "decay_prob": 0.5,
                    "status": "Review",
                    "conflicts": [f"Validation error: {str(e)[:80]}"],
                    "thoughts": [AgentThought(
                        agentName="Validation Agent",
                        thought=f"API validation failed: {str(e)[:100]}",
                        verdict="warn",
                        timestamp=datetime.datetime.now().isoformat()
                    )],
                    "last_updated": row.get("Last_Updated", ""),
                    "locations": [{"address": f"{row.get('Address', '')}, {row.get('City', '')} {row.get('State', '')}", "updated": row.get("Last_Updated", "")}],
                    "contact_numbers": [{"number": row.get("Phone", ""), "type": "Office"}] if row.get("Phone") else [],
                }

            # Complaint cross-reference
            provider_complaints = complaints_dict.get(str(npi), [])
            if provider_complaints:
                all_findings = []
                if isinstance(result.get("thoughts"), list):
                    for t in result["thoughts"]:
                        thought_text = t.thought if hasattr(t, 'thought') else str(t)
                        all_findings.append(thought_text)
                all_findings.extend(result.get("conflicts", []))

                complaint_result = cross_reference_complaints(str(npi), provider_complaints, all_findings)

                if complaint_result["lambda_boost"] > 0:
                    boost = complaint_result["lambda_boost"]
                    current_trust = 100.0 - result["risk_score"]
                    adjusted_trust = current_trust * (1.0 - boost)
                    result["risk_score"] = round(max(0, min(100, 100.0 - adjusted_trust)), 1)

                    if result["risk_score"] > 70:
                        result["status"] = "Flagged"
                    elif result["risk_score"] > 35:
                        result["status"] = "Review"

                if isinstance(result.get("thoughts"), list):
                    result["thoughts"].extend(complaint_result["thoughts"])

            # Force "Verified" to "Pending" for initial review
            if result["status"] == "Verified":
                result["status"] = "Pending"

            # Feedback
            feedback_score = round(random.uniform(2.5, 5.0), 1) if result["status"] == "Verified" else round(random.uniform(1.0, 3.5), 1)
            feedback_data = {
                "score": feedback_score,
                "trend": [round(random.uniform(max(1.0, feedback_score - 1), min(5.0, feedback_score + 0.5)), 1) for _ in range(6)],
                "recent_reviews": (
                    ["Excellent care!", "Very professional staff."] if feedback_score > 4.0
                    else ["Average experience."] if feedback_score > 2.5
                    else ["Difficult to reach.", "Had issues with billing."]
                )
            }

            rec = FrontendProviderRecord(
                id=f"UPLOAD-{idx + 1}",
                name=result["name"],
                npi=str(result["npi"]),
                specialty=result["specialty"],
                riskScore=float(result["risk_score"]),
                decayProb=float(result["decay_prob"]),
                status=result["status"],
                conflicts=result["conflicts"],
                agentThoughts=result["thoughts"],
                lastUpdated=result.get("last_updated", "") or datetime.datetime.now().isoformat(),
                state=result["state"],
                feedback=feedback_data,
                locations=result["locations"],
                contact_numbers=result["contact_numbers"]
            )
            records.append(rec)
            save_provider(rec)

            import asyncio as _asyncio
            await _asyncio.sleep(0.5)

    print(f"[VERA] CSV Upload complete. {len(records)} providers processed.")

    # Aggregates
    total_risk = sum(r.riskScore for r in records)
    avg_risk = round(total_risk / len(records)) if records else 0
    discrepancies = len([r for r in records if r.status != "Verified"])
    verified_count = len([r for r in records if r.status == "Verified"])
    roi = verified_count * 300

    # Timeline
    steps = min(6, len(records))
    batch_size = len(records) // steps if steps > 0 else 1
    timeline_data = []
    for i in range(steps):
        end_idx = min((i + 1) * batch_size, len(records))
        batch_records = records[:end_idx]
        batch_disc = len([r for r in batch_records if r.status != "Verified"])
        timeline_data.append(ChartDataPoint(name=f'{i * 5:02d}:00', value=end_idx, secondaryValue=batch_disc))

    risk_distribution = [
        ChartDataPoint(name='Low (0-35)', value=len([r for r in records if r.riskScore <= 35])),
        ChartDataPoint(name='Medium (35-70)', value=len([r for r in records if 35 < r.riskScore <= 70])),
        ChartDataPoint(name='High (70-100)', value=len([r for r in records if r.riskScore > 70])),
    ]

    now_iso = datetime.datetime.now().isoformat()
    return AnalysisResult(
        roi=roi,
        fraudRiskScore=avg_risk,
        providersProcessed=len(records),
        discrepanciesFound=discrepancies,
        timelineData=timeline_data,
        riskDistribution=risk_distribution,
        records=records,
        agentLogs=[
            {"agent": "ORCHESTRATOR", "log": f"Uploaded CSV: {file.filename} ({len(records)} providers)", "timestamp": now_iso},
            {"agent": "VALIDATION", "log": "Cross-validated against NPPES, Census Geocoder, and Medicare APIs", "timestamp": now_iso},
            {"agent": "COMPLAINT", "log": f"Cross-referenced against complaint directory", "timestamp": now_iso},
            {"agent": "FRAUD", "log": f"Identified {discrepancies} discrepancies via 3D Trust Score", "timestamp": now_iso},
        ],
        summary=f'CSV Upload: Validated {len(records)} providers. Found {discrepancies} discrepancies. Trust Score avg: {100 - avg_risk}/100.'
    )


@router.post("/bulk-approve")
async def bulk_approve_safe_records():
    """
    Finds all records with status 'Pending' and risk score <= 35 (Low Risk),
    and updates them to 'Verified'.
    """
    all_records = get_all_providers()
    count = 0
    for record in all_records:
        if record.status == "Pending" and record.riskScore <= 35:
            record.status = "Verified"
            record.lastUpdated = datetime.datetime.now().isoformat()
            save_provider(record)
            count += 1
    
    print(f"[VERA] Bulk approved {count} low-risk pending records.")
    return {"count": count, "message": f"Successfully verified {count} records."}

@router.post("/upload-ocr")
async def upload_ocr(file: UploadFile = File(...)):
    """
    Accept an image or PDF file, run OCR to extract text,
    and parse structured provider fields from the extracted text.
    """
    allowed_exts = (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp", ".pdf")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Accepted: {', '.join(allowed_exts)}"
        )

    content = await file.read()
    print(f"[VERA] OCR Upload: Processing {file.filename} ({len(content)} bytes)...")

    # Extract text
    raw_text = extract_text(content, file.filename)
    print(f"[VERA] OCR extracted {len(raw_text)} characters")

    # Parse fields
    fields = parse_provider_fields(raw_text)
    fields["source_filename"] = file.filename

    return {
        "status": "success",
        "filename": file.filename,
        "raw_text": raw_text,
        "extracted_fields": fields,
    }


@router.post("/manual-entry/analyze")
async def analyze_manual_entry(
    data: str = Form(...),
    file: UploadFile = File(None),
    run_efficiently: bool = True
):
    """
    Detailed analysis of a single manually entered provider.
    Runs Validation, Predictive, and ROI agents and returns rich feedback.
    """
    try:
        # Parse the JSON string form data
        provider_data = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")

    # Handle file if present
    file_path = None
    if file:
        job_id = str(uuid.uuid4())
        upload_dir = os.path.join(os.getcwd(), "uploads", "manual", job_id)
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

    # Run analysis
    try:
        results = await detailed_agent_service.analyze_provider(provider_data, file_path, run_efficiently)
        
        # Format the result into a FrontendProviderRecord standard
        status = "Verified"
        
        # Handle fast-path vs immersive-path return shapes
        if "predictive" in results:
            risk_score = results["predictive"].get("risk_score", 0)
            conflicts = results["predictive"].get("factors", [])
            decay_prob = results["predictive"].get("decay_probability", 0.1)
        else:
            risk_score = results.get("risk_score", 0)
            conflicts = results.get("discrepancies", [])
            decay_prob = results.get("fraud_probability", 10.0) / 100.0
            
        if risk_score > 70:
            status = "Flagged"
        elif risk_score > 35:
            status = "Review"
            
        record = {
            "id": f"MANUAL-{str(uuid.uuid4())[:8]}",
            "name": f"{provider_data.get('first_name', '')} {provider_data.get('last_name', '')}".strip() or "Unknown Provider",
            "npi": provider_data.get("npi", "N/A"),
            "specialty": provider_data.get("specialty", "Unknown"),
            "riskScore": float(risk_score),
            "decayProb": float(decay_prob),
            "status": status,
            "state": provider_data.get("state", ""),
            "conflicts": conflicts,
            "lastUpdated": datetime.datetime.now().isoformat(),
            "agentThoughts": results.get("agent_thoughts", []),
            "complaints": [],
            "locations": [{"address": f"Unknown Location, {provider_data.get('state', '')}", "updated": datetime.datetime.now().isoformat()}],
            "contact_numbers": []
        }
        
        return {"record": record}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
