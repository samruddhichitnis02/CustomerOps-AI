import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, CustomerAccount, Order, RefundRequest
from app.crm.salesforce_client import SalesforceClient
from app.crm.seed_data import seed_initial_crm_data

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_initial_crm_data(db)
    yield db
    db.close()

@pytest.mark.asyncio
async def test_get_customer_by_email(test_db):
    crm = SalesforceClient(test_db)
    customer = await crm.get_customer_by_email("alex.chen@enterprise.com")
    assert customer is not None
    assert customer["name"] == "Alex Chen"
    assert "Enterprise" in customer["tier"]

@pytest.mark.asyncio
async def test_get_order_by_number(test_db):
    crm = SalesforceClient(test_db)
    order = await crm.get_order_by_number("ORD-84920")
    assert order is not None
    assert order["status"] == "Processing"
    assert order["total_amount"] == 149.99

@pytest.mark.asyncio
async def test_refund_threshold_safety_check(test_db):
    crm = SalesforceClient(test_db)
    
    # 1. Under $50 threshold -> Auto-approved
    small_refund = await crm.create_refund_request("ORD-38104", 30.00, "Minor defect")
    assert small_refund["success"] is True
    assert small_refund["requires_human_approval"] is False
    assert small_refund["status"] == "APPROVED"

    # 2. Above $50 threshold -> Requires Human Approval
    large_refund = await crm.create_refund_request("ORD-84920", 149.99, "Hardware failure")
    assert large_refund["success"] is True
    assert large_refund["requires_human_approval"] is True
    assert large_refund["status"] == "PENDING_APPROVAL"

@pytest.mark.asyncio
async def test_cancel_order(test_db):
    crm = SalesforceClient(test_db)
    result = await crm.cancel_order("ORD-84920", "Changed mind")
    assert result["success"] is True
    assert result["new_status"] == "Cancelled"

