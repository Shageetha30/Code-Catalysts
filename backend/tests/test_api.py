import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database

@pytest.fixture(scope="module")
def client():
    # Setup test database tables & seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "simulated data" in data["notice"].lower()

def test_stats_endpoint(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "active_shipments" in data
    assert data["active_shipments"] > 0
    assert "batches_requiring_review" in data

def test_shipments_list(client):
    response = client.get("/api/shipments")
    assert response.status_code == 200
    shipments = response.json()
    assert len(shipments) >= 3
    assert any(s["id"] == "SHP-7041" for s in shipments)

def test_shipment_detail(client):
    response = client.get("/api/shipments/SHP-7041")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "SHP-7041"
    assert len(data["batches"]) >= 1
    assert len(data["checkpoints"]) >= 1

def test_telemetry_latest(client):
    response = client.get("/api/telemetry/latest")
    assert response.status_code == 200
    readings = response.json()
    assert isinstance(readings, list)

def test_incidents_crud(client):
    # List incidents
    res = client.get("/api/incidents")
    assert res.status_code == 200
    incidents = res.json()
    assert len(incidents) >= 1

    # Create new test incident
    new_inc = {
        "shipment_id": "SHP-7041",
        "incident_type": "Temperature Threshold",
        "severity": "Medium",
        "title": "Automated Test Incident",
        "description": "Triggered during integration test run",
        "recorded_temp": 8.5
    }
    create_res = client.post("/api/incidents", json=new_inc)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["status"] == "Open"

    # Patch incident status to Resolved
    patch_res = client.patch(
        f"/api/incidents/{created['id']}",
        json={"status": "Resolved", "resolution_notes": "Resolved by automated test"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Resolved"

def test_batch_review_action(client):
    batches_res = client.get("/api/reviews/batches")
    assert batches_res.status_code == 200
    batches = batches_res.json()
    assert len(batches) >= 1
    target_batch = batches[0]["id"]

    # Submit review decision
    action_payload = {
        "action": "Under Review",
        "reason": "Secondary stability testing requested by pharmacist auditor",
        "reviewed_by": "Dr. Sarah QA"
    }
    action_res = client.post(f"/api/reviews/batches/{target_batch}/action", json=action_payload)
    assert action_res.status_code == 200
    updated = action_res.json()
    assert updated["review_status"] == "Under Review"
    assert updated["reviewed_by"] == "Dr. Sarah QA"

def test_ml_detect_endpoint(client):
    payload = {
        "temperature_window": [4.5, 4.8, 5.2, 5.9, 7.1, 8.4, 9.8],
        "target_min": 2.0,
        "target_max": 8.0
    }
    res = client.post("/api/ml/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "anomaly_score" in data
    assert "is_anomaly" in data
    assert "explanation" in data
