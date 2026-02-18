
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

load_dotenv()

# ─── CONFIGURATION ───
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found. VERA Agent will fail.")

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

    return {"authoritative_source": mock_source, "logs": logs}

def semantic_analysis_node(state: VeraState) -> Dict[str, Any]:
    """
    Uses LLM to evaluate D1, D2, D3 dimensions.
    """
    row = state["csv_row"]
    ocr = state["ocr_text"]
    auth = state["authoritative_source"]
    
    # Construct the Prompt
    system_prompt = """You are the VERA Semantic Analysis Engine. 
Your job is to evaluate a Provider Candidate against Authoritative Sources and Evidence (OCR).
Decompose the risk into 3 dimensions:
1. Identity Integrity (D1): Does the candidate match the official recoords? (Consider Name, NPI, Credential, OCR evidence).
2. Reachability (D2): Is the provider reachable? (Consider Address/Phone history vs Official records).
3. Reputation (D3): Are there trust signals or red flags? (Sanctions, Reviews).

Output JSON ONLY:
{
  "dimensions": {
    "identity": { "score": float (0.0-1.0), "reasoning": "string" },
    "reachability": { "score": float (0.0-1.0), "reasoning": "string" },
    "reputation": { "score": float (0.0-1.0), "reasoning": "string" }
  },
  "critical_flags": ["string"],
  "derived_risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
"""

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

    logs = state.get("logs", [])
    logs.append("Semantic Analysis: LLM evaluation complete.")
    logs.append(f"LLM Raw Output: {content[:200]}...") # Log first 200 chars

    return {"semantic_analysis": analysis, "logs": logs}

def scoring_node(state: VeraState) -> Dict[str, Any]:
    """
    Deterministic Math Scoring: T = 100 * (w1*s1 + w2*s2 + w3*s3) * (1 - lambda)
    """
    analysis = state["semantic_analysis"]
    
    if "error" in analysis:
        return {"trust_score": 0.0, "risk_level": "UNKNOWN", "final_report": {"error": analysis["error"]}}

    dims = analysis.get("dimensions", {})
    s1 = dims.get("identity", {}).get("score", 0.0)
    s2 = dims.get("reachability", {}).get("score", 0.0)
    s3 = dims.get("reputation", {}).get("score", 0.0)
    
    flags = analysis.get("critical_flags", [])
    
    # Weights
    w1 = 0.40
    w2 = 0.30
    w3 = 0.30
    
    # Lambda Penalty
    lambda_val = 0.0
    if "POTENTIAL_FRAUD" in flags or "SANCTION" in flags:
        lambda_val = 0.9
    elif len(flags) > 0:
        lambda_val = 0.5
        
    # Calculate
    raw_score = (w1 * s1) + (w2 * s2) + (w3 * s3)
    trust_score = 100 * raw_score * (1.0 - lambda_val)
    
    logs = state.get("logs", [])
    logs.append(f"Scoring: s1={s1}, s2={s2}, s3={s3}, lambda={lambda_val} => T={trust_score}")

    final_report = {
        "trust_score": round(trust_score, 1),
        "breakdown": dims,
        "critical_flags": flags,
        "logs": logs
    }
    
    return {
        "trust_score": trust_score, 
        "risk_level": analysis.get("derived_risk_level", "UNKNOWN"),
        "final_report": final_report,
        "logs": logs
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

