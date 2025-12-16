from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import (
    ProviderRecord, MainAgentState, AnalysisResult, 
    FrontendProviderRecord, AgentThought, ChartDataPoint
)
from .graph import orchestrator_graph
import uuid
import datetime

app = FastAPI(title="Healthcare Data Validation System", version="1.0.0")

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
async def ingest_provider_data(data: dict, background_tasks: BackgroundTasks):
    # Frontend sends { raw_data: { files: [...] } }
    # We create a dummy provider record from it
    provider = ProviderRecord(raw_data=data.get("raw_data", {}))
    
    job_id = str(uuid.uuid4())
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
            lastUpdated=datetime.datetime.now().isoformat()
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
