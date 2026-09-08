# Features

## Feature Template

### Feature: [Name]
- **Status:** PLANNED / IN_PROGRESS / COMPLETED
- **Phase:** Phase X
- **Files:** `path/to/file`
- **Purpose:** [What feature accomplishes]
- **Implementation:** [Technical approach]
- **Testing:** [How it is verified]
- **Known Limitations:** [Any constraints]

---

## Documented Features

### Feature: Synthetic Learner Data Pipeline
- **Status:** IMPLEMENTED
- **Phase:** Phase 1A
- **Files:** `src/data/generate_data.py`, `data/raw/learner_data.csv`
- **Purpose:** Provide realistic prototype learner telemetry data for downstream ML model training and evaluation.
- **Implementation:** Latent ability correlation generation model (`generate_learner_profiles`, `generate_topic_scores`, `calculate_derived_labels`) using NumPy & Pandas with fixed seed (42). Produces 1,000 synthetic records spanning 22 features (hours, quiz/coding/challenge scores, attempts, errors, time spent, modules completed, 9 topic scores, and derived targets `overall_score`, `learning_risk`, `skill_level`).
- **Testing:** Verified via `scratch/verify_phase1a.py` checking row counts (1,000), uniqueness of `learner_id`, value bounds ([0, 100] for scores, [1, 10] for attempts, [0, 20] for errors, [5, 180] for time), and zero PII.
- **Known Limitations:** *This dataset is synthetic and intended only for development/prototyping. It does not represent real student behavior.*

---

### Feature: Data Preprocessing & Scaling Pipeline
- **Status:** IMPLEMENTED
- **Phase:** Phase 1B
- **Files:** `src/data/preprocess_data.py`, `data/processed/preprocessor.joblib`, `data/processed/X_processed.csv`
- **Purpose:** Transform raw telemetry records into normalized, encoded feature matrices for downstream ML model training and real-time API inference while preventing target leakage.
- **Implementation:** Scikit-Learn `ColumnTransformer` combining a numerical pipeline (`SimpleImputer(strategy='median')` + `StandardScaler`) across 17 numerical features and a categorical pipeline (`SimpleImputer(strategy='most_frequent')` + `OneHotEncoder(handle_unknown='ignore')`) across `age_group`. Identifier (`learner_id`) and target variables (`overall_score`, `learning_risk`, `skill_level`) are explicitly excluded.
- **Testing:** Verified via `scratch/verify_phase1b.py` confirming exclusion of forbidden columns, matrix shape (1000, 20), mean/std scaling properties, joblib serialization/deserialization, and identical inference batch transformation.
- **Known Limitations:** Operates strictly on feature inputs $X$; target selection and train/test splitting handled separately in Phase 1C/1D.

---

### Feature: Exploratory Data Analysis (EDA) Pipeline & Report
- **Status:** IMPLEMENTED
- **Phase:** Phase 1C
- **Files:** `src/data/analyze_data.py`, `docs/EDA_REPORT.md`, `data/analysis/*`
- **Purpose:** Provide rigorous statistical analysis, topic difficulty profiling, correlation matrix evaluation, and Matplotlib visualization to certify dataset quality and ML readiness.
- **Implementation:** Modular analysis script `src/data/analyze_data.py` reading raw dataset without modification and generating 3 summary CSVs (`summary_statistics.csv`, `topic_performance_summary.csv`, `correlation_matrix.csv`) and 4 Matplotlib charts (`performance_distributions.png`, `topic_difficulty.png`, `correlation_heatmap.png`, `skill_level_profiles.png`). Authored `docs/EDA_REPORT.md`.
- **Testing:** Verified via `scratch/verify_phase1c.py` checking 0 missing values, 0 duplicate IDs, score bounds, output file existence, and raw data MD5 checksum immutability.
- **Known Limitations:** Findings apply strictly to the synthetic prototype dataset.

---

