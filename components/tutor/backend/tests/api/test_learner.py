"""
Tests for Learner Profile & Prediction Endpoints (GET /api/learners/{id}/profile & POST /api/learners/predict).
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_get_valid_learner_profile():
    response = client.get("/api/learners/LEARNER_0001/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["learner_id"] == "LEARNER_0001"


def test_learner_profile_schema_fields():
    response = client.get("/api/learners/LEARNER_0001/profile")
    data = response.json()
    assert "skill_level" in data
    assert "predicted_performance" in data
    assert "risk_status" in data
    assert "topic_scores" in data
    assert "personalization_signals" in data
    assert len(data["topic_scores"]) == 9


def test_learner_profile_flexible_id():
    response = client.get("/api/learners/L0001/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["learner_id"] == "LEARNER_0001"


def test_get_invalid_learner_profile_404():
    response = client.get("/api/learners/INVALID_LEARNER_99999/profile")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_predict_telemetry_valid():
    payload = {
        "age_group": "18-24",
        "learning_hours_per_week": 8.5,
        "modules_completed": 6,
        "qubits_score": 75.0,
        "superposition_score": 68.0,
        "measurement_score": 78.0,
        "quantum_gates_score": 72.0,
        "entanglement_score": 82.0,
        "bell_states_score": 71.0,
        "quantum_circuits_score": 64.0,
        "grover_score": 58.0,
        "shor_score": 52.0,
        "time_spent_minutes": 125.0,
        "attempts": 4,
        "errors": 5,
        "quiz_score": 70.0,
        "coding_score": 67.0,
        "challenge_score": 62.0
    }
    response = client.post("/api/learners/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_performance" in data
    assert "predicted_risk_probability" in data
    assert "predicted_risk_status" in data
    assert "predicted_skill_level" in data


def test_predict_telemetry_response_structure():
    payload = {
        "learning_hours_per_week": 10.0,
        "modules_completed": 8,
        "qubits_score": 90.0,
        "superposition_score": 85.0,
        "measurement_score": 88.0,
        "quantum_gates_score": 82.0,
        "entanglement_score": 85.0,
        "bell_states_score": 80.0,
        "quantum_circuits_score": 78.0,
        "grover_score": 75.0,
        "shor_score": 70.0,
        "time_spent_minutes": 150.0,
        "attempts": 3,
        "errors": 2,
        "quiz_score": 88.0,
        "coding_score": 85.0,
        "challenge_score": 80.0
    }
    response = client.post("/api/learners/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["predicted_performance"], float)
    assert data["predicted_risk_status"] in ("On-Track", "At-Risk")
    assert data["predicted_skill_level"] in ("Beginner", "Intermediate", "Advanced")


def test_predict_telemetry_out_of_bounds_validation():
    payload = {
        "qubits_score": 150.0  # Invalid score > 100
    }
    response = client.post("/api/learners/predict", json=payload)
    assert response.status_code == 422

