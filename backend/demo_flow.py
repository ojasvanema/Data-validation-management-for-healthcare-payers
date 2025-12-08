import asyncio
import json
import uuid
from datetime import datetime
from app.graph import orchestrator_graph
from app.models import MainAgentState, ProviderRecord

# Helper to serialize datetime/UUID for JSON printing
def json_serial(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

async def run_demo():
    print("--- Starting Multi-Agent System Demo ---\n")

    # 1. Synthetic Data: A valid-looking provider
    # Note: 1234567890 is a reserved test NPI often used in checks, or we use a real one.
    # For this demo we will mostly see "Not Found" from API unless we use a real NPI.
    # Let's use a potentially valid NPI if known, or stick to a format that passes length check.
    # Using a 10-digit number.
    
    import os
    abs_path = os.path.abspath("test_doc.txt")
    
    valid_provider = ProviderRecord(
        npi="1205362973", # Example real NPI
        first_name="Alice",
        last_name="Smith",
        organization_name="Health Corp",
        license_number="MD99999",
        license_state="CA",
        file_path=abs_path
    )

    # 2. Synthetic Data: A high-risk/invalid provider
    risky_provider = ProviderRecord(
        npi="INVALID", # Will trigger validation error
        first_name="Bob",
        last_name="Shady",
        organization_name="Fake Med",
        license_number="X00000",
        license_state="NY",
        file_path=abs_path
    )

    scenarios = [
        ("Scenario A: Real Logic Check (NPI Lookup + File Parse)", valid_provider),
        ("Scenario B: High-Risk Detection", risky_provider)
    ]

    for title, provider in scenarios:
        print(f"\n>> Running {title}...")
        job_id = str(uuid.uuid4())
        
        initial_state = MainAgentState(
            job_id=job_id,
            provider_data=provider
        )

        # Run the LangGraph
        final_state = await orchestrator_graph.ainvoke(initial_state)

        # Extract key results
        output = {
            "Job ID": final_state["job_id"],
            "Provider": f"{final_state['provider_data'].first_name} {final_state['provider_data'].last_name}",
            "NPI Valid": final_state["validation_result"].npi_valid if final_state["validation_result"] else None,
            "Fraud Risk": final_state["fraud_analysis"].risk_level.value if final_state["fraud_analysis"] else None,
            "Est. Savings": f"${final_state['business_impact'].estimated_savings}" if final_state["business_impact"] else None,
            "Communication Sent": final_state["communication_required"]
        }
        
        print(json.dumps(output, indent=2, default=json_serial))
        
        if final_state.get("fraud_analysis") and final_state["fraud_analysis"].flagged_patterns:
            print("   Flags:", final_state["fraud_analysis"].flagged_patterns)

if __name__ == "__main__":
    asyncio.run(run_demo())
