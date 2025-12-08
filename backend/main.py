from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import shutil
import os
import uuid
import json

from backend.agents.validation_agent import ValidationAgent
from backend.agents.predictive_agent import PredictiveAgent
from backend.agents.document_agent import DocumentAgent

app = FastAPI(title="EY Techathon 6.0 Provider Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helpers
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Agents
val_agent = ValidationAgent()
pred_agent = PredictiveAgent()
doc_agent = DocumentAgent()

class ProviderInput(BaseModel):
    npi: str
    name: str
    license_number: str
    address: str
    specialty: str
    last_updated: Optional[str] = None

@app.post("/api/orchestrate")
async def orchestrate(
    npi: str = Form(...),
    name: str = Form(...),
    license_number: str = Form(...),
    address: str = Form(...),
    specialty: str = Form(...),
    last_updated: str = Form(None),
    file: UploadFile = File(None)
):
    """
    Main entry point. Ingests data (and optional document), checks for fraud, 
    validates with 15+ sources, and predicts degradation.
    """
    
    # 1. Ingest Document if present
    document_data = {}
    if file:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse document
        ingest_res = doc_agent.ingest_file(file_path)
        if ingest_res.get('status') == 'success':
            document_data = ingest_res['parsed']
    
    # Construct structured data (merging doc data could happen here, keeping simple for now)
    provider_data = {
        "npi": npi,
        "name": name,
        "license_number": license_number,
        "address": address,
        "specialty": specialty,
        "last_updated": last_updated
    }
    
    # 2. Validation
    validation_results = val_agent.validate_provider(provider_data)
    
    # 3. Prediction
    prediction_results = pred_agent.predict_risk(provider_data)
    
    # 4. Construct Final Response
    response = {
        "status": "success",
        "provider_profile": provider_data,
        "validation_report": validation_results,
        "predictive_analysis": prediction_results,
        "document_analysis": {
            "has_document": file is not None,
            "extracted_text_preview": document_data.get('text', '')[:200] if document_data else "No text extracted"
        }
    }
    
    return response

# Serve frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
