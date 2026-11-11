from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    """
    LangGraph Workflow State representing the lifecycle of an enterprise customer request.
    """
    session_id: str
    user_message: str
    customer_email: str
    intent: str
    confidence: float
    entities: Dict[str, Any]
    crm_context: Optional[Dict[str, Any]]
    
    # Tool Execution State
    tool_calls: List[Dict[str, Any]]
    executed_tools: List[str]
    tool_results: Dict[str, Any]
    
    # Safety and Human-in-the-Loop (HITL) Gate
    requires_human_approval: bool
    approval_id: Optional[int]
    approval_action: Optional[str]
    approval_details: Optional[Dict[str, Any]]
    approval_status: Optional[str] # PENDING, APPROVED, REJECTED
    
    # Diagnostics & Tracing
    execution_steps: List[Dict[str, Any]]
    final_response: str

