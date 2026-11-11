import json
from sqlalchemy.orm import Session
from app.database import CustomerAccount, Order, SupportCase, RefundRequest

def seed_initial_crm_data(db: Session):
    """Seed initial realistic enterprise CRM accounts, orders, and cases."""
    if db.query(CustomerAccount).count() > 0:
        return

    # 1. Seed Customer Accounts
    customers = [
        CustomerAccount(
            salesforce_id="0038b00003N1oAaAAJ",
            name="Alex Chen",
            email="alex.chen@enterprise.com",
            phone="+1 (415) 555-0192",
            tier="Enterprise Platinum"
        ),
        CustomerAccount(
            salesforce_id="0038b00003N1oAbAAJ",
            name="Sarah Jenkins",
            email="sarah.j@acmecorp.io",
            phone="+1 (212) 555-8391",
            tier="Gold Priority"
        ),
        CustomerAccount(
            salesforce_id="0038b00003N1oAcAAJ",
            name="David Miller",
            email="david.miller@gmail.com",
            phone="+1 (510) 555-4422",
            tier="Standard"
        )
    ]
    db.add_all(customers)
    db.commit()

    # 2. Seed Orders
    orders = [
        Order(
            order_number="ORD-84920",
            customer_id=1,
            status="Processing",
            total_amount=149.99,
            items_json=json.dumps([
                {"item": "Ultra Wireless Noise-Cancelling Headphones", "qty": 1, "price": 149.99}
            ]),
            shipping_address="500 Howard St, San Francisco, CA 94105",
            tracking_number="TRK-9921482-SF"
        ),
        Order(
            order_number="ORD-38104",
            customer_id=1,
            status="Delivered",
            total_amount=45.00,
            items_json=json.dumps([
                {"item": "Smart Desk Mat & Fast Wireless Charger", "qty": 1, "price": 45.00}
            ]),
            shipping_address="500 Howard St, San Francisco, CA 94105",
            tracking_number="TRK-1029384-US"
        ),
        Order(
            order_number="ORD-10928",
            customer_id=2,
            status="Shipped",
            total_amount=289.50,
            items_json=json.dumps([
                {"item": "Mechanical Ergonomic Keyboard (Split RGB)", "qty": 1, "price": 249.50},
                {"item": "Precision Wrist Rest Gel Cushion", "qty": 1, "price": 40.00}
            ]),
            shipping_address="742 Evergreen Terrace, Springfield, IL",
            tracking_number="TRK-8819203-FEDEX"
        ),
        Order(
            order_number="ORD-55201",
            customer_id=3,
            status="Processing",
            total_amount=32.99,
            items_json=json.dumps([
                {"item": "USB-C Multiport Hub 7-in-1", "qty": 1, "price": 32.99}
            ]),
            shipping_address="12 Ocean Drive, Miami, FL 33139",
            tracking_number="TRK-449102-DHL"
        )
    ]
    db.add_all(orders)
    db.commit()

    # 3. Seed Support Cases
    cases = [
        SupportCase(
            case_number="CAS-10001",
            customer_id=1,
            subject="Invoice receipt missing company tax ID",
            description="Customer requested an updated receipt with EU VAT ID included.",
            priority="Low",
            status="Closed"
        ),
        SupportCase(
            case_number="CAS-10002",
            customer_id=2,
            subject="Delivery delay inquiry for expedited package",
            description="Customer package held at regional sort facility due to weather.",
            priority="Medium",
            status="In Progress"
        )
    ]
    db.add_all(cases)
    db.commit()

    # 4. Seed an example pending refund to showcase the HITL queue immediately in the UI!
    sample_pending_refund = RefundRequest(
        order_id=1,
        amount=149.99,
        reason="Defective audio balance on left headphone driver upon unboxing",
        status="PENDING_APPROVAL",
        requires_human_approval=True
    )
    db.add(sample_pending_refund)
    db.commit()

