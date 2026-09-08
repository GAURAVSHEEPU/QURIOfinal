"""
Lightweight Project Integrity Validation Script.

Verifies the existence, parseability, and loadability of all required data artifacts,
ML model joblib binaries, intelligence profiles, recommendations, and curriculum files.
"""

import os
import sys
import json
import joblib
import pandas as pd


def validate_project():
    print("=========================================")
    print("RUNNING PROJECT INTEGRITY VALIDATION")
    print("=========================================")
    
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
    
    # 1. Required Directories Check
    required_dirs = [
        "data/raw",
        "data/processed",
        "data/models",
        "data/intelligence",
        "data/recommendations",
        "data/curriculum",
        "src/api",
        "src/data",
        "src/intelligence",
        "src/models",
        "src/recommendation",
        "src/tutor",
        "tests/api",
        "docs"
    ]
    
    for d in required_dirs:
        dir_path = os.path.join(project_root, d)
        assert os.path.exists(dir_path) and os.path.isdir(dir_path), f"Missing required directory: {d}"
    print("[OK] All required project directories exist.")
    
    # 2. Required Data Artifacts Check
    required_files = [
        ("data/raw/learner_data.csv", "Raw Learner Dataset"),
        ("data/processed/X_train.csv", "ML Train Feature Matrix"),
        ("data/processed/X_test.csv", "ML Test Feature Matrix"),
        ("data/processed/ml_preprocessor.joblib", "Fitted ColumnTransformer Preprocessor"),
        ("data/models/model_registry.json", "Model Registry JSON"),
        ("data/models/performance_linear_regression.joblib", "Performance Predictor Model"),
        ("data/models/learning_risk_logistic_regression.joblib", "Learning Risk Predictor Model"),
        ("data/models/skill_random_forest.joblib", "Skill Level Classifier Model"),
        ("data/intelligence/learner_profiles.json", "Phase 3 Learner Profiles JSON"),
        ("data/recommendations/learner_recommendations.json", "Phase 4 Recommendations JSON"),
        ("data/curriculum/quantum_topics.json", "Quantum Curriculum JSON")
    ]
    
    for rel_path, desc in required_files:
        full_path = os.path.join(project_root, rel_path)
        assert os.path.exists(full_path), f"Missing required artifact ({desc}): {rel_path}"
        assert os.path.getsize(full_path) > 0, f"Artifact is empty ({desc}): {rel_path}"
    print(f"[OK] All {len(required_files)} required data & model artifacts exist and are non-empty.")
    
    # 3. JSON Artifacts Parseability Check
    json_files = [
        "data/models/model_registry.json",
        "data/intelligence/learner_profiles.json",
        "data/recommendations/learner_recommendations.json",
        "data/curriculum/quantum_topics.json"
    ]
    
    for jf in json_files:
        full_path = os.path.join(project_root, jf)
        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data is not None, f"JSON file parsed as None: {jf}"
    print("[OK] All JSON artifacts parse cleanly.")
    
    # 4. Joblib ML Binaries Loadability Check
    joblib_files = [
        "data/processed/ml_preprocessor.joblib",
        "data/models/performance_linear_regression.joblib",
        "data/models/learning_risk_logistic_regression.joblib",
        "data/models/skill_random_forest.joblib"
    ]
    
    for jf in joblib_files:
        full_path = os.path.join(project_root, jf)
        obj = joblib.load(full_path)
        assert obj is not None, f"Joblib file failed to load: {jf}"
    print("[OK] All scikit-learn model binaries load successfully.")
    
    # 5. Dataset Record Count Check
    raw_df = pd.read_csv(os.path.join(project_root, "data/raw/learner_data.csv"))
    assert len(raw_df) == 1000, f"Expected 1,000 raw learner records, got {len(raw_df)}"
    print("[OK] Raw dataset contains exactly 1,000 synthetic learner records.")
    
    print("\n=========================================")
    print("PROJECT INTEGRITY VALIDATION PASSED!")
    print("=========================================")


if __name__ == "__main__":
    validate_project()
