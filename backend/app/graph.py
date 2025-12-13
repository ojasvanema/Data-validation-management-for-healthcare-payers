from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from .models import MainAgentState, ProviderRecord, ValidationResult, FraudAnalysis, DegradationPrediction, BusinessImpact, FraudRiskLevel
import asyncio
import random

# --- Node Implementation (Stubs for Now) ---

async def sub_agent_parser(state: MainAgentState) -> MainAgentState:
    """Simulates parsing a document or enriching initial data."""
    # In reality, this would call the VLM/OCR tools
    print(f"[{state.job_id}] Parsing document...")
    await asyncio.sleep(0.1) # Simulate IO
    if not state.provider_data.npi:
        # Mock parsing extraction
        state.provider_data.npi = "1234567890"
    return state

async def sub_agent_validation(state: MainAgentState) -> MainAgentState:
    """Cross-references data with internal/external sources."""
    print(f"[{state.job_id}] Validating against NPI registry...")
    await asyncio.sleep(0.2)
    
    # Mock validation logic
    is_valid = True # Randomly fail?
    
    state.validation_result = ValidationResult(
        npi_valid=is_valid,
        license_valid=True,
        oig_excluded=False,
        sources_checked=["NPI_REGISTRY", "OIG_DB"],
        details="Provider found and active."
    )
    return state

async def sub_agent_fraud(state: MainAgentState) -> MainAgentState:
    """Analyzes for fraud patterns."""
    print(f"[{state.job_id}] Running fraud detection...")
    await asyncio.sleep(0.1)
    
    # Mock fraud check
    state.fraud_analysis = FraudAnalysis(
        risk_score=15.5,
        risk_level=FraudRiskLevel.LOW,
        flagged_patterns=[]
    )
    return state

async def sub_agent_predictive(state: MainAgentState) -> MainAgentState:
    """Predicts data degradation."""
    print(f"[{state.job_id}] Predicting degradation...")
    await asyncio.sleep(0.1)
    state.degradation_prediction = DegradationPrediction(
        confidence_score=0.85
    )
    return state

async def sub_agent_business(state: MainAgentState) -> MainAgentState:
    """Calculates ROI."""
    print(f"[{state.job_id}] Calculating business impact...")
    state.business_impact = BusinessImpact(
        estimated_savings=150.00,
        roi_multiplier=3.5,
        notes="Prevented potential claim denial."
    )
    return state

async def sub_agent_communicator(state: MainAgentState) -> MainAgentState:
    """Handles communication if needed."""
    if state.communication_required or (state.validation_result and not state.validation_result.npi_valid):
         print(f"[{state.job_id}] Queueing communication to provider...")
    return state

async def sub_agent_graphical(state: MainAgentState) -> MainAgentState:
    """Prepares visualization data."""
    # This might push to a separate metrics DB
    return state

# --- Graph Construction ---

def create_main_graph():
    # We use the Pydantic model as the state
    workflow = StateGraph(MainAgentState)

    # 1. Add Nodes
    workflow.add_node("parser_agent", sub_agent_parser)
    workflow.add_node("validation_agent", sub_agent_validation)
    workflow.add_node("fraud_agent", sub_agent_fraud)
    workflow.add_node("predictive_agent", sub_agent_predictive)
    workflow.add_node("business_agent", sub_agent_business)
    workflow.add_node("communicator_agent", sub_agent_communicator)
    # Graphical agent might be an observer or final step, let's make it implicit or final
    
    # 2. Define Edges
    # Flow: Parser -> Validation -> Fraud -> (Predictive, Business) -> Communicator -> End
    
    workflow.set_entry_point("parser_agent")
    
    workflow.add_edge("parser_agent", "validation_agent")
    workflow.add_edge("validation_agent", "fraud_agent")
    
    # Parallel execution simulation (LangGraph supports parallel branches)
    # From Fraud, we go to both Predictive and Business
    workflow.add_edge("fraud_agent", "predictive_agent")
    workflow.add_edge("fraud_agent", "business_agent")
    
    # Convergence
    workflow.add_edge("predictive_agent", "communicator_agent")
    workflow.add_edge("business_agent", "communicator_agent")
    
    workflow.add_edge("communicator_agent", END)

    return workflow.compile()

# Singleton instance
orchestrator_graph = create_main_graph()
