from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from .models import MainAgentState, ProviderRecord, ValidationResult, FraudAnalysis, DegradationPrediction, BusinessImpact, FraudRiskLevel
import asyncio
import random

from .agents.parser import parser_agent_node
from .agents.validation import validation_agent_node
from .agents.fraud import fraud_agent_node
from .agents.analytics import predictive_agent_node, business_agent_node
from .agents.communicator import communicator_agent_node
from .agents.graphical import graphical_agent_node

# --- Graph Construction ---

def create_main_graph():
    # We use the Pydantic model as the state
    workflow = StateGraph(MainAgentState)

    # 1. Add Nodes
    workflow.add_node("parser_agent", parser_agent_node)
    workflow.add_node("validation_agent", validation_agent_node)
    workflow.add_node("fraud_agent", fraud_agent_node)
    workflow.add_node("predictive_agent", predictive_agent_node)
    workflow.add_node("business_agent", business_agent_node)
    workflow.add_node("communicator_agent", communicator_agent_node)
    workflow.add_node("graphical_agent", graphical_agent_node)
    
    # 2. Define Edges
    # Flow: Parser -> Validation -> Fraud -> (Predictive, Business) -> Graphical -> Communicator -> End
    
    workflow.set_entry_point("parser_agent")
    
    workflow.add_edge("parser_agent", "validation_agent")
    workflow.add_edge("validation_agent", "fraud_agent")
    
    # Sequential execution to avoid race conditions on state updates
    workflow.add_edge("fraud_agent", "predictive_agent")
    workflow.add_edge("predictive_agent", "business_agent")
    workflow.add_edge("business_agent", "graphical_agent")
    
    workflow.add_edge("graphical_agent", "communicator_agent")
    
    workflow.add_edge("communicator_agent", END)

    return workflow.compile()

# Singleton instance
orchestrator_graph = create_main_graph()
