import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.crm.salesforce_client import SalesforceClient
from app.crm.seed_data import seed_initial_crm_data
from app.agent.graph import CustomerOpsWorkflow

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def agent_fixture():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_initial_crm_data(db)
    crm = SalesforceClient(db)
    workflow = CustomerOpsWorkflow(crm)
    yield workflow
    db.close()

@pytest.mark.asyncio
async def test_order_status_workflow(agent_fixture):
    result = await agent_fixture.run(
        session_id="test-session-1",
        message="What is the tracking status of order ORD-84920?",
        customer_email="alex.chen@enterprise.com"
    )
    assert result["intent"] == "order_inquiry"
    assert "ORD-84920" in result["final_response"]
    assert "Processing" in result["final_response"]
    assert result["requires_human_approval"] is False

@pytest.mark.asyncio
async def test_refund_workflow_with_safety_guard(agent_fixture):
    result = await agent_fixture.run(
        session_id="test-session-2",
        message="I would like a refund of $149.99 for order ORD-84920 because the headphones are defective.",
        customer_email="alex.chen@enterprise.com"
    )
    assert result["intent"] == "refund_request"
    assert result["requires_human_approval"] is True
    assert result["approval_id"] is not None
    assert "Enterprise Safety Notice" in result["final_response"]

@pytest.mark.asyncio
async def test_cancellation_workflow(agent_fixture):
    result = await agent_fixture.run(
        session_id="test-session-3",
        message="Please cancel my order ORD-55201 immediately.",
        customer_email="david.miller@gmail.com"
    )
    assert result["intent"] == "cancellation_request"
    assert "Cancelled" in result["final_response"]

