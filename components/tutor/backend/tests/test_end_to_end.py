"""
Full End-to-End System Integration Test.

Tests the full multi-phase pipeline:
FastAPI Request -> Learner Profile (P3) -> Recommendations (P4) -> AI Tutor (P5) -> Response Payload.
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_full_system_integration_flow():
    target_id = "LEARNER_0001"
    
    # 1. Health Diagnostic Check
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"
    assert res_health.json()["models_loaded"] is True
    
    # 2. Learner Intelligence Profile Check (Phase 3)
    res_profile = client.get(f"/api/learners/{target_id}/profile")
    assert res_profile.status_code == 200
    profile_data = res_profile.json()
    assert profile_data["learner_id"] == target_id
    assert "skill_level" in profile_data
    assert "topic_weaknesses" in profile_data
    
    # 3. Personalized Recommendations Check (Phase 4)
    res_recs = client.get(f"/api/learners/{target_id}/recommendations")
    assert res_recs.status_code == 200
    recs_data = res_recs.json()
    assert recs_data["learner_id"] == target_id
    assert len(recs_data["recommendations"]) > 0
    assert recs_data["next_best_action"] is not None
    
    # 4. AI Quantum Tutor Query Check (Phase 5)
    nba_action = recs_data["next_best_action"]["action"]
    tutor_payload = {
        "learner_id": target_id,
        "mode": "explain",
        "question": f"How do I accomplish {nba_action}?"
    }
    res_tutor = client.post("/api/tutor", json=tutor_payload)
    assert res_tutor.status_code == 200
    tutor_data = res_tutor.json()
    
    # 5. Verify Context Reached Tutor Engine & Response Contract
    assert "answer" in tutor_data
    assert len(tutor_data["answer"]) > 0
    assert tutor_data["mode"] == "explain"
    assert tutor_data["difficulty"] == profile_data["skill_level"]
    assert 0.0 <= tutor_data["quality_score"] <= 100.0
    assert 1 <= tutor_data["iterations"] <= 3
