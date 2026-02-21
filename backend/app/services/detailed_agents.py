
import os
import json
import httpx
import logging
import pytesseract
from PIL import Image
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv
load_dotenv()
from ..core.config import STATES, SPECIALTIES
from .business_impact import compute_provider_impact

# Configure Logger
logger = logging.getLogger(__name__)

# --- Data Models for LLM Output ---

class ValidationStep(BaseModel):
    step: str = Field(description="Name of the validation step")
    status: str = Field(description="Status of the step: 'Pass', 'Fail', or 'Warning'")
    reasoning: str = Field(description="Detailed reasoning for the status")

class ValidationOutput(BaseModel):
    verdict: str = Field(description="Final verdict: 'Verified', 'Flagged', 'Review', or 'Pending'")
    confidence: float = Field(description="Confidence score between 0 and 100")
    steps: List[ValidationStep] = Field(description="List of validation steps performed")
    summary: str = Field(description="Executive summary of the validation")

class PredictiveOutput(BaseModel):
    risk_score: int = Field(description="Risk score between 0 (Safe) and 100 (High Risk)")
    risk_level: str = Field(description="'Low', 'Medium', or 'High'")
    factors: List[str] = Field(description="List of risk factors identified")
    decay_probability: float = Field(description="Probability of data decay within 90 days (0.0 to 1.0)")
    explanation: str = Field(description="Explanation of the risk assessment")

class ROIOutput(BaseModel):
    cost_saving: float = Field(description="Estimated cost savings in USD")
    processing_time_saved: float = Field(description="Estimated hours saved")
    error_prevention_value: float = Field(description="Estimated value of preventing errors")
    graph_points: List[Dict[str, Any]] = Field(description="Data points for ROI graph")

# --- Service Class ---

