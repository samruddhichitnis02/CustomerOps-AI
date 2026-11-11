from typing import Dict, Any
from app.crm.salesforce_client import SalesforceClient

async def tool_lookup_account(crm: SalesforceClient, email: str) -> Dict[str, Any]:
    """Retrieves customer account profile from Salesforce CRM."""
    profile = await crm.get_customer_by_email(email)
    if profile:
        return {"found": True, "account": profile}
    return {"found": False, "message": f"No CRM account found for email {email}."}

async def tool_get_order_status(crm: SalesforceClient, order_number: str) -> Dict[str, Any]:
    """Retrieves real-time order status, fulfillment tracking, and items."""
    order = await crm.get_order_by_number(order_number)
    if order:
        return {"found": True, "order": order}
    return {"found": False, "message": f"Order {order_number} not found in CRM database."}

async def tool_request_refund(crm: SalesforceClient, order_number: str, amount: float, reason: str) -> Dict[str, Any]:
    """
    Submits a refund request.
    Automatically checks enterprise safety guardrails (amounts > $50 require human supervisor sign-off).
    """
    return await crm.create_refund_request(order_number=order_number, amount=amount, reason=reason)

async def tool_cancel_order(crm: SalesforceClient, order_number: str, reason: str) -> Dict[str, Any]:
    """Submits an order cancellation request to Salesforce."""
    return await crm.cancel_order(order_number=order_number, reason=reason)

async def tool_create_case(crm: SalesforceClient, customer_email: str, subject: str, description: str, priority: str = "Medium") -> Dict[str, Any]:
    """Escalates an issue by logging a Salesforce Case."""
    return await crm.create_support_case(customer_email=customer_email, subject=subject, description=description, priority=priority)

