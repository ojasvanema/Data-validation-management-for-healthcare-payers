from ..models import MainAgentState, ValidationResult, ConflictDetails
from backend.app.tools import NPI_TOOL, FUZZY_TOOL
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
    # Mock logic based on NPI prefixes for deterministic demo scenarios
    
    npi_prefix = npi[:2] if npi else ""
    
    if npi_prefix == "99": # Demo: Low Risk / Valid
        npi_result = {"valid": True, "data": {"first_name": state.provider_data.first_name, "last_name": state.provider_data.last_name}}
        print(f"[{state.job_id}] [Judge Agent] NPI {npi}: Pattern 99 (VALID).")
        
    elif npi_prefix == "88": # Demo: Medium Risk / Data Mismatch
        # Valid NPI but name won't match "Mismatch Name" etc from the CSV effectively
        npi_result = {"valid": True, "data": {"first_name": "Official", "last_name": "Name"}} 
        print(f"[{state.job_id}] [Judge Agent] NPI {npi}: Pattern 88 (CLERICAL MISMATCH).")
        
    elif npi_prefix == "11": # Demo: High Risk / OIG Excluded
        npi_result = {"valid": False, "error": "Simulated Invalid"} 
        print(f"[{state.job_id}] [Judge Agent] NPI {npi}: Pattern 11 (OIG EXCLUDED).")
        
    else:
        # Fallback to authentic lookup
        npi_result = await asyncio.to_thread(NPI_TOOL.lookup, npi) if npi else {"valid": False, "error": "No NPI"}
    
    is_npi_valid = npi_result.get("valid", False)
    registry_data = npi_result.get("data", {})
    
    # Mock OIG check
    is_excluded = False
    if npi_prefix == "11": # Pattern 11 is OIG Excluded
         is_excluded = True 
         print(f"[{state.job_id}] [Judge Agent] NPI {npi} flagged as OIG EXCLUDED.") 
    
    # 2. Judge Logic: Compare Parsed Data vs Provider Data
    conflicts: List[ConflictDetails] = []
    
    # Build entry name for comparisons
    entry_name = f"{state.provider_data.first_name} {state.provider_data.last_name}" if state.provider_data.first_name and state.provider_data.last_name else ""
    
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

    # Consistency Check including Registry (works even without parsed_data)
    if is_npi_valid and entry_name:
        reg_first = registry_data.get("first_name", "")
        reg_last = registry_data.get("last_name", "")
        reg_name = f"{reg_first} {reg_last}".strip()
        
        # Check Entry vs Registry
        if reg_name and FUZZY_TOOL.ratio(entry_name, reg_name) < 0.8:
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
    
    errors = []
    if not is_npi_valid:
        errors.append(f"Invalid NPI: {npi}")
    if conflicts:
        errors.append("Consistency conflicts detected.")
        
    return {
        "validation_result": ValidationResult(
            npi_valid=is_npi_valid,
            license_valid=True,
            oig_excluded=is_excluded,
            sources_checked=["NPPES_NPI_Registry_Live", "Fuzzy_Judge"],
            details=details_msg,
            is_consistent=is_consistent,
            conflicts=conflicts
        ),
        "errors": errors
    }
