from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_chat_order_inquiry():
    payload = {
        "session_id": "test-session-api",
        "message": "Where is my package for order ORD-38104?",
        "customer_email": "alex.chen@enterprise.com"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "order_inquiry"
    assert "Delivered" in data["response"]
    assert data["latency_ms"] < 500.0  # Demonstrating latency performance!

def test_pending_approvals_and_decision():
    # 1. Fetch pending approvals
    get_res = client.get("/api/approvals/pending")
    assert get_res.status_code == 200
    items = get_res.json()
    assert len(items) > 0
    approval_id = items[0]["approval_id"]

    # 2. Submit approval decision
    decision_payload = {
        "decision": "APPROVE",
        "reviewer": "Sarah Connor (Support Lead)",
        "comment": "Verified customer receipt, eligible for full refund."
    }
    post_res = client.post(f"/api/approvals/{approval_id}/decision", json=decision_payload)
    assert post_res.status_code == 200
    assert post_res.json()["new_status"] == "APPROVED"

def test_crm_records_endpoint():
    response = client.get("/api/crm/records")
    assert response.status_code == 200
    data = response.json()
    assert "customers" in data
    assert "orders" in data
    assert "cases" in data
    assert "refunds" in data

def test_latency_metrics_endpoint():
    response = client.get("/api/metrics/latency")
    assert response.status_code == 200
    data = response.json()
    assert "p50_latency_ms" in data
    assert "p95_latency_ms" in data
    assert data["target_met_p95_under_500ms"] is True

