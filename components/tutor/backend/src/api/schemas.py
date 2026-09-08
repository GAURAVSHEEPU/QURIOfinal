"""
Pydantic Schemas for Quantum Algorithm Learning Platform API.

Defines strict input validation and response contracts across all backend endpoints.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# ------------------------------------------
# HEALTH SCHEMAS
# ------------------------------------------

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"}, description="Overall backend operational status")
    service: str = Field(..., json_schema_extra={"example": "quantum-learning-platform"}, description="Service identifier")
    models_loaded: bool = Field(..., json_schema_extra={"example": True}, description="Whether ML models are loaded into memory")
    tutor_available: bool = Field(..., json_schema_extra={"example": True}, description="Whether the AI Tutor service is ready")


# ------------------------------------------
# LEARNER PROFILE SCHEMAS (Phase 3)
# ------------------------------------------

class LearningBehaviorSchema(BaseModel):
    learning_hours_per_week: float = Field(..., json_schema_extra={"example": 8.5})
    modules_completed: int = Field(..., json_schema_extra={"example": 6})
    attempts: int = Field(..., json_schema_extra={"example": 5})
    errors: int = Field(..., json_schema_extra={"example": 7})
    time_spent_minutes: float = Field(..., json_schema_extra={"example": 120.0})
    behavior_signals: List[str] = Field(default_factory=list)


class PersonalizationSignalsSchema(BaseModel):
    current_skill_level: str = Field(..., json_schema_extra={"example": "Intermediate"})
    performance_band: str = Field(..., json_schema_extra={"example": "Moderate"})
    risk_status: str = Field(..., json_schema_extra={"example": "Low Risk"})
    weak_topics: List[str] = Field(default_factory=list)
    strong_topics: List[str] = Field(default_factory=list)
    developing_topics: List[str] = Field(default_factory=list)
    high_error_signal: bool = Field(default=False)
    high_attempt_signal: bool = Field(default=False)
    low_module_completion_signal: bool = Field(default=False)
    high_learning_activity_signal: bool = Field(default=False)


class LearnerProfileResponse(BaseModel):
    learner_id: str = Field(..., json_schema_extra={"example": "LEARNER_0001"})
    skill_level: str = Field(..., json_schema_extra={"example": "Intermediate"})
    predicted_performance: float = Field(..., json_schema_extra={"example": 65.29})
    performance_band: str = Field(..., json_schema_extra={"example": "Moderate"})
    risk_probability: float = Field(..., json_schema_extra={"example": 0.0007})
    risk_status: str = Field(..., json_schema_extra={"example": "Low Risk"})
    topic_scores: Dict[str, float] = Field(...)
    topic_strengths: List[str] = Field(default_factory=list)
    topic_weaknesses: List[str] = Field(default_factory=list)
    topic_developing: List[str] = Field(default_factory=list)
    learning_behavior: LearningBehaviorSchema
    personalization_signals: PersonalizationSignalsSchema
    intelligence_summary: str = Field(..., json_schema_extra={"example": "Learner profile summary string"})


# ------------------------------------------
# RECOMMENDATION SCHEMAS (Phase 4)
# ------------------------------------------

class RecommendationItemSchema(BaseModel):
    recommendation_id: str = Field(..., json_schema_extra={"example": "REC_PREREQ_QUANTUM_CIRCUITS"})
    topic: str = Field(..., json_schema_extra={"example": "Quantum Circuits"})
    topic_id: str = Field(..., json_schema_extra={"example": "quantum_circuits"})
    action: str = Field(..., json_schema_extra={"example": "Reinforce prerequisite concept: Quantum Circuits"})
    type: str = Field(..., json_schema_extra={"example": "reinforce_prerequisite"})
    priority: float = Field(..., json_schema_extra={"example": 100.0})
    reason: str = Field(..., json_schema_extra={"example": "Prerequisite score requiring reinforcement"})
    skill_level: str = Field(..., json_schema_extra={"example": "Intermediate"})
    estimated_effort: str = Field(..., json_schema_extra={"example": "20 mins"})
    confidence: float = Field(..., json_schema_extra={"example": 0.92})


class NextBestActionSchema(BaseModel):
    topic: str = Field(..., json_schema_extra={"example": "Quantum Circuits"})
    topic_id: str = Field(..., json_schema_extra={"example": "quantum_circuits"})
    action: str = Field(..., json_schema_extra={"example": "Reinforce prerequisite concept: Quantum Circuits"})
    type: str = Field(..., json_schema_extra={"example": "reinforce_prerequisite"})
    priority: float = Field(..., json_schema_extra={"example": 100.0})
    reason: str = Field(..., json_schema_extra={"example": "Prerequisite score requiring reinforcement"})


class RecommendationResponse(BaseModel):
    learner_id: str = Field(..., json_schema_extra={"example": "LEARNER_0001"})
    recommendations: List[RecommendationItemSchema] = Field(default_factory=list)
    next_best_action: Optional[NextBestActionSchema] = None


# ------------------------------------------
# AI TUTOR SCHEMAS (Phase 5)
# ------------------------------------------

class TutorRequest(BaseModel):
    learner_id: Optional[str] = Field(default=None, json_schema_extra={"example": "LEARNER_0001"}, description="Target learner ID for personalized context")
    mode: str = Field("explain", json_schema_extra={"example": "explain"}, description="Tutor mode: explain, chat, hint, debug, code_explain, circuit_explain, circuit_assistant, quiz_analysis, practice")
    question: str = Field(..., min_length=3, max_length=5000, json_schema_extra={"example": "Why does measurement collapse a quantum state?"}, description="User query, code snippet, circuit diagram, or question")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional structured input such as circuit data or quiz results")


class TutorResponse(BaseModel):
    answer: str = Field(..., description="Generative explanation or guidance")
    concept: str = Field(..., json_schema_extra={"example": "Quantum Measurement"}, description="Target quantum topic concept")
    difficulty: str = Field(..., json_schema_extra={"example": "Intermediate"}, description="Adapted difficulty level")
    mode: str = Field(..., json_schema_extra={"example": "explain"}, description="Tutor mode executed")
    hint: str = Field(..., description="Actionable hint or key insight")
    next_step: str = Field(..., description="Suggested next learning activity")
    confidence: float = Field(..., json_schema_extra={"example": 0.95}, description="Response confidence score")
    quality_score: float = Field(..., json_schema_extra={"example": 90.0}, description="Loop engineering critic score (0-100)")
    iterations: int = Field(..., json_schema_extra={"example": 1}, description="Number of improvement loop iterations executed")
    circuit_validation: Optional[Dict[str, Any]] = Field(default=None, description="Deterministic circuit validation results")
    quiz_analysis: Optional[Dict[str, Any]] = Field(default=None, description="Deterministic quiz analysis results")
    suggestions: List[str] = Field(default_factory=list, description="Dynamic context-aware suggested follow-up questions")



# ------------------------------------------
# PREDICTION SCHEMAS (Phase 2 ML Inference)
# ------------------------------------------

class PredictRequest(BaseModel):
    age_group: str = Field("18-24", json_schema_extra={"example": "18-24"})
    learning_hours_per_week: float = Field(8.0, ge=0.0, le=100.0, json_schema_extra={"example": 8.5})
    modules_completed: int = Field(5, ge=0, le=9, json_schema_extra={"example": 6})
    qubits_score: float = Field(70.0, ge=0.0, le=100.0, json_schema_extra={"example": 75.0})
    superposition_score: float = Field(65.0, ge=0.0, le=100.0, json_schema_extra={"example": 68.0})
    measurement_score: float = Field(75.0, ge=0.0, le=100.0, json_schema_extra={"example": 78.0})
    quantum_gates_score: float = Field(70.0, ge=0.0, le=100.0, json_schema_extra={"example": 72.0})
    entanglement_score: float = Field(80.0, ge=0.0, le=100.0, json_schema_extra={"example": 82.0})
    bell_states_score: float = Field(70.0, ge=0.0, le=100.0, json_schema_extra={"example": 71.0})
    quantum_circuits_score: float = Field(60.0, ge=0.0, le=100.0, json_schema_extra={"example": 64.0})
    grover_score: float = Field(55.0, ge=0.0, le=100.0, json_schema_extra={"example": 58.0})
    shor_score: float = Field(50.0, ge=0.0, le=100.0, json_schema_extra={"example": 52.0})
    time_spent_minutes: float = Field(120.0, ge=0.0, le=1000.0, json_schema_extra={"example": 125.0})
    attempts: int = Field(5, ge=1, le=50, json_schema_extra={"example": 4})
    errors: int = Field(6, ge=0, le=50, json_schema_extra={"example": 5})
    quiz_score: float = Field(68.0, ge=0.0, le=100.0, json_schema_extra={"example": 70.0})
    coding_score: float = Field(65.0, ge=0.0, le=100.0, json_schema_extra={"example": 67.0})
    challenge_score: float = Field(60.0, ge=0.0, le=100.0, json_schema_extra={"example": 62.0})


class PredictResponse(BaseModel):
    predicted_performance: float = Field(..., json_schema_extra={"example": 67.45})
    predicted_risk_probability: float = Field(..., json_schema_extra={"example": 0.0125})
    predicted_risk_status: str = Field(..., json_schema_extra={"example": "On-Track"})
    predicted_skill_level: str = Field(..., json_schema_extra={"example": "Intermediate"})

