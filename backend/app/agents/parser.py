from ..models import MainAgentState, ProviderRecord, ParsedData
import asyncio
import random
from ..tools import DEFAULT_TOOLS
import re

async def parser_agent_node(state: MainAgentState) -> MainAgentState:
    """
    Document Parser Agent:
    Uses real tools (PDF, OCR, etc.) to extract text from the file_path in state.
    Then performs simple regex extraction (since no LLM provided) for NPI/Name.
    """
    file_path = state.provider_data.file_path
    job_id = state.job_id
    
    print(f"[{job_id}] [Document Parser] Processing real file: {file_path}")
    
    extracted_text = ""
    confidence = 0.0
    
    if file_path:
        # 1. Select Tool
        selected_tool = None
        for tool in DEFAULT_TOOLS:
            if tool.can_handle(file_path):
                selected_tool = tool
                break
        
        # 2. Extract Text
        if selected_tool:
            print(f"[{job_id}] [Document Parser] Using tool: {selected_tool.name}")
            # Run in executor to avoid blocking loop if tool is sync
            result = await asyncio.to_thread(selected_tool.parse, file_path)
            if "error" in result and result["error"]:
                 print(f"[{job_id}] [Document Parser] Error: {result['error']}")
            else:
                 extracted_text = result.get("text", "")
                 print(f"[{job_id}] [Document Parser] Extracted {len(extracted_text)} chars.")
                 confidence = 0.8 # successfully parsed
        else:
            print(f"[{job_id}] [Document Parser] No tool found for file type.")
    else:
        print(f"[{job_id}] [Document Parser] No file path provided.")

    # 3. Heuristic Extraction (Regex) as a fallback for "Smart" extraction
    # Find 10-digit number for NPI
    npi_match = re.search(r'\b\d{10}\b', extracted_text)
    extracted_npi = npi_match.group(0) if npi_match else None
    
    # Try to find Name (Assumption: First line or capitalized words)
    # Very naive extraction for demo purposes on raw text
    extracted_name = None
    lines = [l.strip() for l in extracted_text.split('\n') if l.strip()]
    if lines:
        extracted_name = lines[0] # Assume title/name is first

    state.parsed_data = ParsedData(
        extracted_npi=extracted_npi,
        extracted_name=extracted_name,
        extracted_address=None, # regex for address is complex
        confidence_score=confidence
    )
    
    print(f"[{job_id}] [Document Parser] Result: NPI={extracted_npi}, Name={extracted_name}")
        
    return state
