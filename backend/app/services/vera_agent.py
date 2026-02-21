
import os
import json
import asyncio
import re
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from datetime import datetime

import pytesseract
from PIL import Image
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from .validation import load_complaints, cross_reference_complaints

load_dotenv()

# ─── CONFIGURATION ───
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found. VERA Agent (LLM path) will be disabled.")
    llm = None
else:
    llm = ChatGroq(
        temperature=0,
        model_name="llama-3.1-8b-instant",
        groq_api_key=GROQ_API_KEY
    )

# ─── STATE DEFINITION ───
class VeraState(TypedDict):
    csv_row: Dict[str, Any]
    ocr_text: str
    authoritative_source: Dict[str, Any]
    semantic_analysis: Dict[str, Any]
    trust_score: float
    risk_level: str
    final_report: Dict[str, Any]
    logs: List[str]

# ─── NODES ───

def ocr_node(state: VeraState) -> Dict[str, Any]:
    """
    Extracts text from the file path specified in csv_row.
    """
    row = state["csv_row"]
    file_path = row.get("File_Path")
    
    # Adjust path relative to backend if needed, or absolute
    # Assuming file_path is relative to 'backend/' or 'backend/uploads/...'
    # In the generation step we saved to 'backend/uploads/dummy_docs/...'
    # The CSV has 'uploads/dummy_docs/...'
    
    # We need to resolve this path correctly relative to CWD
    # Assuming CWD is project root
    resolved_path = os.path.join("backend", file_path) if not file_path.startswith("backend") else file_path
    
    extracted_text = ""
    logs = state.get("logs", [])
    
    if os.path.exists(resolved_path):
        try:
            extracted_text = pytesseract.image_to_string(Image.open(resolved_path))
            logs.append(f"OCR: Successfully extracted {len(extracted_text)} chars from {file_path}")
        except Exception as e:
            logs.append(f"OCR: Failed to extract text from {file_path}: {e}")
            extracted_text = "[OCR FAILED]"
    else:
        logs.append(f"OCR: File not found at {resolved_path}")
        extracted_text = "[NO FILE FOUND]"

    return {"ocr_text": extracted_text, "logs": logs}

def investigator_node(state: VeraState) -> Dict[str, Any]:
    """
    Simulates gathering authoritative data from APIs (NPPES, Medicare, etc.).
    In a real system, this would make async HTTP calls.
    For this demo, we mock data based on the input to ensure meaningful comparisons.
    """
    row = state["csv_row"]
    npi = row.get("NPI")
    
    logs = state.get("logs", [])
    logs.append(f"Investigator: Querying NPPES & Medicare for NPI {npi}...")
    
    # Mock data generation logic
    # We want some matches and some mismatches to demonstrate the agent
    
    mock_source = {
        "npi_record": {
            "number": npi,
            "status": "A", # Active
            "first_name": row.get("First_Name"),
            "last_name": row.get("Last_Name"),
            # Introduce a slight variation in address for one case
            "address": row.get("Address_History").split("||")[-1].strip(), 
            "taxonomies": [{"code": "207RC0000X", "desc": row.get("Specialty"), "primary": True}]
        },
        "medicare_data": {
            "billing_city": row.get("Address_History").split("||")[-1].split(",")[-2].strip() if "," in row.get("Address_History") else "Unknown"
        },
        "sanctions": []
    }
    
    # Inject Specific Scenarios
    if "SMITH" in row.get("Last_Name", "").upper():
        # Robert Smith: Slight name mismatch in official record
        mock_source["npi_record"]["first_name"] = "Bob" 
        mock_source["reviews"] = ["Great doctor", "Wait times are long"]
        
    elif "DOE" in row.get("Last_Name", "").upper():
         # Jane Doe: Clean record
         mock_source["reviews"] = ["Very professional", "Kind staff"]
         
    elif "WAYNE" in row.get("Last_Name", "").upper():
        # John Wayne: Potential sanction
        mock_source["sanctions"] = [{"action": "Probation", "date": "2023-01-01", "reason": "Administrative"}]
        mock_source["reviews"] = ["Billing issues reported", "Hard to reach"]

    # Complaint Directory Check
    logs.append(f"Investigator: Checking Complaint Directory for NPI {npi}...")
    complaints_db = load_complaints()
    provider_complaints = complaints_db.get(str(npi), [])
    
    mock_source["complaints"] = provider_complaints
    if provider_complaints:
         logs.append(f"Investigator: Found {len(provider_complaints)} complaints for this provider.")
    else:
         logs.append("Investigator: No complaints found in directory.")

    return {"authoritative_source": mock_source, "logs": logs}

