from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
from .models import (
    ProviderRecord, MainAgentState, AnalysisResult, 
    FrontendProviderRecord, AgentThought, ChartDataPoint
)
from .graph import orchestrator_graph
import uuid
import datetime
import os
import csv
import httpx
from typing import List
from fastapi import UploadFile, File

from .validation_service import validate_single_provider

app = FastAPI(title="VERA — Validation & Enrichment for Reliable Access", version="2.0.0")

STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
SPECIALTIES = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Radiology', 'Surgery', 'Urology']

# Path to the dirty dataset (relative to project root)
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "test_dirty_providers.csv")
PROVIDER_LIMIT = 50  # Process first N providers to keep API calls manageable

from .database import init_db, save_provider, get_all_providers, update_provider_status
from pydantic import BaseModel

# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()

class StatusUpdate(BaseModel):
    status: str

@app.put("/providers/{provider_id}/status", response_model=FrontendProviderRecord)
async def update_status(provider_id: str, update: StatusUpdate):
    updated_record = update_provider_status(provider_id, update.status)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Provider not found")
    return updated_record

@app.post("/demo-data", response_model=AnalysisResult)
async def generate_demo_data():
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

        # ─── Validate each provider ───
        async with httpx.AsyncClient() as client:
            for idx, row in enumerate(csv_rows):
                npi = row.get("NPI", "")
                name = f"{row.get('First_Name', '')} {row.get('Last_Name', '')}".strip()
                print(f"[VERA] [{idx+1}/{total}] Validating {name} (NPI: {npi})...")

                try:
                    result = await validate_single_provider(row, client)
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
                import asyncio
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_store = {}

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

@app.get("/")
async def root():
    return {"message": "Multi-Agent Validation System is Online"}

@app.post("/ingest")
async def ingest_provider_data(files: List[UploadFile], background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    upload_dir = os.path.join(os.getcwd(), "uploads", job_id)
    os.makedirs(upload_dir, exist_ok=True)
    
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

@app.get("/status/{job_id}")
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
