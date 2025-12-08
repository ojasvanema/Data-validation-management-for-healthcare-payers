from ..models import MainAgentState, ValidationResult, ConflictDetails
try:
    from ...tools import NPI_TOOL, FUZZY_TOOL
except ImportError:
    from app.tools import NPI_TOOL, FUZZY_TOOL
import asyncio
import random
from typing import List

async def validation_agent_node(state: MainAgentState) -> MainAgentState:
    """
    Multi-source Validation Agent & Judge:
    1. Validates against REAL NPPES NPI Registry API.
    2. Acts as a JUDGE to compare 'Entry Data' (provider_data) vs 'Document Data' (parsed_data).
    """
    print(f"[{state.job_id}] [Judge Agent] querying National Provider Identifier Registry...")
    
    npi = state.provider_data.npi
    
    # 1. External Source: Real NPPES API
    # Run in thread/async
    npi_result = await asyncio.to_thread(NPI_TOOL.lookup, npi) if npi else {"valid": False, "error": "No NPI"}
    
    is_npi_valid = npi_result.get("valid", False)
    registry_data = npi_result.get("data", {})
    
    # Mock OIG check (Still mock as OIG requires downloading huge CSVs or paid API)
    is_excluded = False
    if npi == "1234567890": # Test case preservation
         pass 
    
    # 2. Judge Logic: Compare Parsed Data vs Provider Data
    conflicts: List[ConflictDetails] = []
    
    if state.parsed_data:
        # Check NPI
        doc_npi = state.parsed_data.extracted_npi
        if doc_npi and npi and doc_npi != npi:
             conflicts.append(ConflictDetails(
                 field="NPI", 
                 entry_value=str(npi),
                 document_value=str(doc_npi),
                 description="NPI mismatch between entry and document."
             ))
        
        # Check Name (Fuzzy match)
        entry_name = f"{state.provider_data.first_name} {state.provider_data.last_name}"
        doc_name = state.parsed_data.extracted_name
        
        if doc_name:
            similarity = FUZZY_TOOL.ratio(entry_name, doc_name)
            if similarity < 0.8: # Threshold
                conflicts.append(ConflictDetails(
                    field="Name", 
                    entry_value=entry_name,
                    document_value=doc_name,
                    description=f"Name mismatch (similarity: {similarity:.2f})"
                ))

    # Consistency Check including Registry
    if is_npi_valid:
        reg_first = registry_data.get("first_name", "")
        reg_last = registry_data.get("last_name", "")
        reg_name = f"{reg_first} {reg_last}"
        
        # Check Entry vs Registry
        if FUZZY_TOOL.ratio(entry_name, reg_name) < 0.8:
             conflicts.append(ConflictDetails(
                 field="Name (Registry)",
                 entry_value=entry_name,
                 document_value=reg_name,
                 description="Entry name does not match official NPI Registry record."
             ))

    is_consistent = len(conflicts) == 0
    
    details_msg = "Validation passed."
    if not is_npi_valid:
        details_msg = f"NPI Invalid: {npi_result.get('error')}"
    elif conflicts:
        details_msg = f"Conflicts detected: {len(conflicts)}."
    
    state.validation_result = ValidationResult(
        npi_valid=is_npi_valid,
        license_valid=True,
        oig_excluded=is_excluded,
        sources_checked=["NPPES_NPI_Registry_Live", "Fuzzy_Judge"],
        details=details_msg,
        is_consistent=is_consistent,
        conflicts=conflicts
    )
    
    if not is_npi_valid:
        state.errors.append(f"Invalid NPI: {npi}")
    if conflicts:
        state.errors.append("Consistency conflicts detected.")
        
    return state
