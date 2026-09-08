# System Flow

## Current Implemented Flow

The following flows represent the exact, currently working system execution paths across all 7 completed project phases:

### 1. API Diagnostic Flow (Phase 0)
```
[ HTTP Request: GET /health ]
          │
          ▼
   [ FastAPI Router ] (src/api/main.py)
          │
          ▼
 [ CORS Middleware Check ]
          │
          ▼
 [ health_check() Handler ]
          │
          ▼
 [ JSON Response: {"status": "ok", "service": "quantum-learning-platform"} ]
```

### 2. Learner Telemetry Data Generation Pipeline (Phase 1A - IMPLEMENTED)
```
[ Curriculum Topics JSON ] (data/curriculum/quantum_topics.json)
          │
          ▼
[ generate_data.py ] (src/data/generate_data.py)
          │
          ├──► load_curriculum() ──► Parses 9 quantum topics & difficulty tiers
          ├──► generate_learner_profiles() ──► 1,000 records with latent ability N(0,1)
          ├──► generate_topic_scores() ──► 9 topic score columns with difficulty shifts
          ├──► calculate_derived_labels() ──► Computes target variables (overall_score, risk, skill)
          │
          ▼
 [ Save to CSV ] ──► data/raw/learner_data.csv (1,000 rows x 22 columns)
```

### 3. General Data Preprocessing & Scaling Pipeline (Phase 1B - IMPLEMENTED)
```
[ Raw CSV ] (data/raw/learner_data.csv)
          │
          ▼
[ preprocess_data.py ] (src/data/preprocess_data.py)
          │
          ├──► separate_features_and_targets() ──► Strips learner_id & targets
          ├──► ColumnTransformer ──► Imputes & scales 17 num features + 1 cat feature
          │
          ▼
 [ Serialized Artifacts ] ──► data/processed/preprocessor.joblib
                         └──► data/processed/X_processed.csv
```

### 4. Exploratory Data Analysis Pipeline (Phase 1C - IMPLEMENTED)
```
[ Raw CSV (Read-Only Audit) ] (data/raw/learner_data.csv)
          │
          ▼
[ analyze_data.py ] (src/data/analyze_data.py)
          │
          ├──► analyze_data_quality() ──► Verifies 0 missing values, 0 duplicate IDs
          ├──► generate_descriptive_statistics() ──► Exports summary_statistics.csv
          ├──► analyze_topic_performance() ──► Exports topic_performance_summary.csv
          ├──► compute_correlation_matrix() ──► Exports correlation_matrix.csv
          ├──► generate_plots() ──► Generates 4 Matplotlib PNG charts
          │
          ▼
 [ Analysis Outputs ] ──► data/analysis/*.csv & *.png
                     └──► docs/EDA_REPORT.md (Certifies 100% ML Readiness)
```

### 5. ML-Ready Dataset Preparation Pipeline (Phase 1D - IMPLEMENTED)
```
[ Raw Dataset ] (data/raw/learner_data.csv)
          │
          ▼
[ prepare_ml_data.py ] (src/data/prepare_ml_data.py)
          │
          ├──► separate_features_and_targets() ──► Strips learner_id, overall_score, risk, skill from X
          ├──► train_test_split() ──► 80/20 Stratified Partition (800 Train / 200 Test, random_state=42)
          ├──► build_preprocessor() & fit_preprocessor() ──► Fits ColumnTransformer EXCLUSIVELY on X_train
          ├──► transform_datasets() ──► Transforms X_train (800x20) and X_test (200x20)
          │
          ▼
 [ Saved ML Artifacts in data/processed/ ]
          ├──► X_train.csv & X_test.csv
          ├──► y_performance_train.csv & y_performance_test.csv
          ├──► y_risk_train.csv & y_risk_test.csv
          ├──► y_skill_train.csv & y_skill_test.csv
          ├──► train_learner_ids.csv & test_learner_ids.csv
          └──► ml_preprocessor.joblib (Training-Fitted Preprocessor)
```

### 6. Classical ML Intelligence Suite Pipeline (Phase 2 - IMPLEMENTED)
```
[ ML-Ready Training & Test Data ] (X_train.csv, X_test.csv, targets)
          │
          ▼
[ Trained Model Binaries in data/models/ ]
          ├──► performance_linear_regression.joblib (MAE=0.0243, R^2=1.0)
          ├──► learning_risk_logistic_regression.joblib (Accuracy=99.5%, Recall=98.41%)
          ├──► skill_random_forest.joblib (Preferred Model, Accuracy=94.5%, Weighted F1=0.9442)
          └──► skill_decision_tree.joblib (Fallback Model, Accuracy=93.5%)
          │
          ▼
[ Consolidation & Validation Engine ] (src/models/validate_models.py)
          ├──► model_registry.json & model_metrics_summary.csv
          └──► docs/ML_MODEL_REPORT.md (All Quality Gates Passed)
```

