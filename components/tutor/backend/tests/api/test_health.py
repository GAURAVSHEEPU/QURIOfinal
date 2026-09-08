"""
Tests for Health Diagnostic Endpoints (GET /health).
"""

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health_status_code():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_structure():
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "models_loaded" in data
    assert "tutor_available" in data


def test_health_service_name():
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "quantum-learning-platform"


def test_health_models_loaded_boolean():
    response = client.get("/health")
    data = response.json()
    assert isinstance(data["models_loaded"], bool)


def test_health_tutor_available_boolean():
    response = client.get("/health")
    data = response.json()
    assert isinstance(data["tutor_available"], bool)

