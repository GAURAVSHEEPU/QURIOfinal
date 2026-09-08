"""
End-to-End Integration Test for Quantum Algorithm Learning Platform API.

Validates the full multi-phase intelligence workflow across:
Learner Telemetry -> Intelligence Profile (P3) -> Recommendations (P4) -> AI Tutor Loop (P5).
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_end_to_end_learner_workflow():
    learner_id = "LEARNER_0001"
    
    # 1. Fetch Health Status
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"
    
    # 2. Fetch Learner Intelligence Profile (Phase 3)
    res_profile = client.get(f"/api/learners/{learner_id}/profile")
    assert res_profile.status_code == 200
    profile_data = res_profile.json()
    assert profile_data["learner_id"] == learner_id
    assert "skill_level" in profile_data
    assert "topic_weaknesses" in profile_data
    
    # 3. Fetch Personalized Recommendations (Phase 4)
    res_recs = client.get(f"/api/learners/{learner_id}/recommendations")
    assert res_recs.status_code == 200
    recs_data = res_recs.json()
    assert recs_data["learner_id"] == learner_id
    assert "recommendations" in recs_data
    assert "next_best_action" in recs_data
    
    next_action = recs_data["next_best_action"]
    assert next_action is not None
    
    # 4. Invoke AI Quantum Tutor (Phase 5) using Learner & Recommendation context
    tutor_payload = {
        "learner_id": learner_id,
        "mode": "explain",
        "question": f"Explain the concept for {next_action['topic']} and why I should {next_action['action']}"
    }
    res_tutor = client.post("/api/tutor", json=tutor_payload)
    assert res_tutor.status_code == 200
    tutor_data = res_tutor.json()
    
    # 5. Verify Structured Tutor Payload
    assert "answer" in tutor_data
    assert len(tutor_data["answer"]) > 0
    assert tutor_data["mode"] == "explain"
    assert 0.0 <= tutor_data["quality_score"] <= 100.0
    assert 1 <= tutor_data["iterations"] <= 3


def test_end_to_end_prediction_to_tutor_workflow():
    # 1. Post raw interaction telemetry to prediction endpoint (Phase 2 ML models)
    telemetry = {
        "learning_hours_per_week": 12.0,
        "modules_completed": 7,
        "qubits_score": 85.0,
        "superposition_score": 80.0,
        "measurement_score": 75.0,
        "quantum_gates_score": 60.0,
        "entanglement_score": 55.0,
        "bell_states_score": 50.0,
        "quantum_circuits_score": 45.0,
        "grover_score": 40.0,
        "shor_score": 35.0,
        "time_spent_minutes": 180.0,
        "attempts": 8,
        "errors": 9,
        "quiz_score": 62.0,
        "coding_score": 58.0,
        "challenge_score": 50.0
    }
    res_pred = client.post("/api/learners/predict", json=telemetry)
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    assert "predicted_performance" in pred_data
    assert "predicted_skill_level" in pred_data
    
    # 2. Invoke Tutor based on predicted telemetry outcome
    tutor_payload = {
        "learner_id": "LEARNER_0002",
        "mode": "debug",
        "question": "My quantum circuit is returning unexpected measurement probabilities."
    }
    res_tutor = client.post("/api/tutor", json=tutor_payload)
    assert res_tutor.status_code == 200
    tutor_data = res_tutor.json()
    assert tutor_data["mode"] == "debug"
    assert "answer" in tutor_data