### 7. Learner Intelligence & Profile Generation Pipeline (Phase 3 - IMPLEMENTED)
```
[ Raw Learner Telemetry Input ] (Single record OR Batch CSV)
          │
          ▼
[ learner_profile.py ] (src/intelligence/learner_profile.py)
          │
          ├──► prepare_learner_features() ──► Strips target columns (Zero Data Leakage)
          ├──► ml_preprocessor.joblib ──► Scales 18 input features to 20-dim matrix X
          ├──► ML Models Inference ──► Predicts performance (float), risk (prob), skill (class)
          ├──► interpret_performance() & interpret_risk() ──► Assigns qualitative bands
          ├──► analyze_topic_strengths() ──► Categorizes 9 quantum topics (strengths/weaknesses/developing)
          ├──► analyze_learning_behavior() ──► Extracts neutral observable behavioral signals
          ├──► build_personalization_signals() ──► Constructs boolean/list flags contract for Phase 4
          └──► generate_summary() ──► Synthesizes deterministic template summary
          │
          ▼
 [ Saved Profile Artifacts ] ──► data/intelligence/learner_profiles.json (1,000 JSON profiles)
                         └──► data/intelligence/profile_summary.csv
```

### 8. Personalized Recommendation Engine Pipeline (Phase 4 - IMPLEMENTED)
```
[ Phase 3 Learner Profile JSON ] (data/intelligence/learner_profiles.json)
          │
          ▼
[ recommendation_engine.py ] (src/recommendation/recommendation_engine.py)
          │
          ├──► generate_candidates() ──► Generates raw candidates across 6 logic channels
          ├──► score_candidate() ──► Computes priority score (0-100) via transparent formula
          ├──► validate_candidate() ──► Deterministic Critic filter (Curriculum, Dedup, Mastery, Risk)
          ├──► rank_recommendations() ──► Sorts candidates descending by priority score
          └──► build_recommendation_result() ──► Extracts Top 5 recommendations + next_best_action
          │
          ▼
 [ Saved Recommendation Artifacts ] ──► data/recommendations/learner_recommendations.json (1,000 outputs)
                                └──► data/recommendations/recommendation_summary.csv
```

### 9. AI Quantum Tutor & Grounded Bounded Loop Engineering Pipeline (Phase 5 & AI Tutor Revamp - IMPLEMENTED)
```
[ Query + Mode ] + [ Phase 3 Profile ] + [ Phase 4 Recs ] + [ Circuit / Quiz Extra Context ]
                                  │
                                  ▼
[ Grounded Context Builder ] (src/tutor/quantum_tutor.py)
                                  │
                                  ├──► CircuitValidator (src/tutor/circuit_validator.py) ──► Deterministic gate & structural validation
                                  ├──► QuizAnalyzer (src/tutor/quiz_analyzer.py) ──► Deterministic score & topic performance calculation
                                  ├──► build_context() ──► Constructs strictly grounded context payload
                                  ├──► LLMClient (src/tutor/llm_client.py) ──► Configurable provider (Groq Llama-3.3 / Gemini / OpenAI / Mock)
                                  ├──► Loop Engineering Workflow (MAX_ITERATIONS = 3, QUALITY_THRESHOLD = 85.0):
                                  │     1. Execution: Generate candidate JSON response
                                  │     2. Critic: Evaluate candidate via LLM Critic or fallback_critic()
                                  │     3. Best Response Tracking: Retain highest scoring candidate
                                  │     4. Exit Check: Deliver if score >= 85.0 OR iteration == 3; else refine prompt
                                  │
                                  ▼
 [ Structured Grounded Tutor Response JSON Payload ]
  {"answer": "...", "concept": "...", "difficulty": "...", "mode": "...", "quality_score": 90.0, "iterations": 1}
```

### 10. End-to-End FastAPI REST API & Demo Flow (Phase 6 & 7 - IMPLEMENTED)
```
[ Client / Web App / Demo Script ] (scripts/demo.py or HTTP Client)
                │
                ▼
       [ FastAPI REST Backend ] (src/api/main.py)
                │
                ├──► GET  /health ──► Status & Model Readiness
                ├──► GET  /api/learners/{id}/profile ──► Returns Phase 3 Learner Profile
                ├──► GET  /api/learners/{id}/recommendations ──► Returns Phase 4 Recommendations & Next Best Action
                ├──► POST /api/learners/predict ──► Executes Phase 2 ML Telemetry Inference
                └──► POST /api/tutor ──► Executes Phase 5 AI Quantum Tutor & Loop Engineering
                │
                ▼
 [ Structured Response Payload ] (Delivered to User Interface / Client)
```