### Feature: ML-Ready Dataset Preparation Pipeline
- **Status:** IMPLEMENTED
- **Phase:** Phase 1D
- **Files:** `src/data/prepare_ml_data.py`, `data/processed/*`
- **Purpose:** Produce leak-free, reproducible 80/20 train/test splits (800 train / 200 test, `random_state=42`), isolate targets (`y_performance`, `y_risk`, `y_skill`), and persist training-fitted preprocessor `ml_preprocessor.joblib`.
- **Implementation:** Modular pipeline `src/data/prepare_ml_data.py` performing stratified train/test splitting prior to fitting the preprocessing pipeline. Preprocessor fits exclusively on $X_{\text{train}}$ features. Outputs 11 artifacts to `data/processed/` (`X_train.csv`, `X_test.csv`, `y_performance_train.csv`, `y_performance_test.csv`, `y_risk_train.csv`, `y_risk_test.csv`, `y_skill_train.csv`, `y_skill_test.csv`, `train_learner_ids.csv`, `test_learner_ids.csv`, `ml_preprocessor.joblib`).
- **Testing:** Verified via `scratch/verify_phase1d.py` passing 24 tests confirming zero ID overlap, target isolation, training-only preprocessor fitting, exact shape matching (800x20 and 200x20), 0 NaNs, and deterministic repeatability.
- **Known Limitations:** Target labels and split ratio fixed for Phase 2 model training.

---

### Feature: Continuous Performance Prediction Model
- **Status:** IMPLEMENTED
- **Phase:** Phase 2A
- **Files:** `src/models/performance_model.py`, `data/models/performance_linear_regression.joblib`, `data/models/performance_metrics.json`, `data/models/performance_coefficients.csv`, `data/models/plots/*`
- **Purpose:** Predict a learner's continuous expected overall performance score (`overall_score`) from preprocessed telemetry features.
- **Implementation:** Scikit-Learn `LinearRegression` model trained on $X_{\text{train}}$ (800 rows $\times$ 20 features) and evaluated on $X_{\text{test}}$ (200 rows). Compared against a `DummyRegressor(strategy='mean')` baseline. Exports model binary, metrics JSON, regression coefficient CSV, and diagnostic plots (actual vs. predicted scatter and residual error plot).
- **Testing:** Verified via `scratch/verify_phase2a.py` passing 26 tests confirming finite numeric predictions, outperformance over dummy baseline ($R^2 = 1.0$, $\text{MAE} = 0.0243$ vs baseline $\text{MAE} = 13.4785$), joblib model re-loading, and zero raw dataset modification.
- **Known Limitations:** Linear Regression operates as an explainable baseline; predictions are unbounded unless clipped during post-processing API serving.

---

### Feature: Binary Learning Risk Prediction Model
- **Status:** IMPLEMENTED
- **Phase:** Phase 2B
- **Files:** `src/models/risk_model.py`, `data/models/learning_risk_logistic_regression.joblib`, `data/models/learning_risk_metrics.json`, `data/models/learning_risk_coefficients.csv`, `data/models/plots/learning_risk_confusion_matrix.png`
- **Purpose:** Classify a learner's risk state (`0 = On-Track`, `1 = At-Risk`) and generate class probability predictions ($P(\text{On-Track}), P(\text{At-Risk})$).
- **Implementation:** Scikit-Learn `LogisticRegression(max_iter=1000, random_state=42)` trained on $X_{\text{train}}$ (800 rows $\times$ 20 features) and evaluated on $X_{\text{test}}$ (200 rows). Compared against a `DummyClassifier(strategy='most_frequent')` baseline. Exports model binary, metrics JSON, log-odds coefficient CSV, and a Matplotlib confusion matrix plot.
- **Testing:** Verified via `scratch/verify_phase2b.py` passing 30 tests confirming finite predictions, $100\%$ valid binary classes, probability bounds $[0, 1]$, row probability sum $= 1.0$, high At-Risk recall ($98.41\%$), joblib model re-loading, and zero raw dataset modification.
- **Known Limitations:** Evaluated on synthetic rules; decision threshold set at default $0.5$ (threshold tuning reserved for future risk-averse tuning).

---

