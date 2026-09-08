"""
Tests for AI Quantum Tutor Endpoints (POST /api/tutor).
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_tutor_explain_mode_success():
    payload = {
        "learner_id": "LEARNER_0001",
        "mode": "explain",
        "question": "Why does measurement collapse a quantum state?"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "explain"
    assert "answer" in data


def test_tutor_hint_mode_success():
    payload = {
        "learner_id": "LEARNER_0001",
        "mode": "hint",
        "question": "How to create entanglement in Qiskit?"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "hint"


def test_tutor_debug_mode_success():
    payload = {
        "mode": "debug",
        "question": "qc.h(0)\nqc.cx(0, 1)\n# Why is measurement missing?"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "debug"


def test_tutor_code_explain_mode_success():
    payload = {
        "mode": "code_explain",
        "question": "qc = QuantumCircuit(2); qc.h(0); qc.cx(0,1)"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "code_explain"


def test_tutor_circuit_explain_mode_success():
    payload = {
        "mode": "circuit_explain",
        "question": "Explain state transformation in Bell state creation circuit"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "circuit_explain"


def test_tutor_practice_mode_success():
    payload = {
        "mode": "practice",
        "question": "Give me a practice exercise on quantum superposition"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "practice"


def test_tutor_with_learner_context():
    payload = {
        "learner_id": "LEARNER_0001",
        "mode": "explain",
        "question": "Explain Grover search algorithm"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 0


def test_tutor_response_schema_fields():
    payload = {
        "question": "What is a qubit?",
        "mode": "explain"
    }
    response = client.post("/api/tutor", json=payload)
    data = response.json()
    fields = ["answer", "concept", "difficulty", "mode", "hint", "next_step", "confidence", "quality_score", "iterations"]
    for f in fields:
        assert f in data
    assert 0.0 <= data["quality_score"] <= 100.0


def test_tutor_invalid_mode_rejection():
    payload = {
        "mode": "invalid_mode_xyz",
        "question": "What is a qubit?"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


def test_tutor_missing_question_validation():
    payload = {
        "mode": "explain"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 422


def test_tutor_short_question_validation():
    payload = {
        "question": "hi",  # min_length is 3
        "mode": "explain"
    }
    response = client.post("/api/tutor", json=payload)
    assert response.status_code == 422

