"""
Learner Intelligence Profile Engine for Quantum Algorithm Learning Platform.

This module consumes raw learner interaction features and Phase 2 classical ML models to
build a structured, JSON-serializable learner profile.

ARCHITECTURAL PRINCIPLE:
- PREDICTION: Handled exclusively by trained Scikit-Learn models (Phase 2).
- INTERPRETATION: Handled by this module using transparent, deterministic prototype heuristics.
- DATA LEAKAGE: Forbidden target columns ('overall_score', 'learning_risk', 'skill_level')
  are strictly stripped before preprocessing or prediction.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

# Expected 18 feature names accepted by ml_preprocessor.joblib
FEATURE_COLUMNS = [
    "age_group",
    "learning_hours_per_week",
    "quiz_score",
    "coding_score",
    "challenge_score",
    "attempts",
    "errors",
    "time_spent_minutes",
    "modules_completed",
    "qubits_score",
    "superposition_score",
    "measurement_score",
    "quantum_gates_score",
    "entanglement_score",
    "bell_states_score",
    "quantum_circuits_score",
    "grover_score",
    "shor_score"
]

# 9 Quantum Curriculum Topics
QUANTUM_TOPICS = [
    "qubits",
    "superposition",
    "measurement",
    "quantum_gates",
    "entanglement",
    "bell_states",
    "quantum_circuits",
    "grover",
    "shor"
]

# Forbidden target columns that cause data leakage if passed into ML models
FORBIDDEN_TARGETS = ["learner_id", "overall_score", "learning_risk", "skill_level"]


def get_default_project_root() -> str:
    """Returns absolute path to project root directory."""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))


def load_models(project_root: str = None) -> dict:
    """
    Loads preprocessor and Phase 2 ML model binaries from model registry or standard locations.
    
    Args:
        project_root: Optional custom path to project root directory.
        
    Returns:
        Dictionary containing loaded preprocessor and model artifacts.
    """
    if project_root is None:
        project_root = get_default_project_root()
        
    processed_dir = os.path.join(project_root, "data/processed")
    models_dir = os.path.join(project_root, "data/models")
    
    preprocessor_path = os.path.join(processed_dir, "ml_preprocessor.joblib")
    perf_path = os.path.join(models_dir, "performance_linear_regression.joblib")
    risk_path = os.path.join(models_dir, "learning_risk_logistic_regression.joblib")
    registry_path = os.path.join(models_dir, "model_registry.json")
    
    # Preferred skill model from registry
    skill_path = os.path.join(models_dir, "skill_random_forest.joblib")
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                reg = json.load(f)
                preferred_art = reg.get("skill_classifier", {}).get("artifact_path")
                if preferred_art and os.path.exists(os.path.join(project_root, preferred_art)):
                    skill_path = os.path.join(project_root, preferred_art)
        except Exception:
            pass
            
    if not os.path.exists(skill_path):
        skill_path = os.path.join(models_dir, "skill_decision_tree.joblib")
        
    assert os.path.exists(preprocessor_path), f"Preprocessor missing at: {preprocessor_path}"
    assert os.path.exists(perf_path), f"Performance model missing at: {perf_path}"
    assert os.path.exists(risk_path), f"Risk model missing at: {risk_path}"
    assert os.path.exists(skill_path), f"Skill model missing at: {skill_path}"
    
    return {
        "preprocessor": joblib.load(preprocessor_path),
        "performance_model": joblib.load(perf_path),
        "risk_model": joblib.load(risk_path),
        "skill_model": joblib.load(skill_path)
    }


def prepare_learner_features(learner_data: dict | pd.Series | pd.DataFrame) -> pd.DataFrame:
    """
    Validates learner input, enforces zero target leakage, and extracts feature DataFrame.
    
    Args:
        learner_data: Dictionary or Pandas Series/DataFrame of learner attributes.
        
    Returns:
        DataFrame containing exactly the 18 expected input feature columns.
    """
    if isinstance(learner_data, pd.DataFrame):
        data_dict = learner_data.iloc[0].to_dict()
    elif isinstance(learner_data, pd.Series):
        data_dict = learner_data.to_dict()
    elif isinstance(learner_data, dict):
        data_dict = learner_data.copy()
    else:
        raise TypeError("learner_data must be dict, Series, or DataFrame!")
        
    # Data Leakage Audit: Ensure no forbidden target column is present in feature extraction
    feature_dict = {}
    for col in FEATURE_COLUMNS:
        if col not in data_dict:
            raise KeyError(f"Missing required learner feature column: '{col}'")
        feature_dict[col] = data_dict[col]
        
    for forbidden in FORBIDDEN_TARGETS:
        assert forbidden not in feature_dict, f"TARGET LEAKAGE ERROR: {forbidden} present in model input!"
        
    return pd.DataFrame([feature_dict])


def interpret_performance(score: float) -> str:
    """
    Interprets predicted performance score into a qualitative band (Prototype Heuristic).
    
    Args:
        score: Continuous score percentage (0-100).
        
    Returns:
        Performance band ('Low', 'Moderate', 'High').
    """
    if score < 50.0:
        return "Low"
    elif score < 75.0:
        return "Moderate"
    else:
        return "High"


def interpret_risk(probability: float) -> str:
    """
    Interprets predicted risk probability P(At-Risk) into a risk status (Prototype Heuristic).
    
    Args:
        probability: Float risk probability P(At-Risk) in [0.0, 1.0].
        
    Returns:
        Risk status ('Low Risk', 'Moderate Risk', 'High Risk').
    """
    if probability < 0.30:
        return "Low Risk"
    elif probability < 0.60:
        return "Moderate Risk"
    else:
        return "High Risk"


def analyze_topic_strengths(learner_data: dict | pd.Series) -> tuple[dict, list, list, list]:
    """
    Categorizes 9 quantum curriculum topics into strengths, weaknesses, and developing concepts.
    
    Heuristic Rules:
    - Score >= 75.0: Strength
    - Score < 60.0: Weakness
    - Score 60.0 - 74.99: Developing
    
    Args:
        learner_data: Dictionary or Series containing topic scores.
        
    Returns:
        Tuple of (topic_scores_dict, topic_strengths_list, topic_weaknesses_list, topic_developing_list).
    """
    topic_scores = {}
    strengths = []
    weaknesses = []
    developing = []
    
    for topic in QUANTUM_TOPICS:
        col_name = f"{topic}_score"
        if col_name in learner_data:
            score = float(learner_data[col_name])
            topic_scores[topic] = round(score, 2)
            
            if score >= 75.0:
                strengths.append(topic)
            elif score < 60.0:
                weaknesses.append(topic)
            else:
                developing.append(topic)
                
    return topic_scores, strengths, weaknesses, developing


def analyze_learning_behavior(learner_data: dict | pd.Series) -> dict:
    """
    Extracts objective learning behavior metrics and generates neutral, non-judgmental descriptors.
    
    Args:
        learner_data: Dictionary or Series of learner activity metrics.
        
    Returns:
        Dictionary containing raw metrics and list of observable signal descriptions.
    """
    hours = float(learner_data.get("learning_hours_per_week", 0.0))
    modules = int(learner_data.get("modules_completed", 0))
    attempts = int(learner_data.get("attempts", 0))
    errors = int(learner_data.get("errors", 0))
    time_spent = int(learner_data.get("time_spent_minutes", 0))
    
    signals = []
    if errors >= 8:
        signals.append("Elevated error frequency")
    elif errors >= 4:
        signals.append("Moderate error frequency")
        
    if attempts >= 6:
        signals.append("High attempt frequency")
    elif attempts >= 3:
        signals.append("Moderate exercise attempts")
        
    if hours >= 12.0:
        signals.append("Higher weekly learning activity")
    elif hours < 5.0:
        signals.append("Lower weekly learning activity")
        
    if modules <= 3:
        signals.append("Limited module completion")
    elif modules >= 7:
        signals.append("Advanced module progression")
        
    return {
        "learning_hours_per_week": round(hours, 2),
        "modules_completed": modules,
        "attempts": attempts,
        "errors": errors,
        "time_spent_minutes": time_spent,
        "behavior_signals": signals
    }


def build_personalization_signals(
    skill_level: str,
    perf_band: str,
    risk_status: str,
    strengths: list,
    weaknesses: list,
    developing: list,
    behavior_dict: dict
) -> dict:
    """
    Constructs boolean and categorical flags for downstream Phase 4 recommendation engine.
    
    Args:
        skill_level: Predicted skill tier.
        perf_band: Predicted performance band.
        risk_status: Predicted risk status.
        strengths: List of topic strengths.
        weaknesses: List of topic weaknesses.
        developing: List of developing topics.
        behavior_dict: Learning behavior dictionary.
        
    Returns:
        Structured personalization signals dictionary.
    """
    return {
        "current_skill_level": skill_level,
        "performance_band": perf_band,
        "risk_status": risk_status,
        "weak_topics": weaknesses,
        "strong_topics": strengths,
        "developing_topics": developing,
        "high_error_signal": behavior_dict.get("errors", 0) >= 8,
        "high_attempt_signal": behavior_dict.get("attempts", 0) >= 6,
        "low_module_completion_signal": behavior_dict.get("modules_completed", 0) <= 3,
        "high_learning_activity_signal": behavior_dict.get("learning_hours_per_week", 0.0) >= 12.0
    }


def generate_summary(
    learner_id: str,
    skill_level: str,
    perf_score: float,
    perf_band: str,
    risk_prob: float,
    risk_status: str,
    strengths: list,
    weaknesses: list,
    developing: list,
    behavior_signals: list
) -> str:
    """
    Generates a deterministic, template-based intelligence summary without calling LLMs.
    
    Args:
        learner_id: Learner tracking identifier.
        skill_level: Skill tier.
        perf_score: Predicted continuous performance score.
        perf_band: Performance band string.
        risk_prob: Risk probability.
        risk_status: Risk status string.
        strengths: Topic strengths list.
        weaknesses: Topic weaknesses list.
        developing: Developing topics list.
        behavior_signals: Observable behavior signal strings.
        
    Returns:
        Formatted summary string.
    """
    str_summary = ", ".join(strengths) if strengths else "None identified"
    weak_summary = ", ".join(weaknesses) if weaknesses else "None identified"
    dev_summary = ", ".join(developing) if developing else "None identified"
    beh_summary = ", ".join(behavior_signals) if behavior_signals else "Standard activity profile"
    
    return (
        f"Learner {learner_id} is classified as an {skill_level} skill learner with {perf_band} "
        f"predicted performance ({perf_score:.2f}%) and {risk_status} (P={risk_prob:.4f}). "
        f"Demonstrates strong mastery in [{str_summary}], developing concepts in [{dev_summary}], "
        f"and identified weaknesses in [{weak_summary}]. Behavioral telemetry indicates: {beh_summary}."
    )


def build_learner_profile(learner_data: dict | pd.Series | pd.DataFrame, models_cache: dict = None, project_root: str = None) -> dict:
    """
    Full pipeline to transform single learner raw telemetry + Phase 2 ML models into a structured profile.
    
    Args:
        learner_data: Dict or Series of learner fields.
        models_cache: Optional cached dictionary from load_models().
        project_root: Optional custom path to project root.
        
    Returns:
        JSON-serializable learner profile dictionary.
    """
    if isinstance(learner_data, pd.DataFrame):
        data_dict = learner_data.iloc[0].to_dict()
    elif isinstance(learner_data, pd.Series):
        data_dict = learner_data.to_dict()
    elif isinstance(learner_data, dict):
        data_dict = learner_data.copy()
    else:
        raise TypeError("learner_data must be dict, Series, or DataFrame!")
        
    learner_id = str(data_dict.get("learner_id", "UNKNOWN_LEARNER"))
    
    # 1. Load models if not provided
    if models_cache is None:
        models_cache = load_models(project_root)
        
    preprocessor = models_cache["preprocessor"]
    perf_model = models_cache["performance_model"]
    risk_model = models_cache["risk_model"]
    skill_model = models_cache["skill_model"]
    
    # 2. Extract input features (verifies zero target leakage)
    X_raw_df = prepare_learner_features(data_dict)
    
    # 3. Transform via preprocessor
    X_trans = preprocessor.transform(X_raw_df)
    
    # 4. Predict via Phase 2 ML models
    pred_perf = float(perf_model.predict(X_trans)[0])
    pred_risk_prob = float(risk_model.predict_proba(X_trans)[0][1])  # P(At-Risk)
    pred_skill = str(skill_model.predict(X_trans)[0])
    
    # 5. Interpret predictions
    perf_band = interpret_performance(pred_perf)
    risk_status = interpret_risk(pred_risk_prob)
    
    # 6. Analyze topics and learning behavior
    topic_scores, strengths, weaknesses, developing = analyze_topic_strengths(data_dict)
    behavior_dict = analyze_learning_behavior(data_dict)
    
    # 7. Build personalization signals
    personalization_signals = build_personalization_signals(
        pred_skill, perf_band, risk_status, strengths, weaknesses, developing, behavior_dict
    )
    
    # 8. Generate summary
    summary = generate_summary(
        learner_id, pred_skill, pred_perf, perf_band, pred_risk_prob, risk_status,
        strengths, weaknesses, developing, behavior_dict["behavior_signals"]
    )
    
    # 9. Assemble final JSON-serializable profile payload
    return {
        "learner_id": learner_id,
        "skill_level": pred_skill,
        "predicted_performance": round(pred_perf, 2),
        "performance_band": perf_band,
        "risk_probability": round(pred_risk_prob, 4),
        "risk_status": risk_status,
        "topic_scores": topic_scores,
        "topic_strengths": strengths,
        "topic_weaknesses": weaknesses,
        "topic_developing": developing,
        "learning_behavior": behavior_dict,
        "personalization_signals": personalization_signals,
        "intelligence_summary": summary
    }