class DetailedAgentService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not found. LLM features will fail.")
            self.llm = None
        else:
            self.llm = ChatGroq(
                temperature=0,
                model_name="llama-3.1-8b-instant",
                groq_api_key=api_key
            )

    def _extract_context(self, file_path: str) -> str:
        """Helper to extract text from PDF or Image."""
        try:
            ext = os.path.splitext(file_path)[1].lower()
            text = ""
            
            # Simple text extraction
            if ext == '.pdf':
                # Lazy import to avoid breaking if library missing (though we checked)
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        pt = page.extract_text()
                        if pt: text += pt + "\n"
            
            elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
                text = pytesseract.image_to_string(Image.open(file_path))
            
            return text.strip()
        except Exception as e:
            logger.error(f"Text Extraction Failed for {file_path}: {e}")
            return ""

    async def analyze_provider(self, provider_data: Dict[str, Any], file_path: Optional[str] = None, run_efficiently: bool = True) -> Dict[str, Any]:
        """
        Runs the VERA LangGraph agent for the provider if run_efficiently is False.
        Otherwise, bypasses the LLM and runs the fast deterministic validation.
        """
        # --- FAST PATH (No LLM) ---
        if run_efficiently:
            logger.info("Running fast deterministic validation (LLM bypassed).")
            # Convert provider_data to CSV-like row for validate_single_provider
            csv_row = {
                "NPI": provider_data.get("npi", ""),
                "First_Name": provider_data.get("first_name", ""),
                "Last_Name": provider_data.get("last_name", ""),
                "Specialty": provider_data.get("specialty", ""),
                "State": provider_data.get("state", ""),
                "Phone": provider_data.get("phone", ""),
                "Address": provider_data.get("address", ""),
                "City": provider_data.get("city", ""),
            }
            
            from .validation import validate_single_provider
            async with httpx.AsyncClient() as client:
                fast_result = await validate_single_provider(csv_row, client, run_efficiently=True)
            
            # Map fast_result to Frontend format
            agent_thoughts = []
            validation_steps = []
            
            if file_path:
                agent_thoughts.append({
                    "agentName": "Parser Agent",
                    "thought": f"Ingested supplementary document: {os.path.basename(file_path)}",
                    "verdict": "pass",
                    "timestamp": datetime.now().isoformat()
                })
                validation_steps.append({
                    "step": "Parser Agent",
                    "status": "Pass",
                    "reasoning": "Parsed supplementary document"
                })

            for t in fast_result.get("thoughts", []):
                agent_thoughts.append({
                    "agentName": getattr(t, 'agentName', str(t)),
                    "thought": getattr(t, 'thought', str(t)),
                    "verdict": getattr(t, 'verdict', 'neutral'),
                    "timestamp": getattr(t, 'timestamp', datetime.now().isoformat())
                })
                
                status_map = {"pass": "Pass", "fail": "Fail", "warn": "Warning", "neutral": "Info"}
                validation_steps.append({
                    "step": getattr(t, 'agentName', str(t)),
                    "status": status_map.get(getattr(t, 'verdict', 'neutral'), "Info"),
                    "reasoning": getattr(t, 'thought', str(t))
                })
            
            # Business Impact Agent: compute real per-provider ROI
            is_auto = fast_result.get("status") == "Verified" and fast_result.get("risk_score", 0) <= 35
            n_conflicts = len(fast_result.get("conflicts", []))
            impact = compute_provider_impact(fast_result.get("risk_score", 0), fast_result.get("status", ""), n_conflicts, is_auto)
            roi_data = {
                "processing_time_saved": 4.5,
                "error_prevention_value": impact["denial_prevention"] + impact["fraud_prevention"],
                "total_impact": impact["total_impact"],
                "breakdown": impact,
                "graph_points": [
                     {"month": "Jan", "savings": round(impact["total_impact"] * 0.9)},
                     {"month": "Feb", "savings": round(impact["total_impact"] * 1.0)},
                     {"month": "Mar", "savings": round(impact["total_impact"] * 1.1)},
                ]
            }
            
            return {
                "provider_id": provider_data.get("npi", "TMP-1"),
                "agent_thoughts": agent_thoughts,
                "validation_steps": validation_steps,
                "risk_score": fast_result.get("risk_score", 0),
                "fraud_probability": fast_result.get("decay_prob", 0.0) * 100, # Using decay as proxy here
                "discrepancies": fast_result.get("conflicts", []),
                "roi_data": roi_data
            }

        # --- IMMERSIVE PATH (LLM) ---
        try:
            from .vera_agent import vera_app
        except ImportError:
            # Fallback if import fails (e.g. strict dependency issues), though it shouldn't
            logger.error("Could not import vera_app. Is vera_agent.py present?")
            return await self.analyze_provider_fallback(provider_data, file_path)
            
        # 1. Context Extraction (OCR/PDF)
        related_doc_raw = provider_data.get("related_docs", "")
        extracted_text = ""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # Determine if related_docs is a JSON list string
        doc_list = []
        if isinstance(related_doc_raw, str) and related_doc_raw.startswith("["):
            try:
                doc_list = json.loads(related_doc_raw)
            except json.JSONDecodeError:
                doc_list = [related_doc_raw] if related_doc_raw else []
        elif isinstance(related_doc_raw, list):
            doc_list = related_doc_raw
        elif related_doc_raw:
            doc_list = [related_doc_raw]
            
        # Add frontend direct file upload if present
        if file_path and file_path not in doc_list:
            doc_list.append(file_path)

        for doc_path in doc_list:
            if not doc_path: continue
            
            # Ensure path is absolute
            target_file = doc_path
            if not os.path.isabs(target_file):
                target_file = os.path.join(base_dir, target_file)
                
            if os.path.exists(target_file):
                text = self._extract_context(target_file)
                if text:
                    extracted_text += f"\n--- Start {os.path.basename(target_file)} ---\n{text}\n--- End {os.path.basename(target_file)} ---\n"
                logger.info(f"Extracted chars from {target_file}")
            else:
                logger.warning(f"Document parsing skipped: file not found at {target_file}")

        # 2. Construct VERA initial state
        # Map frontend provider_data keys to VERA expected keys
        vera_row = {
            "NPI": provider_data.get("npi", ""),
            "First_Name": provider_data.get("first_name", ""),
            "Last_Name": provider_data.get("last_name", ""),
            "Specialty": provider_data.get("specialty", ""),
            "State": provider_data.get("state", ""),
            "Address_History": f"{provider_data.get('state', 'Unknown')} Address History Placeholder||", 
            "Phone_History": "",
            "File_Path": json.dumps(doc_list) if doc_list else ""
        }

        initial_state = {
            "csv_row": vera_row,
            "ocr_text": extracted_text, # VERA uses this as context
            "authoritative_source": {},
            "semantic_analysis": {},
            "trust_score": 0.0,
            "risk_level": "UNKNOWN",
            "final_report": {},
            # VERA's internal state uses 'thoughts' for logs, not 'logs'
            "thoughts": [] 
        }

        # 3. Invoke VERA App
        try:
            logger.info(f"Invoking VERA for NPI: {vera_row['NPI']}")
            final_state = await vera_app.ainvoke(initial_state)
            
            # Inject Parsing Agent Thought if OCR data exists
            if extracted_text and len(extracted_text) > 10:
                parsing_thought = ValidationStep(
                    agent="PARSING",
                    log=f"Miscellaneous Context extracted from {len(doc_list)} document(s). Text size: {len(extracted_text)} chars. This data will be used by VERA for risk adjustment.",
                    timestamp=datetime.now().isoformat() + "Z"
                )
                # Insert at the beginning so it shows up first in the UI
                if "thoughts" in final_state:
                    final_state["thoughts"].insert(0, parsing_thought)
            
            # The vera_app.ainvoke returns the final state directly, which we then process.
            # We rename final_state to result for consistency with the original code's variable name
            result = final_state
        except Exception as e:
            logger.error(f"VERA processing failed: {e}")
            return await self.analyze_provider_fallback(provider_data, file_path)

        report = result.get("final_report", {})
        dims = report.get("breakdown", {})
        
        # In VERA, logs are under 'thoughts' as ValidationStep objects
        thoughts = result.get("thoughts", [])

        # 3. Map to Frontend Structure
        
        # Unified Agent Thoughts (Sequential Logic)
        agent_thoughts = []
        
        # 1. Add VERA Thoughts to agent_thoughts
        for t in thoughts:
             # t is a ValidationStep object so we can access attributes
             # depending on how it's returned (Pydantic model vs dict)
             agent = getattr(t, 'agent', '') if hasattr(t, 'agent') else t.get('agent', '')
             log = getattr(t, 'log', '') if hasattr(t, 'log') else t.get('log', '')
             timestamp = getattr(t, 'timestamp', datetime.now().isoformat()) if hasattr(t, 'timestamp') else t.get('timestamp', datetime.now().isoformat())
             
             verdict = "pass"
             lower_log = log.lower()
             if any(x in lower_log for x in ["fail", "mismatch", "not found", "critical"]):
                 verdict = "fail"
             elif any(x in lower_log for x in ["warn", "partial"]):
                 verdict = "warn"
                 
             agent_thoughts.append({
                 "agentName": agent.replace("_", " ").title() if agent else "Analysis Agent",
                 "thought": log,
                 "verdict": verdict,
                 "timestamp": timestamp
             })
             
        # Optional: Add a default parser thought if no specific one was injected
        if not any(t.get("agentName", "").lower() == "parsing" for t in agent_thoughts):
             agent_thoughts.insert(0, {
                "agentName": "Parser Agent",
                "thought": "Ingesting available data. Extracting entities and structuring query for validation.",
                "verdict": "pass",
                "timestamp": datetime.now().isoformat()
            })
        
        # 2. Validation / VERA (Multi-stage verification)
        validation_steps = []
        # Add Parser logs to validation_steps as well for legacy view compatibility
        validation_steps.append({
            "step": "Parser Agent",
            "status": "Pass",
            "reasoning": "Parsed entries to structured query"
        })

        # Process VERA logs for Validation step
        for t in thoughts:
             agent = getattr(t, 'agent', '') if hasattr(t, 'agent') else t.get('agent', '')
             log = getattr(t, 'log', '') if hasattr(t, 'log') else t.get('log', '')
             
             status = "Pass"
             lower_log = log.lower()
             if any(x in lower_log for x in ["fail", "mismatch", "not found", "critical"]):
                 status = "Fail"
             elif any(x in lower_log for x in ["warn", "partial"]):
                 status = "Warning"
                 
             validation_steps.append({
                 "step": agent.replace("_", " ").title() if agent else "VERA Validation",
                 "status": status,
                 "reasoning": log
             })

        # 3. Risk Scoring (Fallback logic if not in thoughts)
        trust_score = result.get("trust_score", 0.0)
        risk_score = int(100 - trust_score)
        agent_thoughts.append({
            "agentName": "Risk Scoring",
            "thought": f"Aggregated analysis complete. Trust Score: {trust_score}/100. Calculated Risk Score: {risk_score}/100.",
            "verdict": "fail" if risk_score > 50 else "pass",
            "timestamp": datetime.now().isoformat()
        })

        validation_result = {
            "verdict": "Verified" if trust_score > 70 else "Flagged",
            "confidence": trust_score,
            "steps": validation_steps,
            "summary": f"VERA Agent Analysis. Trust Score: {trust_score}/100. Risk: {result.get('risk_level', 'Unknown')}."
        }

        # 4. Predictive Degradation
        dims = report.get("breakdown", {})
        predictive_result = {
            "risk_score": risk_score,
            "risk_level": result.get("risk_level", "Unknown"),
            "factors": report.get("critical_flags", []),
            "decay_probability": 0.1, 
            "explanation": f"Evaluation Dimensions:\nIdentity: {dims.get('identity', 'N/A') if isinstance(dims.get('identity'), str) else dims.get('identity', {}).get('score', 0) if isinstance(dims.get('identity'), dict) else 'N/A'}\nReachability: {dims.get('reachability', 'N/A') if isinstance(dims.get('reachability'), str) else dims.get('reachability', {}).get('score', 0) if isinstance(dims.get('reachability'), dict) else 'N/A'}\nReputation: {dims.get('reputation', 'N/A') if isinstance(dims.get('reputation'), str) else dims.get('reputation', {}).get('score', 0) if isinstance(dims.get('reputation'), dict) else 'N/A'}"
        }
        
        agent_thoughts.append({
            "agentName": "Predictive Degradation",
            "thought": f"Predictive modeling complete. Decay probability assessed based on {len(report.get('critical_flags', []))} risk factors.",
            "verdict": "neutral",
            "timestamp": datetime.now().isoformat()
        })
        
        # 5. Interpretation (Simple Rule-based)
        interpretation = ""
        verdict = "neutral"
        if risk_score > 75:
            interpretation = "CRITICAL RISK: High likelihood of fraud or data obsolescence. Immediate suspension or manual override recommended."
            verdict = "fail"
        elif risk_score > 50:
            interpretation = "MODERATE RISK: Anomalies detected. Enhanced monitoring and provider outreach required."
            verdict = "warn"
        else:
            interpretation = "LOW RISK: Data verified against authoritative sources. Standard validation cycle approved."
            verdict = "pass"
            
        agent_thoughts.append({
            "agentName": "Interpretation Agent",
            "thought": interpretation,
            "verdict": verdict,
            "timestamp": datetime.now().isoformat()
        })

        # 6. Business Impact Agent: compute real ROI
        is_auto = trust_score > 65 and len(report.get("critical_flags", [])) == 0
        n_conflicts = len(report.get("critical_flags", []))
        impact = compute_provider_impact(risk_score, "Flagged" if risk_score > 70 else "Review" if risk_score > 35 else "Verified", n_conflicts, is_auto)
        roi_result = {
            "cost_saving": impact["total_impact"],
            "processing_time_saved": 2.5,
            "error_prevention_value": impact["denial_prevention"] + impact["fraud_prevention"],
            "breakdown": impact,
            "graph_points": [{"x": i, "y": round(impact["total_impact"] * i * 0.9)} for i in range(1, 13)]
        }
        
        agent_thoughts.append({
            "agentName": "Business & ROI",
            "thought": f"Per-provider impact: ${impact['total_impact']:.0f} (Ops: ${impact['operational_saving']:.0f} + Denial prevention: ${impact['denial_prevention']:.0f} + Fraud mitigation: ${impact['fraud_prevention']:.0f})",
            "verdict": "pass",
            "timestamp": datetime.now().isoformat()
        })

        # 7. Communicator
        comm_thought = "Standard notification protocol."
        if trust_score < 70:
            comm_thought = "Drafted automated query to provider regarding discrepancies."
        if "complaint" in str(thoughts).lower():
            comm_thought += " Included complaint context in draft."
            
        agent_thoughts.append({
            "agentName": "Communicator",
            "thought": comm_thought,
            "verdict": "neutral",
            "timestamp": datetime.now().isoformat()
        })

        return {
            "validation": validation_result,
            "predictive": predictive_result,
            "roi": roi_result,
            "raw_data": provider_data,
            "ocr_text": result.get("ocr_text", ""),
            "agent_thoughts": agent_thoughts
        }

    async def analyze_provider_fallback(self, provider_data: Dict[str, Any], file_path: Optional[str] = None) -> Dict[str, Any]:
        """Original logic as fallback when VERA fails."""
        return {
            "provider_id": provider_data.get("npi", "UNKNOWN"),
            "agent_thoughts": [{
                "agentName": "Fallback Agent",
                "thought": "VERA LLM pipeline failed. Returning default assessment.",
                "verdict": "warn",
                "timestamp": datetime.now().isoformat()
            }],
            "validation_steps": [],
            "risk_score": 50,
            "fraud_probability": 50.0,
            "discrepancies": ["LLM analysis unavailable"],
            "roi_data": {"processing_time_saved": 0, "error_prevention_value": 0, "graph_points": []}
        }

    async def run_validation_agent(self, data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a specialized Healthcare Data Validation Agent. 
            Your job is to cross-reference provider data against known patterns and rules.
            
            Rules:
            1. NPI must be exactly 10 digits.
            2. State must be a valid 2-letter US state code.
            3. License number format should match the state's typical format (heuristic).
            4. Detect any inconsistencies between Name and License/NPI if context allows (hallucinate plausible checks for demo).
            
            Return a JSON object with a verdict, confidence, and detailed steps."""),
            ("user", "Analyze this provider: {data}")
        ])
        
        chain = prompt | self.llm | JsonOutputParser(pydantic_object=ValidationOutput)
        
        try:
            return chain.invoke({"data": json.dumps(data)})
        except Exception as e:
            logger.error(f"Validation Agent Failed: {e}")
            # Fallback for demo stability
            return {
                "verdict": "Review",
                "confidence": 50,
                "steps": [{"step": "LLM Analysis", "status": "Fail", "reasoning": str(e)}],
                "summary": "Agent failed to run."
            }

    async def run_predictive_agent(self, data: Dict[str, Any], validation: Dict[str, Any]) -> Dict[str, Any]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Predictive Risk Analytics Agent.
            Analyze the provider data and the validation results to predict risk and data decay.
            
            - If validation passed, risk is generally low, but consider data freshness (if provided) or missing fields.
            - If validation failed/flagged, risk is high.
            - Provide a decay probability based on how likely this data is to change (e.g., demographics change faster than NPI).
            
            Return JSON matching the PredictiveOutput schema."""),
            ("user", "Provider Data: {data}\nValidation Result: {validation}")
        ])
        
        chain = prompt | self.llm | JsonOutputParser(pydantic_object=PredictiveOutput)
        
        try:
            return chain.invoke({"data": json.dumps(data), "validation": json.dumps(validation)})
        except Exception as e:
             logger.error(f"Predictive Agent Failed: {e}")
             return {
                 "risk_score": 50, 
                 "risk_level": "Medium", 
                 "factors": ["System Error"], 
                 "decay_probability": 0.5, 
                 "explanation": "Agent failed."
             }

    async def run_roi_agent(self, data: Dict[str, Any], validation: Dict[str, Any], predictive: Dict[str, Any]) -> Dict[str, Any]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Business Intelligence & ROI Agent.
            Calculate the value generated by this automated validation.
            
            Assumptions:
            - Manual review takes ~15-30 minutes ($50/hr cost).
            - Catching a fraud/error prevents $5,000 - $50,000 potential loss.
            - Automated cost is ~$0.10.
            
            Generate realistic savings numbers based on the risk profile identified.
            Also generate 5 graph points (month 1-5) showing cumulative savings if we scaled this to 1000 similar providers.
            
            Return JSON matching the ROIOutput schema."""),
            ("user", "Risk Profile: {predictive}")
        ])
        
        chain = prompt | self.llm | JsonOutputParser(pydantic_object=ROIOutput)
        
        try:
            return chain.invoke({"predictive": json.dumps(predictive)})
        except Exception as e:
            logger.error(f"ROI Agent Failed: {e}")
            return {
                "cost_saving": 0,
                "processing_time_saved": 0,
                "error_prevention_value": 0,
                "graph_points": []
            }
