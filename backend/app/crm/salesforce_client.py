import logging
import httpx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.database import CustomerAccount, Order, RefundRequest, SupportCase, AuditLog

logger = logging.getLogger(__name__)

class SalesforceClient:
    """
    Enterprise CRM client for CustomerOps AI.
    Features dual-mode operation:
      1. Live Salesforce REST API mode (via OAuth / Connected App)
      2. Local Enterprise CRM Database mode (instant zero-setup testing and offline demo)
    """
    def __init__(self, db: Session):
        self.db = db
        self.is_live_salesforce = settings.SALESFORCE_ENABLED and bool(settings.SALESFORCE_INSTANCE_URL)

    async def get_customer_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Look up customer account record by email."""
        if self.is_live_salesforce:
            try:
                query = f"SELECT Id, Name, Email, Phone, Account_Tier__c FROM Contact WHERE Email = '{email}' LIMIT 1"
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"{settings.SALESFORCE_INSTANCE_URL}/services/data/v58.0/query/?q={query}",
                        headers={"Authorization": f"Bearer {settings.SALESFORCE_ACCESS_TOKEN}"}
                    )
                    if resp.status_code == 200:
                        records = resp.json().get("records", [])
                        if records:
                            rec = records[0]
                            return {
                                "id": rec.get("Id"),
                                "name": rec.get("Name"),
                                "email": rec.get("Email"),
                                "phone": rec.get("Phone"),
                                "tier": rec.get("Account_Tier__c", "Standard")
                            }
            except Exception as e:
                logger.warning(f"Salesforce live query failed, falling back to local DB: {e}")

        # Local CRM Database lookup
        customer = self.db.query(CustomerAccount).filter(CustomerAccount.email.ilike(email)).first()
        if customer:
            return {
                "id": customer.id,
                "salesforce_id": customer.salesforce_id,
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone,
                "tier": customer.tier
            }
        return None

    async def get_order_by_number(self, order_number: str) -> Optional[Dict[str, Any]]:
        """Fetch order details and current shipment/fulfillment status."""
        order = self.db.query(Order).filter(Order.order_number == order_number).first()
        if order:
            customer = self.db.query(CustomerAccount).filter(CustomerAccount.id == order.customer_id).first()
            return {
                "id": order.id,
                "order_number": order.order_number,
                "customer_name": customer.name if customer else "Unknown",
                "customer_email": customer.email if customer else "Unknown",
                "status": order.status,
                "total_amount": order.total_amount,
                "items": order.items_json,
                "shipping_address": order.shipping_address,
                "tracking_number": order.tracking_number,
                "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
        return None

    async def create_refund_request(self, order_number: str, amount: float, reason: str) -> Dict[str, Any]:
        """
        Create a refund record.
        Enforces Salesforce Safety Guardrail:
        - If amount > REFUND_APPROVAL_THRESHOLD_USD ($50), flags for Human-In-The-Loop approval.
        """
        order = self.db.query(Order).filter(Order.order_number == order_number).first()
        if not order:
            return {"success": False, "error": f"Order {order_number} not found."}

        requires_approval = amount > settings.REFUND_APPROVAL_THRESHOLD_USD
        status = "PENDING_APPROVAL" if requires_approval else "APPROVED"

        refund = RefundRequest(
            order_id=order.id,
            amount=amount,
            reason=reason,
            status=status,
            requires_human_approval=requires_approval
        )
        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)

        # Audit log
        audit = AuditLog(
            action="REFUND_INITIATED",
            details=f"Refund #{refund.id} of ${amount:.2f} for Order {order_number} (Requires Approval: {requires_approval})"
        )
        self.db.add(audit)
        self.db.commit()

        return {
            "success": True,
            "refund_id": refund.id,
            "order_number": order_number,
            "amount": amount,
            "status": status,
            "requires_human_approval": requires_approval
        }

    async def cancel_order(self, order_number: str, reason: str) -> Dict[str, Any]:
        """Cancel an order if eligible (i.e. not already delivered)."""
        order = self.db.query(Order).filter(Order.order_number == order_number).first()
        if not order:
            return {"success": False, "error": f"Order {order_number} not found."}
        
        if order.status in ["Delivered", "Cancelled"]:
            return {"success": False, "error": f"Order {order_number} cannot be cancelled as it is already {order.status}."}
        
        order.status = "Cancelled"
        self.db.commit()

        audit = AuditLog(
            action="ORDER_CANCELLED",
            details=f"Order {order_number} cancelled. Reason: {reason}"
        )
        self.db.add(audit)
        self.db.commit()

        return {"success": True, "order_number": order_number, "new_status": "Cancelled", "reason": reason}

    async def create_support_case(self, customer_email: str, subject: str, description: str, priority: str = "Medium") -> Dict[str, Any]:
        """Create a new Support Case in CRM."""
        customer = self.db.query(CustomerAccount).filter(CustomerAccount.email.ilike(customer_email)).first()
        customer_id = customer.id if customer else 1
        case_count = self.db.query(SupportCase).count() + 1
        case_number = f"CAS-{10000 + case_count}"

        case = SupportCase(
            case_number=case_number,
            customer_id=customer_id,
            subject=subject,
            description=description,
            priority=priority,
            status="Open"
        )
        self.db.add(case)
        self.db.commit()
        self.db.refresh(case)

        return {
            "success": True,
            "case_number": case.case_number,
            "subject": case.subject,
            "priority": case.priority,
            "status": case.status
        }

