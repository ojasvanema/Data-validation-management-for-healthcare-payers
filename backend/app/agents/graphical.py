from ..models import MainAgentState, GraphicalData
import asyncio
import random

async def graphical_agent_node(state: MainAgentState) -> MainAgentState:
    """
    Graphical Agent:
    Creates powerful data visualizations, likes network heatmaps.
    Generates geographic coordinates for mapping.
    """
    
    # Mock Geographics based on license state (defaults to US center if unknown)
    lat_base = 37.0902
    lon_base = -95.7129
    
    if state.provider_data.license_state == "CA":
        lat_base, lon_base = 36.7783, -119.4179
    elif state.provider_data.license_state == "NY":
        lat_base, lon_base = 40.7128, -74.0060

    # Add random jitter for privacy/demo spread
    lat = lat_base + random.uniform(-0.5, 0.5)
    lon = lon_base + random.uniform(-0.5, 0.5)
    
    if state.fraud_analysis and state.fraud_analysis.flagged_patterns:
        print(f"[{state.job_id}] [Graphical Agent] Generated fraud network & geographic map data.")
        
    return {
        "graphical_data": GraphicalData(
            geographic_distribution=[
                {"lat": lat, "lon": lon, "weight": 1.0, "provider_id": state.provider_data.id}
            ],
            summary_stats={
                "risk_level": state.fraud_analysis.risk_level if state.fraud_analysis else "UNKNOWN",
                "validation_consistent": state.validation_result.is_consistent if state.validation_result else False
            }
        )
    }
