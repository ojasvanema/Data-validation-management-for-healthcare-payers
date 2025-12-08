from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .models import ProviderRecord, MainAgentState
from .graph import orchestrator_graph
from .agents.batch_business import batch_business_agent
import uuid
import asyncio

from . import database
import json

app = FastAPI(title="Healthcare Data Validation System", version="1.0.0")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

async def run_validation_workflow(job_id: str, provider_data: ProviderRecord):
    """Runs the LangGraph workflow in the background."""
    print(f"Starting workflow for Job {job_id}")
    
    initial_state = MainAgentState(
        job_id=job_id,
        provider_data=provider_data
    )
    
    try:
        final_state = await orchestrator_graph.ainvoke(initial_state)
        # Convert state to dict for storage
        state_dict = final_state.dict() if hasattr(final_state, 'dict') else final_state
        database.update_job_result(job_id, state_dict)
        
        print(f"DEBUG: Job {job_id} COMPLETED successfully.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DEBUG: Job {job_id} FAILED with error: {e}")
        # Update job store with error (basic error persistence)
        # In a real app we might specific error column, here we just dump state with error
        initial_state.errors.append(str(e))
        state_dict = initial_state.dict()
        database.update_job_result(job_id, state_dict)

@app.get("/")
async def root():
    return {"message": "Multi-Agent Validation System is Online"}

@app.post("/ingest")
async def ingest_provider_data(providers: List[ProviderRecord], background_tasks: BackgroundTasks):
    """
    Ingests a BATCH of provider records and starts validation for all of them.
    Returns a batch_id.
    """
    batch_id = str(uuid.uuid4())
    
    # create batch
    database.create_batch(batch_id, len(providers))
    
    count = 0 
    for provider in providers:
        job_id = str(uuid.uuid4())
        
        # Create job in DB
        database.create_job(job_id, batch_id, provider.dict())
        
        # Start background task
        background_tasks.add_task(run_validation_workflow, job_id, provider)
        count += 1
    
    return {"batch_id": batch_id, "status": "queued", "count": count, "message": "Batch validation started"}
    
    return {"batch_id": batch_id, "status": "queued", "count": len(providers), "message": "Batch validation started"}

@app.get("/status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Aggregates status for all jobs in a batch."""
    batch_data = database.get_batch(batch_id)
    
    if not batch_data:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    jobs = batch_data["jobs_data"]
    total_jobs = len(jobs)
    
    total_savings = 0.0
    fraud_risk_accum = 0.0
    discrepancies_count = 0
    completed_count = 0
    records = []
    
    risk_level = "LOW" 
    
    for job in jobs:
        # job is a dict with keys: id, status, provider_data (str), result_state (str)
        job_id = job["id"]
        status = job["status"]
        
        if status == "completed" and job["result_state"]:
            completed_count += 1
            result_state = json.loads(job["result_state"])
            
            # Reconstruct MainAgentState wrapper for easier traversing or just use dict
            job_data = result_state
            
             # Aggregate Metrics
            if job_data.get("business_impact"):
                total_savings += job_data["business_impact"].get("estimated_savings", 0)
            
            if job_data.get("fraud_analysis"):
                risk = job_data["fraud_analysis"].get("risk_score", 0)
                level = job_data["fraud_analysis"].get("risk_level", "UNKNOWN")
                
                fraud_risk_accum += risk
                if level == "HIGH":
                    risk_level = "HIGH"
                elif level == "MEDIUM" and risk_level != "HIGH":
                     risk_level = "MEDIUM"
            
            if job_data.get("validation_result") and not job_data["validation_result"].get("is_consistent"):
                 # Assuming conflicts is a list
                 conflicts = job_data["validation_result"].get("conflicts", [])
                 discrepancies_count += len(conflicts)
            
            records.append({
                "job_id": job_id,
                "status": "completed",
                "provider_data": job_data.get("provider_data"),
                "parsed_data": job_data.get("parsed_data"),
                "validation_result": job_data.get("validation_result"),
                "fraud_analysis": job_data.get("fraud_analysis"),
                "business_impact": job_data.get("business_impact"),
                "degradation_prediction": job_data.get("degradation_prediction"),
                "graphical_data": job_data.get("graphical_data")
            })
        else:
             records.append({
                "job_id": job_id,
                "status": "processing"
            })
            
    is_complete = completed_count == total_jobs and total_jobs > 0
    
    # --- Batch Agent Execution ---
    # If complete and no analysis result in DB, run the Batch Agent
    batch_analysis = batch_data.get("analysis_result")
    
    if is_complete and not batch_analysis:
        # Run Batch Agent (Reduce Step)
        batch_analysis = batch_business_agent.analyze_batch(jobs)
        database.update_batch_analysis(batch_id, batch_analysis)
    
    # Prepare Response
    avg_risk_score = fraud_risk_accum / total_jobs if total_jobs > 0 else 0
    
    # Overwrite/Enrich with Batch Agent results if available
    if batch_analysis:
        roi = batch_analysis.get("total_estimated_savings", total_savings)
        # Use portfolio risk instead of simple average if we want strictness, 
        # but for frontend "Fraud Risk Score" simple average is usually expected unless we relabel.
        # Let's keep simple average for the chart, but maybe use portfolio risk for risk level logic?
        pass 
    else:
        roi = total_savings

    return {
        "batch_id": batch_id,
        "is_complete": is_complete,
        "progress": f"{completed_count}/{total_jobs}",
        "roi": roi,
        "fraud_risk_score": avg_risk_score,
        "risk_level": risk_level,
        "discrepancies_found": discrepancies_count,
        "records": records,
        # Add extra info if frontend supports it
        "batch_analysis": batch_analysis 
    }

@app.get("/dashboard/stats")
async def get_dashboard_stats():
    """Returns aggregated stats for the Live Dashboard."""
    
    jobs = database.get_all_jobs_summary()
    
    total_jobs = len(jobs)
    completed = 0
    fraud_flags = 0
    total_savings = 0.0
    
    for job in jobs:
        if job["status"] == "completed" and job["result_state"]:
            completed += 1
            try:
                state = json.loads(job["result_state"])
                if state.get("fraud_analysis") and state["fraud_analysis"].get("risk_level") in ["HIGH", "MEDIUM"]:
                    fraud_flags += 1
                if state.get("business_impact"):
                    total_savings += state["business_impact"].get("estimated_savings", 0)
            except:
                pass
                
    return {
        "active_agents": 7, # Constant based on architecture
        "total_records_processed": total_jobs,
        "completed_validations": completed,
        "fraud_flags_detected": fraud_flags,
        "est_financial_impact": total_savings
    }