### Feature: Skill Level Multi-Class Classification Models
- **Status:** IMPLEMENTED
- **Phase:** Phase 2C
- **Files:** `src/models/skill_model.py`, `data/models/skill_decision_tree.joblib`, `data/models/skill_random_forest.joblib`, `data/models/skill_model_comparison.csv`, `data/models/skill_metrics.json`, `data/models/skill_*_feature_importance.csv`, `data/models/plots/*`
- **Purpose:** Classify a learner's skill level (`Beginner`, `Intermediate`, `Advanced`) using decision tree and ensemble random forest classifiers.
- **Implementation:** Trained `DecisionTreeClassifier(max_depth=5)` and `RandomForestClassifier(n_estimators=100, max_depth=7)` on $X_{\text{train}}$ (800 rows $\times$ 20 features) and evaluated on $X_{\text{test}}$ (200 rows). Evaluated against a `DummyClassifier(strategy='most_frequent')` baseline. Exports model binaries, model comparison CSV, feature importances CSVs, 3x3 confusion matrix plots, decision tree diagram, and random forest feature importance bar chart.
- **Testing:** Verified via `scratch/verify_phase2c.py` passing 33 tests confirming multi-class prediction validity across all 3 classes, joblib model re-loading, outperformance over dummy baseline (RF Acc: $94.5\%$, DT Acc: $93.5\%$ vs Baseline: $43.0\%$), and zero raw dataset modification.
- **Known Limitations:** Skill labels derived from synthetic rules; Random Forest selected as primary production model due to superior F1 performance ($94.42\%$).

---

### Feature: ML Model Consolidation, Registry & Validation Engine
- **Status:** IMPLEMENTED
- **Phase:** Phase 2D
- **Files:** `src/models/validate_models.py`, `data/models/model_registry.json`, `data/models/model_metrics_summary.csv`, `data/models/plots/model_comparison.png`, `docs/ML_MODEL_REPORT.md`
- **Purpose:** Provide a centralized model registry, metric consolidation, quality gate verification, and end-to-end inference validation across all Phase 2 ML models.
- **Implementation:** Modular engine `src/models/validate_models.py` loading preprocessor and all 4 trained model joblib binaries, asserting output dimensions and finiteness, executing end-to-end raw telemetry inference, generating `model_registry.json`, `model_metrics_summary.csv`, classification comparison plot, and authoring `docs/ML_MODEL_REPORT.md`.
- **Testing:** Verified via `scratch/verify_phase2d.py` passing 26 tests confirming quality gate passes across all models, end-to-end inference execution, model registry metadata completeness, zero target leakage, and zero raw dataset modification.
- **Known Limitations:** Models certified as `prototype_validated` on synthetic data; real-world deployment requires retraining on human interaction logs.

---

### Feature: Learner Intelligence Profile Engine & Personalization Layer
- **Status:** IMPLEMENTED
- **Phase:** Phase 3
- **Files:** `src/intelligence/learner_profile.py`, `src/intelligence/generate_profiles.py`, `data/intelligence/learner_profiles.json`, `data/intelligence/profile_summary.csv`, `docs/LEARNER_INTELLIGENCE.md`
- **Purpose:** Transform raw learner telemetry and Phase 2 ML model predictions into a structured, JSON-serializable learner profile containing performance bands, risk status, topic strengths/weaknesses, behavioral signals, and personalization flags.
- **Implementation:** Modular profile engine `src/intelligence/learner_profile.py` consuming `ml_preprocessor.joblib` and active Phase 2 ML models. Interprets continuous performance predictions, risk probabilities, and multi-class skill tiers into qualitative bands and personalization signals. Batch generator `src/intelligence/generate_profiles.py` outputs 1,000 JSON profiles to `learner_profiles.json`.
- **Testing:** Verified via `scratch/verify_phase3.py` passing 27 tests confirming zero target leakage, 100% deterministic profile output, JSON serializability, 9 quantum topic coverage, batch generation of 1,000 profiles, and zero dataset or model binary modification.
- **Known Limitations:** Interpretation thresholds are prototype heuristics; behavioral descriptors summarize observable numerical telemetry rather than psychological traits.

