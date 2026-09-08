"""
Tests for Recommendation Endpoints (GET /api/learners/{id}/recommendations).
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_get_valid_learner_recommendations():
    response = client.get("/api/learners/LEARNER_0001/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert data["learner_id"] == "LEARNER_0001"


def test_recommendations_response_structure():
    response = client.get("/api/learners/LEARNER_0001/recommendations")
    data = response.json()
    assert "learner_id" in data
    assert "recommendations" in data
    assert "next_best_action" in data
    assert isinstance(data["recommendations"], list)


def test_recommendations_flexible_id():
    response = client.get("/api/learners/L0001/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert data["learner_id"] == "LEARNER_0001"


def test_recommendations_item_schema_fields():
    response = client.get("/api/learners/LEARNER_0001/recommendations")
    data = response.json()
    recs = data["recommendations"]
    assert len(recs) > 0
    rec = recs[0]
    required = ["recommendation_id", "topic", "topic_id", "action", "type", "priority", "reason", "skill_level", "estimated_effort", "confidence"]
    for f in required:
        assert f in rec


def test_next_best_action_matching():
    response = client.get("/api/learners/LEARNER_0001/recommendations")
    data = response.json()
    nba = data["next_best_action"]
    recs = data["recommendations"]
    if nba and recs:
        assert nba["action"] == recs[0]["action"]
        assert nba["topic"] == recs[0]["topic"]


def test_get_invalid_learner_recommendations_404():
    response = client.get("/api/learners/INVALID_LEARNER_99999/recommendations")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data

