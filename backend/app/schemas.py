from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique conversation session ID")
    message: str = Field(..., description="User query or input")
    customer_email: Optional[str] = Field("alex.chen@enterprise.com", description="Identified customer email")

class StepTrace(BaseModel):
    step_name: str
    status: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    intent: str
    confidence: float
    requires_human_approval: bool
    approval_id: Optional[int] = None
    approval_action: Optional[str] = None
    approval_details: Optional[Dict[str, Any]] = None
    executed_tools: List[str] = []
    execution_steps: List[StepTrace] = []
    crm_context: Optional[Dict[str, Any]] = None
    latency_ms: float

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT")
    reviewer: str = Field(..., description="Name or ID of human supervisor")
    comment: Optional[str] = None

class LatencyMetrics(BaseModel):
    total_requests: int
    p50_latency_ms: float
    p90_latency_ms: float
    p95_latency_ms: float
    avg_latency_ms: float
    target_met_p95_under_500ms: bool

class PendingApprovalItem(BaseModel):
    approval_id: int
    session_id: Optional[str]
    order_id: int
    order_number: str
    customer_name: str
    customer_email: str
    amount: float
    reason: str
    created_at: str
    status: str