---

### Feature: Personalized Recommendation Engine
- **Status:** IMPLEMENTED
- **Phase:** Phase 4
- **Files:** `src/recommendation/recommendation_engine.py`, `src/recommendation/generate_recommendations.py`, `data/recommendations/learner_recommendations.json`, `data/recommendations/recommendation_summary.csv`, `docs/RECOMMENDATION_ENGINE.md`
- **Purpose:** Consume Phase 3 Learner Profiles and curriculum structure (`quantum_topics.json`) to generate ranked, explainable, personalized learning recommendations and identify the `next_best_action`.
- **Implementation:** Modular engine `src/recommendation/recommendation_engine.py` featuring 2-stage candidate generation across 6 logic channels (topic review, practice, prerequisite reinforcement, slow-down, progression, challenge), transparent priority scoring formula (0.0 to 100.0), deterministic critic validation loop, and top-5 ranking. Batch generator `src/recommendation/generate_recommendations.py` outputs 1,000 JSON results to `learner_recommendations.json`.
- **Testing:** Verified via `scratch/verify_phase4.py` passing 30 tests confirming 100% determinism, prerequisite awareness, deduplication, valid schema bounds, next_best_action matching, batch generation of 1,000 outputs, and zero modification of raw data, ML models, or profiles.
- **Known Limitations:** Scoring formulas are prototype ranking heuristics; recommendations provide decision support without mandatory restrictions.

---

### Feature: AI Quantum Tutor & Loop Engineering Engine
- **Status:** IMPLEMENTED
- **Phase:** Phase 5
- **Files:** `src/tutor/quantum_tutor.py`, `src/tutor/llm_client.py`, `src/tutor/mock_llm.py`, `docs/AI_TUTOR.md`
- **Purpose:** Provide a multi-mode AI Quantum Tutor (`explain`, `hint`, `debug`, `code_explain`, `circuit_explain`, `practice`) powered by the Loop Engineering Architecture (`MAX_ITERATIONS = 3`, `QUALITY_THRESHOLD = 85.0`) to deliver personalized explanations adapted to student skill level, weak topics, and Phase 4 recommendations.
- **Implementation:** Modular engine `src/tutor/quantum_tutor.py` executing candidate generation, AI Critic evaluation, deterministic fallback validation, best-response tracking across iterations, and offline Mock LLM client (`src/tutor/mock_llm.py`). Provider abstraction `src/tutor/llm_client.py` keeps providers configurable via `LLM_PROVIDER`, `LLM_MODEL`, and `LLM_API_KEY`.
- **Testing:** Verified via `scratch/verify_phase5.py` passing 33 tests confirming mode execution, JSON schema validity, early exit on high quality ($\ge 85$), multi-pass refinement on low quality, fallback critic execution, AST zero `eval`/`exec` audit, and zero dataset/model/profile/recommendation modification.
- **Known Limitations:** Quality scores are heuristic AI evaluations; LLM responses are probabilistic and require curriculum grounding.

---

### Feature: Full System Integration, Testing & Hackathon Demo
- **Status:** IMPLEMENTED
- **Phase:** Phase 7
- **Files:** `scripts/demo.py`, `scripts/validate_project.py`, `tests/test_end_to_end.py`, `tests/test_personalization.py`, `docs/DEMO_GUIDE.md`
- **Purpose:** Validate end-to-end integration across all 6 prior phases, execute full 33-test regression suite, verify repository safety/immutability, and provide a 1-3 minute interactive terminal demo script for hackathon presentation.
- **Implementation:** Presentation-friendly terminal demo script `scripts/demo.py` showcasing Learner Intelligence Profile, Personalized Learning Plan, and AI Quantum Tutor Loop. Integrity validator `scripts/validate_project.py` auditing 11 required data/model artifacts. Integration & personalization test suites (`test_end_to_end.py`, `test_personalization.py`).
- **Testing:** Executed full 33-test pytest suite (`python -m pytest -q`) with 100% pass rate. Verified clean syntax compilation across `src/`, `tests/`, `scripts/` (`python -m compileall`). Confirmed zero secret leakage and zero raw data or model modification.
- **Known Limitations:** Demonstration data uses synthetic learner telemetry ($N=1000$); live LLM tutoring requires configuring `LLM_API_KEY` in `.env`.





