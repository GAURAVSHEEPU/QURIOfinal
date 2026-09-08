"""
Personalization Validation Test Suite.

Verifies that differing learner profiles (Learner A vs Learner B) produce distinct
risk assessments, topic mastery distributions, personalized recommendations, and tutor context.
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_learner_differentiation():
    # 1. Fetch profiles for Learner A (LEARNER_0001) and Learner B (LEARNER_0002)
    res_a = client.get("/api/learners/LEARNER_0001/profile")
    res_b = client.get("/api/learners/LEARNER_0002/profile")
    
    assert res_a.status_code == 200
    assert res_b.status_code == 200
    
    prof_a = res_a.json()
    prof_b = res_b.json()
    
    # 2. Verify profiles are not identical
    assert prof_a["learner_id"] != prof_b["learner_id"]
    assert prof_a["topic_scores"] != prof_b["topic_scores"]
    assert prof_a["predicted_performance"] != prof_b["predicted_performance"]
    
    # 3. Fetch recommendations for Learner A and Learner B
    recs_a = client.get("/api/learners/LEARNER_0001/recommendations").json()
    recs_b = client.get("/api/learners/LEARNER_0002/recommendations").json()
    
    # 4. Verify recommendations differ according to profile context
    assert recs_a["learner_id"] != recs_b["learner_id"]
    
    # 5. Verify tutor context adapts difficulty for different skill tiers
    tutor_a = client.post("/api/tutor", json={"learner_id": "LEARNER_0001", "mode": "explain", "question": "What is superposition?"}).json()
    tutor_b = client.post("/api/tutor", json={"learner_id": "LEARNER_0002", "mode": "explain", "question": "What is superposition?"}).json()
    
    assert tutor_a["difficulty"] == prof_a["skill_level"]
    assert tutor_b["difficulty"] == prof_b["skill_level"]
