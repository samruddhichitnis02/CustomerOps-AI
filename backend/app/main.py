import time
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import init_db, get_db, CustomerAccount, Order, RefundRequest, SupportCase, AuditLog
from app.crm.seed_data import seed_initial_crm_data
from app.crm.salesforce_client import SalesforceClient
from app.agent.graph import CustomerOpsWorkflow
from app.middleware.metrics import LatencyMetricsMiddleware, metrics_tracker
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ApprovalDecisionRequest,
    LatencyMetrics,
    PendingApprovalItem
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("customerops")

# Initialize database
init_db()

# Seed initial CRM records if empty
with next(get_db()) as db_session:
    seed_initial_crm_data(db_session)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Customer Service Agent powered by LangGraph, Salesforce CRM APIs, and Human-in-the-Loop Safety Gates."
)

# Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LatencyMetricsMiddleware)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "salesforce_live_connected": settings.SALESFORCE_ENABLED
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Main conversational agent endpoint.
    Routes queries through the LangGraph agentic workflow with CRM tool calling and safety checks.
    """
    start_time = time.perf_counter()
    crm_client = SalesforceClient(db)
    agent = CustomerOpsWorkflow(crm_client)

    result = await agent.run(
        session_id=payload.session_id,
        message=payload.message,
        customer_email=payload.customer_email
    )

    latency_ms = (time.perf_counter() - start_time) * 1000.0

    return ChatResponse(
        session_id=payload.session_id,
        response=result.get("final_response", ""),
        intent=result.get("intent", "general_faq"),
        confidence=result.get("confidence", 0.85),
        requires_human_approval=result.get("requires_human_approval", False),
        approval_id=result.get("approval_id"),
        approval_action=result.get("approval_action"),
        approval_details=result.get("approval_details"),
        executed_tools=result.get("executed_tools", []),
        execution_steps=result.get("execution_steps", []),
        crm_context=result.get("crm_context"),
        latency_ms=round(latency_ms, 2)
    )

@app.get("/api/approvals/pending", response_model=List[PendingApprovalItem])
def get_pending_approvals(db: Session = Depends(get_db)):
    """Fetch all high-stakes actions waiting for human supervisor sign-off."""
    pending_refunds = (
        db.query(RefundRequest)
        .filter(RefundRequest.status == "PENDING_APPROVAL")
        .all()
    )

    items = []
    for r in pending_refunds:
        order = db.query(Order).filter(Order.id == r.order_id).first()
        customer = db.query(CustomerAccount).filter(CustomerAccount.id == order.customer_id).first() if order else None

        items.append(PendingApprovalItem(
            approval_id=r.id,
            session_id=None,
            order_id=r.order_id,
            order_number=order.order_number if order else "Unknown",
            customer_name=customer.name if customer else "Unknown",
            customer_email=customer.email if customer else "Unknown",
            amount=r.amount,
            reason=r.reason,
            created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            status=r.status
        ))
    return items

@app.post("/api/approvals/{approval_id}/decision")
def submit_approval_decision(approval_id: int, decision: ApprovalDecisionRequest, db: Session = Depends(get_db)):
    """Human Supervisor approval or rejection of high-stakes action."""
    refund = db.query(RefundRequest).filter(RefundRequest.id == approval_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    new_status = "APPROVED" if decision.decision.upper() == "APPROVE" else "REJECTED"
    refund.status = new_status
    refund.approved_by = decision.reviewer
    refund.notes = decision.comment
    db.commit()

    # Log to audit trail
    audit = AuditLog(
        action=f"SUPERVISOR_{new_status}",
        details=f"Refund #{approval_id} ({refund.amount:.2f} USD) was {new_status} by supervisor '{decision.reviewer}'. Comment: {decision.comment or 'None'}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "approval_id": approval_id,
        "new_status": new_status,
        "reviewed_by": decision.reviewer
    }

@app.get("/api/crm/records")
def get_all_crm_records(db: Session = Depends(get_db)):
    """Retrieve live view of CRM records (Contacts, Orders, Cases, Refunds) for Supervisor Dashboard."""
    customers = db.query(CustomerAccount).all()
    orders = db.query(Order).all()
    cases = db.query(SupportCase).all()
    refunds = db.query(RefundRequest).all()

    return {
        "customers": [
            {
                "id": c.id,
                "salesforce_id": c.salesforce_id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "tier": c.tier
            }
            for c in customers
        ],
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_id": o.customer_id,
                "status": o.status,
                "total_amount": o.total_amount,
                "tracking_number": o.tracking_number,
                "shipping_address": o.shipping_address,
                "created_at": o.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for o in orders
        ],
        "cases": [
            {
                "id": c.id,
                "case_number": c.case_number,
                "customer_id": c.customer_id,
                "subject": c.subject,
                "priority": c.priority,
                "status": c.status,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for c in cases
        ],
        "refunds": [
            {
                "id": r.id,
                "order_id": r.order_id,
                "amount": r.amount,
                "reason": r.reason,
                "status": r.status,
                "requires_human_approval": r.requires_human_approval,
                "approved_by": r.approved_by,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for r in refunds
        ]
    }

@app.get("/api/metrics/latency", response_model=LatencyMetrics)
def get_latency_metrics():
    """Retrieve real-time API latency statistics (p50, p90, p95) to verify under 500ms target."""
    return metrics_tracker.get_percentiles()

@app.post("/api/crm/reset-seed")
def reset_seed_data(db: Session = Depends(get_db)):
    """Reset CRM records to standard default state for clean demo presentation."""
    db.query(RefundRequest).delete()
    db.query(SupportCase).delete()
    db.query(Order).delete()
    db.query(CustomerAccount).delete()
    db.query(AuditLog).delete()
    db.commit()

    seed_initial_crm_data(db)
    return {"success": True, "message": "CRM database successfully reset to clean default state."}

