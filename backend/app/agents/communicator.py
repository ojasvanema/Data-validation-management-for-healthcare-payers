from ..models import MainAgentState
import asyncio

async def communicator_agent_node(state: MainAgentState) -> MainAgentState:
    """
    Communicator Agent:
    Automates all outbound communication to providers to resolve data discrepancies.
    """
    if state.communication_required:
        print(f"[{state.job_id}] [Communicator Agent] Initiating contact protocol...")
        await asyncio.sleep(0.2)
        # Mock sending email/SMS
        print(f"[{state.job_id}] [Communicator Agent] Email sent to provider regarding discrepancies.")
    return state