def _build_prompt() -> str:
    """
    Constructs the prompt for VERA. Includes instructions on formatting the JSON output
    and the requirement to produce a 3D Trust Score and Risk Score.
    """
    system_template = """
    You are VERA (Validation, Evidence, Risk, Analysis), an elite automated healthcare credentialing analyst.
    Your job is to cross-reference the submitted provider data against the exact findings provided by the Verification Engine.

    CRITICAL INSTRUCTION:
    You MUST output highly immersive, continuous narrative logs in the 'thoughts' array.
    Do NOT output brief bullet points or simple "pass/fail" statements.
    Write your logs as if you are a human analyst actively investigating the file. 
    Use phrases like "Cross-referencing submitted NPI with federal registry...", "Anomaly detected in geospatial data...", "Executing Predictive Degradation Algorithm...".
    Make the logs feel like a live, deep-dive investigation.
    
    You calculate a 3D Trust Score (0-100) based on:
    1. Identity Integrity: Does NPPES data match the submission?
    2. Reachability: Does the address match USPS/Census data? Is the phone valid?
    3. Reputation: Are there sanctions? Are licenses active?

    You also calculate a Risk Score (0-100) which is generally (100 - Trust Score).
    Over 70 Risk = FLAGGED for manual review.

    Return your analysis strictly in this JSON structure:
    {{
        "thoughts": [
            {{"agent": "Identity_Verification", "log": "<verbose, immersive analyst thought process here>", "timestamp": "<iso format>"}},
            {{"agent": "Geospatial_Analysis", "log": "<verbose, immersive analyst thought process here>", "timestamp": "<iso format>"}},
            {{"agent": "Risk_Assessment", "log": "<verbose, immersive analyst thought process here>", "timestamp": "<iso format>"}}
        ],
        "final_report": {{
            "trust_score": <float>,
            "risk_score": <float>,
            "risk_level": "<LOW/MEDIUM/HIGH/CRITICAL>",
            "breakdown": {{
                "identity": "<summary of identity match>",
                "reachability": "<summary of location/contact match>",
                "reputation": "<summary of credential/sanction checks>"
            }}
        }}
    }}
    """
    return system_template

def semantic_analysis_node(state: VeraState) -> Dict[str, Any]:
    """
    Uses LLM to evaluate D1, D2, D3 dimensions and output immersive logs.
    """
    row = state["csv_row"]
    ocr = state["ocr_text"]
    auth = state["authoritative_source"]
    
    # Construct the Prompt
    system_prompt = _build_prompt()

    user_payload = json.dumps({
        "provider_candidate": {
            "raw_csv": row,
            "ocr_extracted": ocr
        },
        "authoritative_source": auth
    }, indent=2)

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Analyze this payload:\n{user_payload}")
    ]
    
    response = llm.invoke(messages)
    content = response.content
    
    # Parse JSON
    try:
        # cleanup markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        analysis = json.loads(content.strip())
    except Exception as e:
        analysis = {
            "error": f"Failed to parse LLM response: {e}", 
            "raw_response": content
        }

    # Extract thoughts and report
    thoughts_raw = analysis.get("thoughts", [])
    report = analysis.get("final_report", {})
    
    # Map raw dict thoughts to simple dicts for the state
    thoughts = []
    for t in thoughts_raw:
         thoughts.append({
             "agent": t.get("agent", "Analysis Agent"),
             "log": t.get("log", "Processing..."),
             "timestamp": t.get("timestamp", datetime.now().isoformat())
         })

    return {"semantic_analysis": report, "thoughts": thoughts}

def scoring_node(state: VeraState) -> Dict[str, Any]:
    """
    Applies the LLM's final assessment and overrides with critical penalties if needed.
    """
    report = state["semantic_analysis"]
    
    if "error" in report:
        return {"trust_score": 0.0, "risk_level": "UNKNOWN", "final_report": {"error": report["error"]}}

    trust_score = report.get("trust_score", 0.0)
    risk_level = report.get("risk_level", "UNKNOWN")
    
    # Add OCR warnings to the report
    ocr_text = state.get("ocr_text", "").upper()
    if "EXPIRED" in ocr_text or "SUSPENDED" in ocr_text or "WARNING" in ocr_text:
        trust_score *= 0.8  # Penalty
        risk_level = "HIGH"
        
    final_report = {
        "trust_score": round(trust_score, 1),
        "breakdown": report.get("breakdown", {}),
        "critical_flags": [],
        "risk_level": risk_level
    }
    
    return {
        "trust_score": trust_score, 
        "risk_level": risk_level,
        "final_report": final_report
    }

# ─── GRAPH CONSTRUCTION ───
workflow = StateGraph(VeraState)

workflow.add_node("ocr", ocr_node)
workflow.add_node("investigator", investigator_node)
workflow.add_node("semantic_analysis", semantic_analysis_node)
workflow.add_node("scoring", scoring_node)

workflow.set_entry_point("ocr")
workflow.add_edge("ocr", "investigator")
workflow.add_edge("investigator", "semantic_analysis")
workflow.add_edge("semantic_analysis", "scoring")
workflow.add_edge("scoring", END)

vera_app = workflow.compile()

# ─── EXECUTION HELPER ───
async def run_vera_on_row(row: Dict[str, Any]):
    initial_state = {
        "csv_row": row,
        "ocr_text": "",
        "authoritative_source": {},
        "semantic_analysis": {},
        "trust_score": 0.0,
        "risk_level": "UNKNOWN",
        "final_report": {},
        "logs": []
    }
    
    result = await vera_app.ainvoke(initial_state)
    return result

