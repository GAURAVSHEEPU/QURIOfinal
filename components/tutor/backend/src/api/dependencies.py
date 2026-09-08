"""
Artifact Loading and Dependency Management for Quantum Algorithm Learning Platform API.

Implements clean startup artifact caching to ensure zero repetitive disk reads, zero model
retraining, and fast (<1ms) profile & recommendation lookups.
"""

import os
import json
import joblib
from typing import Dict, Any, Optional


def normalize_learner_id(raw_id: str) -> str:
    """Normalizes variations like 'L0001', 'l0001', 'learner_0001' to 'LEARNER_0001'."""
    if not raw_id:
        return ""
    clean = str(raw_id).strip().upper()
    if clean.startswith("LEARNER_"):
        return clean
    if clean.startswith("L") and clean[1:].isdigit():
        num = int(clean[1:])
        return f"LEARNER_{num:04d}"
    if clean.isdigit():
        num = int(clean)
        return f"LEARNER_{num:04d}"
    return clean


class ArtifactStore:
    """In-memory cache store for ML models, learner profiles, recommendations, and curriculum."""

    def __init__(self, project_root: Optional[str] = None):
        if project_root is None:
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
            
        self.project_root = project_root
        self.curriculum: list = []
        self.profiles: Dict[str, dict] = {}
        self.recommendations: Dict[str, dict] = {}
        
        # ML Artifacts
        self.preprocessor = None
        self.performance_model = None
        self.risk_model = None
        self.skill_model = None
        self.models_loaded: bool = False
        
        # Initial load
        self.load_all_artifacts()

    def load_all_artifacts(self):
        """Loads all static JSON and joblib model artifacts into memory."""
        # 1. Load Curriculum
        curr_path = os.path.join(self.project_root, "data/curriculum/quantum_topics.json")
        if os.path.exists(curr_path):
            try:
                with open(curr_path, "r", encoding="utf-8") as f:
                    self.curriculum = json.load(f)
            except Exception as e:
                print(f"[WARNING] Failed to load curriculum: {e}")
                
        # 2. Load Learner Profiles
        profiles_path = os.path.join(self.project_root, "data/intelligence/learner_profiles.json")
        if os.path.exists(profiles_path):
            try:
                with open(profiles_path, "r", encoding="utf-8") as f:
                    profile_list = json.load(f)
                    for prof in profile_list:
                        lid = prof.get("learner_id")
                        if lid:
                            self.profiles[lid] = prof
            except Exception as e:
                print(f"[WARNING] Failed to load learner profiles: {e}")
                
        # 3. Load Recommendations
        recs_path = os.path.join(self.project_root, "data/recommendations/learner_recommendations.json")
        if os.path.exists(recs_path):
            try:
                with open(recs_path, "r", encoding="utf-8") as f:
                    recs_list = json.load(f)
                    for rec in recs_list:
                        lid = rec.get("learner_id")
                        if lid:
                            self.recommendations[lid] = rec
            except Exception as e:
                print(f"[WARNING] Failed to load recommendations: {e}")
                
        # 4. Load Phase 2 ML Models & Preprocessor
        try:
            prep_path = os.path.join(self.project_root, "data/processed/ml_preprocessor.joblib")
            perf_path = os.path.join(self.project_root, "data/models/performance_linear_regression.joblib")
            risk_path = os.path.join(self.project_root, "data/models/learning_risk_logistic_regression.joblib")
            skill_path = os.path.join(self.project_root, "data/models/skill_random_forest.joblib")
            
            if all(os.path.exists(p) for p in (prep_path, perf_path, risk_path, skill_path)):
                self.preprocessor = joblib.load(prep_path)
                self.performance_model = joblib.load(perf_path)
                self.risk_model = joblib.load(risk_path)
                self.skill_model = joblib.load(skill_path)
                self.models_loaded = True
        except Exception as e:
            print(f"[WARNING] Failed to load ML models: {e}")

    def get_profile(self, learner_id: str) -> Optional[dict]:
        """Retrieves learner profile by ID with flexible format normalization."""
        norm_id = normalize_learner_id(learner_id)
        return self.profiles.get(norm_id) or self.profiles.get(learner_id)

    def get_recommendation(self, learner_id: str) -> Optional[dict]:
        """Retrieves learner recommendation by ID with flexible format normalization."""
        norm_id = normalize_learner_id(learner_id)
        return self.recommendations.get(norm_id) or self.recommendations.get(learner_id)

    def predict_telemetry(self, feature_dict: dict) -> dict:
        """Executes Phase 2 ML model inference on raw input telemetry dictionary."""
        import numpy as np
        import pandas as pd

        if not self.models_loaded:
            raise RuntimeError("ML models are not loaded in ArtifactStore.")
            
        # Convert dictionary to single-row DataFrame
        df_raw = pd.DataFrame([feature_dict])
        
        # Transform features via preprocessor
        X_trans = self.preprocessor.transform(df_raw)
        
        # Clean feature names by stripping 'num__' and 'cat__' prefixes to match fitted model feature names
        try:
            feat_names = [c.replace("num__", "").replace("cat__", "") for c in self.preprocessor.get_feature_names_out()]
            X_trans_df = pd.DataFrame(X_trans, columns=feat_names)
        except Exception:
            X_trans_df = X_trans
        
        # 1. Performance Predictor (Linear Regression)
        pred_perf = float(self.performance_model.predict(X_trans_df)[0])
        pred_perf = round(float(np.clip(pred_perf, 0.0, 100.0)), 2)
        
        # 2. Risk Predictor (Logistic Regression)
        risk_probs = self.risk_model.predict_proba(X_trans_df)[0]
        risk_prob = float(risk_probs[1]) if len(risk_probs) > 1 else float(risk_probs[0])
        risk_status = "At-Risk" if risk_prob >= 0.50 else "On-Track"
        
        # 3. Skill Predictor (Random Forest)
        skill_level = str(self.skill_model.predict(X_trans_df)[0])


        
        return {
            "predicted_performance": pred_perf,
            "predicted_risk_probability": round(risk_prob, 4),
            "predicted_risk_status": risk_status,
            "predicted_skill_level": skill_level
        }


# Global store instance for app dependency injection
_global_store: Optional[ArtifactStore] = None


def get_artifact_store() -> ArtifactStore:
    """Dependency provider returning global ArtifactStore instance."""
    global _global_store
    if _global_store is None:
        _global_store = ArtifactStore()
    return _global_store
