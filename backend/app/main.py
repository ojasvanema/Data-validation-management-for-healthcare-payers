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
from typing import List
from fastapi import UploadFile, File

app = FastAPI(title="Healthcare Data Validation System", version="1.0.0")

STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
SPECIALTIES = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Radiology', 'Surgery', 'Urology']

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
    # Check if data exists
    existing_records = get_all_providers()
    records = []

    if existing_records and len(existing_records) > 0:
        records = existing_records
    else:
        # Generate new data if empty
        for i in range(100):
            risk_score = random.randint(0, 100)
            status = "Verified"
            if risk_score > 80:
                status = "Flagged"
            elif risk_score > 50:
                status = "Review"
                
            conflicts = []
            if risk_score > 70:
                conflicts = ['NPI Mismatch', 'License Expired']

            # --- Enhanced Data Generation ---
            # Feedback
            feedback_score = round(random.uniform(1.0, 5.0), 1)
            feedback_trend = [round(random.uniform(2.0, 5.0), 1) for _ in range(6)]
            
            recent_reviews = []
            if feedback_score < 3.0:
                 recent_reviews = [
                     "Doctor is always late.", 
                     "Front desk is rude.", 
                     "Hard to get an appointment."
                 ]
            elif feedback_score > 4.5:
                 recent_reviews = [
                     "Excellent care!", 
                     "Very professional staff.", 
                     "Best specialist in town."
                 ]
            else:
                 recent_reviews = ["Average experience.", "Good doctor, bad wait times."]
                 
            feedback_data = {
                "score": feedback_score,
                "trend": feedback_trend,
                "recent_reviews": recent_reviews
            }

            # Locations (List)
            locations = [{"address": f"{random.randint(100, 999)} Main St, {random.choice(STATES)}", "updated": "2024-01-15"}]
            if random.random() > 0.7: # 30% chance of multiple locations (mover)
                 locations.append({"address": f"{random.randint(1, 99)} Old Rd, {random.choice(STATES)}", "updated": "2023-05-10"})
            if random.random() > 0.9: # 10% chance of 3 locations
                 locations.append({"address": f"{random.randint(500, 600)} Clinic Ave, {random.choice(STATES)}", "updated": "2022-11-20"})
                 
            # Contact Numbers (List)
            contact_numbers = []
            if random.random() > 0.1: # 90% chance of at least one number
                 contact_numbers.append({"number": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}", "type": "Office"})
            
            if random.random() > 0.4: # 60% chance of a second number
                 contact_numbers.append({"number": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}", "type": "Mobile"})

            if random.random() > 0.8: # 20% chance of a third number
                 contact_numbers.append({"number": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}", "type": "Fax"})

            rec = FrontendProviderRecord(
                id=f"DUMMY-{i + 1}",
                name=f"Dr. Generated {i + 1}",
                npi=f"999{random.randint(1000000, 9999999)}",
                specialty=random.choice(SPECIALTIES),
                riskScore=float(risk_score),
                decayProb=random.random(),
                status=status,
                conflicts=conflicts,
                agentThoughts=[],
                lastUpdated=datetime.datetime.now().isoformat(),
                state=random.choice(STATES),
                feedback=feedback_data,
                locations=locations,
                contact_numbers=contact_numbers
            )

            # Detailed Agent Thoughts Generation
            thoughts = []
            now_str = datetime.datetime.now().isoformat()

            # 1. Validation Agent
            if len(locations) > 2:
                 thoughts.append(AgentThought(
                    agentName="Validation Agent",
                    thought=f"Frequent address changes detected ({len(locations)} locations). Flagging for stability check.",
                    verdict="warn",
                    timestamp=now_str
                ))
            
            if status == "Verified":
                thoughts.append(AgentThought(
                    agentName="Validation Agent",
                    thought="Confirmed NPI exists in NPPES registry. License active and in good standing.",
                    verdict="pass",
                    timestamp=now_str
                ))
            elif status == "Review":
                thoughts.append(AgentThought(
                    agentName="Validation Agent",
                    thought="NPI valid, but primary license expires in < 30 days. Requires manual check.",
                    verdict="warn",
                    timestamp=now_str
                ))
            else: # Flagged
                thoughts.append(AgentThought(
                    agentName="Validation Agent",
                    thought=f"CRITICAL: NPI/License mismatch detected. {'License Expired' if 'License Expired' in conflicts else 'NPI not found in registry'}.",
                    verdict="fail",
                    timestamp=now_str
                ))

            # 2. Fraud Detection Agent
            # Check for review bombing
            avg_last_3 = sum(feedback_trend[-3:]) / 3
            if avg_last_3 < 2.0 and feedback_score > 4.0:
                 thoughts.append(AgentThought(
                    agentName="Fraud Detection",
                    thought="Suspicious drop in recent feedback trend despite high overall score. Potential review bombing or service degradation.",
                    verdict="warn",
                    timestamp=now_str
                ))

            if risk_score > 80:
                thoughts.append(AgentThought(
                    agentName="Fraud Detection",
                    thought="Detected billing frequency 300% above regional average for this specialty.",
                    verdict="fail",
                    timestamp=now_str
                ))
                if "OIG Exclusion Match" in conflicts:
                    thoughts.append(AgentThought(
                        agentName="Fraud Detection",
                        thought="Provider name fuzzy-matches entry in OIG Exclusion List.",
                        verdict="fail",
                        timestamp=now_str
                    ))
            elif risk_score > 50:
                 thoughts.append(AgentThought(
                    agentName="Fraud Detection",
                    thought="Minor anomalies in claim submission timestamps. Monitoring recommended.",
                    verdict="warn",
                    timestamp=now_str
                ))
            else:
                thoughts.append(AgentThought(
                    agentName="Fraud Detection",
                    thought="No abnormal billing or claim patterns detected in historical data.",
                    verdict="pass",
                    timestamp=now_str
                ))

            # 3. Predictive Degradation Agent
            decay_val = rec.decayProb
            # Correlate feedback with decay
            if feedback_score < 2.5:
                 decay_val += 0.2 # Low feedback increases decay risk
                 thoughts.append(AgentThought(
                    agentName="Predictive Degradation",
                    thought=f"Low feedback score ({feedback_score}) highly correlated with future data obsolescence. Adjusted decay probability.",
                    verdict="warn",
                    timestamp=now_str
                ))

            if decay_val > 0.7:
                 thoughts.append(AgentThought(
                    agentName="Predictive Degradation",
                    thought=f"High decay probability ({decay_val:.2f}). Contact information likely to become obsolete within 60 days based on peer turnover models.",
                    verdict="fail",
                    timestamp=now_str
                ))
            elif decay_val > 0.3:
                 thoughts.append(AgentThought(
                    agentName="Predictive Degradation",
                    thought=f"Moderate decay risk ({decay_val:.2f}). Regular quarterly validation recommended.",
                    verdict="neutral",
                    timestamp=now_str
                ))
            else:
                 thoughts.append(AgentThought(
                    agentName="Predictive Degradation",
                    thought="Data freshness verified. Low risk of immediate obsolescence.",
                    verdict="pass",
                    timestamp=now_str
                ))

            # 4. Communicator Agent
            if status == "Flagged":
                 thoughts.append(AgentThought(
                    agentName="Communicator",
                    thought="Drafted 'Urgent Credential Update Request' email to provider office.",
                    verdict="neutral",
                    timestamp=now_str
                ))
            elif status == "Review":
                 thoughts.append(AgentThought(
                    agentName="Communicator",
                    thought="Scheduled automated follow-up call for license renewal reminder.",
                    verdict="neutral",
                    timestamp=now_str
                ))

            rec.agentThoughts = thoughts
            records.append(rec)
            save_provider(rec)

    # Calculate Aggregates
    total_risk = sum(r.riskScore for r in records)
    avg_risk = round(total_risk / len(records)) if records else 0
    discrepancies = len([r for r in records if r.status != "Verified"])
    roi = (len(records) - discrepancies) * 5000

    # Timeline Data (Mock)
    timeline_data = [
        ChartDataPoint(name='09:00', value=10, secondaryValue=0),
        ChartDataPoint(name='09:05', value=25, secondaryValue=2),
        ChartDataPoint(name='09:10', value=45, secondaryValue=5),
        ChartDataPoint(name='09:15', value=70, secondaryValue=8),
        ChartDataPoint(name='09:20', value=90, secondaryValue=12),
        ChartDataPoint(name='09:25', value=100, secondaryValue=discrepancies)
    ]

    # Risk Distribution
    low_risk = len([r for r in records if r.riskScore <= 30])
    med_risk = len([r for r in records if 30 < r.riskScore <= 70])
    high_risk = len([r for r in records if r.riskScore > 70])

    risk_distribution = [
        ChartDataPoint(name='Low Risk', value=low_risk),
        ChartDataPoint(name='Medium Risk', value=med_risk),
        ChartDataPoint(name='High Risk', value=high_risk)
    ]

    return AnalysisResult(
        roi=roi,
        fraudRiskScore=avg_risk,
        providersProcessed=len(records),
        discrepanciesFound=discrepancies,
        timelineData=timeline_data,
        riskDistribution=risk_distribution,
        records=records,
        agentLogs=[
            {"agent": "ORCHESTRATOR", "log": "Initiated dummy data generation.", "timestamp": datetime.datetime.now().isoformat()},
            {"agent": "DOCUMENT", "log": f"Parsed {len(records)} records from database.", "timestamp": datetime.datetime.now().isoformat()},
            {"agent": "GRAPHICAL", "log": "Heatmap data aggregated.", "timestamp": datetime.datetime.now().isoformat()}
        ],
        summary=f'Loaded {len(records)} records.'
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