---

### Feature: Learning Risk Prediction
- **Status:** PLANNED
- **Phase:** Phase 2 & Phase 3
- **Files:** `src/ml/train_risk_model.py`, `src/intelligence/intelligence_service.py`
- **Purpose:** Predict binary drop-out / failure risk state (At-Risk vs On-Track).
- **Implementation:** Scikit-learn Logistic Regression model outputting risk probabilities.
- **Testing:** Precision, Recall, and ROC-AUC evaluation.
- **Known Limitations:** Classification threshold default set to 0.5.

---

### Feature: Skill Level Classification
- **Status:** PLANNED
- **Phase:** Phase 2 & Phase 3
- **Files:** `src/ml/train_skill_model.py`, `src/intelligence/intelligence_service.py`
- **Purpose:** Categorize student mastery level into discrete tiers (Beginner, Intermediate, Advanced).
- **Implementation:** Scikit-learn Decision Tree / Random Forest multi-class classifier.
- **Testing:** Multi-class confusion matrix and classification accuracy.
- **Known Limitations:** Tiers mapped to fixed 9-topic curriculum.

---

### Feature: Weak Concept Detection
- **Status:** PLANNED
- **Phase:** Phase 3
- **Files:** `src/intelligence/weak_concept_detector.py`
- **Purpose:** Identify root conceptual bottlenecks by evaluating quiz errors against prerequisite dependencies in `quantum_topics.json`.
- **Implementation:** Prerequisite graph traversal algorithm.
- **Testing:** Unit test cases checking graph parent concept extraction on failed topics.
- **Known Limitations:** Relies on accurate prerequisite mapping in curriculum JSON.

---

### Feature: Personalized Recommendation Engine
- **Status:** PLANNED
- **Phase:** Phase 4
- **Files:** `src/intelligence/recommendation_engine.py`
- **Purpose:** Generate targeted learning actions (re-read concept, attempt circuit exercise, review prerequisite) with explicit explanatory rationale.
- **Implementation:** Rule and heuristic recommendation generator.
- **Testing:** Automated tests evaluating output recommendations across synthetic student profiles.
- **Known Limitations:** Recommendations constrained to 9 curriculum topics.

---

### Feature: AI Quantum Tutor
- **Status:** PLANNED
- **Phase:** Phase 5
- **Files:** `src/tutor/tutor_service.py`, `src/tutor/prompts.py`
- **Purpose:** Provide natural language explanations, hints, code walk-throughs, and concept simplifications tailored to student skill level.
- **Implementation:** Prompt-engineered LLM integration.
- **Testing:** Structured output parsing and Critic validation.
- **Known Limitations:** Requires cloud LLM API access or local fallback.

---

### Feature: AI Critic
- **Status:** PLANNED
- **Phase:** Phase 5
- **Files:** `src/tutor/critic.py`
- **Purpose:** Evaluate generated AI Tutor responses for correctness, clarity, completeness, and difficulty match, returning a numerical score (0-100) and feedback.
- **Implementation:** Prompt-engineered LLM evaluation template.
- **Testing:** Verification of score outputs against sample candidate responses.
- **Known Limitations:** Critic latency adds to total response time.

---

### Feature: Bounded Loop Engineering Engine
- **Status:** PLANNED
- **Phase:** Phase 5
- **Files:** `src/tutor/loop_engine.py`
- **Purpose:** Orchestrate iterative prompt refinement between AI Tutor and AI Critic until `QUALITY_THRESHOLD = 85` is met or `MAX_ITERATIONS = 3` is reached.
- **Implementation:** Python loop controller with iteration safety counter.
- **Testing:** Unit tests verifying loop termination at max iterations and threshold fulfillment.
- **Known Limitations:** Capped at 3 iterations maximum.

