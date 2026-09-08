# Decisions

## Decision Template

### Decision: [short title]

Date: YYYY-MM-DD  
Phase: Phase X  
AI/Developer: Role  

Context:  
[Context statement]

Decision:  
[Chosen approach]

Reason:  
[Rationale]

Alternatives:  
[Alternative options]

Trade-offs:  
[Gains and sacrifices]

Status:  
Accepted / Superseded

---

## Documented Project Decisions

### Decision: Python as Primary AI/ML Language

Date: 2026-09-02  
Phase: Phase 0 — Foundation  
AI/Developer: Lead AI Architect  

Context:  
The project requires numerical data processing, machine learning model training, linear algebra operations, quantum framework integration, and web API serving under tight 3-day hackathon deadlines.

Decision:  
Use Python 3.10+ as the primary language for the entire backend and AI/ML intelligence layer.

Reason:  
Python has the standard ecosystem for data science, machine learning (scikit-learn, pandas, numpy), web APIs (FastAPI), and quantum computing SDKs (Qiskit, PennyLane).

Alternatives:  
TypeScript/Node.js, C++, Julia.

Trade-offs:  
Gained massive library support, developer speed, and explainable ML toolkits. Sacrificed raw execution speed compared to C++.

Status:  
Accepted

---

### Decision: Scikit-learn for Classical ML

Date: 2026-09-02  
Phase: Phase 0 — Foundation  
AI/Developer: Lead AI Architect  

Context:  
Learner intelligence requires continuous performance prediction, binary risk classification, and skill level classification. The solution must be explainable to SIH hackathon judges.

Decision:  
Use `scikit-learn` algorithms (Linear Regression, Logistic Regression, Decision Trees, Random Forests) instead of deep learning frameworks.

Reason:  
Explainable classical ML models train in seconds, require no GPU infrastructure, are easy to evaluate with standard metrics, and can be easily explained to hackathon judges.

Alternatives:  
PyTorch, TensorFlow, Deep Knowledge Tracing (DKT) neural networks.

Trade-offs:  
Gained fast training, instant inference, full explainability, and small binary sizes. Sacrificed complex sequential pattern learning of deep architectures.

Status:  
Accepted

---

### Decision: FastAPI for AI/ML API Layer

Date: 2026-09-02  
Phase: Phase 0 — Foundation  
AI/Developer: Lead AI Architect  

Context:  
The backend must expose asynchronous REST endpoints for learner prediction, risk analysis, recommendations, and AI tutoring services.

Decision:  
Use FastAPI powered by Uvicorn.

Reason:  
FastAPI provides automatic OpenAPI documentation (`/docs`), high performance via ASGI, native Pydantic type validation, and easy integration with Python ML models.

Alternatives:  
Flask, Django, Express.js.

Trade-offs:  
Gained asynchronous execution speed, type safety, and automatic swagger documentation. Minimal trade-offs for Python web frameworks.

Status:  
Accepted

---

### Decision: Synthetic Learner Telemetry Data for MVP

Date: 2026-09-02  
Phase: Phase 0 — Foundation  
AI/Developer: Lead AI Architect  

Context:  
No real-world student interaction dataset with quantum algorithm exercise telemetry was readily available for training models prior to the 3-day hackathon.

Decision:  
Generate a realistic, seed-reproducible synthetic dataset simulating learner quiz scores, time spent, attempt counts, and error patterns.

Reason:  
Enables training and validating classical ML models immediately without privacy compliance issues or data collection bottlenecks.

Alternatives:  
Manually hand-crafting rule tables, waiting for live user data.

Trade-offs:  
Gained rapid prototyping capability and full data control. Synthetic data must be explicitly disclosed and cannot claim real-world student accuracy.

Status:  
Accepted

---

### Decision: Latent Ability Factor Correlation Model for Synthetic Data Generation

Date: 2026-09-02  
Phase: Phase 1A — Data Generation  
AI/Developer: Lead AI Architect  

Context:  
Generating purely uniform random numbers produces unrealistic datasets without feature co-variance (e.g. high-ability students having random error rates), while pure linear equations produce artificially perfect datasets without realistic variance.

Decision:  
Model synthetic data generation using a latent ability variable $\sim \mathcal{N}(0, 1)$ coupled with Gaussian noise across features, and difficulty-tier shifts for 9 quantum topics loaded dynamically from `quantum_topics.json`.

Reason:  
Produces realistic, noisy non-linear correlations where study hours, module completion, and topic scores co-vary realistically without creating trivial linear relationships.

Alternatives:  
Uniform random distribution sampling, static rule-based table generation.

Trade-offs:  
Gained realistic data distributions suited for classical ML model training. Requires explicitly ensuring derived targets are documented so they are not leaked as raw input features during training.

Status:  
Accepted

---

### Decision: ColumnTransformer Preprocessing & Target Leakage Protection Architecture

Date: 2026-09-02  
Phase: Phase 1B — Preprocessing Pipeline  
AI/Developer: Lead AI Architect  

Context:  
Raw telemetry contains non-predictive identifiers (`learner_id`) and derived ground-truth target variables (`overall_score`, `learning_risk`, `skill_level`). Including these columns in feature preprocessing would cause target leakage and invalidate ML model evaluation.

Decision:  
Implement a `ColumnTransformer` architecture in `src/data/preprocess_data.py` that explicitly strips forbidden columns (`EXCLUDED_COLUMNS`) before fitting or transforming. Combine `SimpleImputer` + `StandardScaler` for numerical features and `SimpleImputer` + `OneHotEncoder(handle_unknown="ignore")` for categorical features. Serialize fitted preprocessor to `data/processed/preprocessor.joblib`.

Reason:  
Guarantees zero target leakage, robust missing-value handling, safe out-of-vocabulary categorical handling during API inference, and exact reproducibility between training and production inference.

Alternatives:  
Manual DataFrame column scaling, in-memory normalization functions without joblib persistence.

Trade-offs:  
Gained leak-free, production-ready inference transformation. Requires loading the serialized joblib preprocessor before running model inference.

Status:  
Accepted

---

### Decision: Read-Only Exploratory Data Analysis & Matplotlib Visualization Protocol

Date: 2026-09-02  
Phase: Phase 1C — Exploratory Data Analysis  
AI/Developer: Lead AI Architect  

Context:  
Before training machine learning models in Phase 2, the synthetic dataset must be rigorously audited for feature distributions, target class balance, statistical correlations, and data quality without modifying `data/raw/learner_data.csv`.

Decision:  
Build `src/data/analyze_data.py` as a read-only analysis pipeline using Pandas, NumPy, and Matplotlib. Export summary CSV artifacts and Matplotlib chart PNGs into `data/analysis/`, compile findings into `docs/EDA_REPORT.md`, and verify raw CSV MD5 immutability.

Reason:  
Establishes empirical validation of ML readiness (1,000 complete records, $r > 0.8$ feature-target correlations, healthy 67/32 risk balance), fulfilling SIH hackathon code review standards while protecting raw data integrity.

Alternatives:  
Relying on informal visual checks, adding heavy Seaborn/Plotly visualization dependencies.

Trade-offs:  
Gained empirical certification of ML readiness and lightweight static chart generation. Requires maintaining exported analysis artifacts.

Status:  
Accepted

---

### Decision: Training-Only Preprocessor Fitting & Shared Stratified Train/Test Partitioning

Date: 2026-09-03  
Phase: Phase 1D — ML-Ready Dataset Preparation  
AI/Developer: Lead AI Architect  

Context:  
Fitting data scaling and encoding transformers on the full dataset prior to splitting introduces subtle data leakage (test set distribution influencing training mean/variance). Furthermore, creating different random splits for performance, risk, and skill models prevents direct model comparison.

Decision:  
Train/test splitting (80/20 split, 800 train / 200 test, `random_state=42`, stratified by `skill_level`) occurs BEFORE fitting the preprocessing pipeline. The `ColumnTransformer` preprocessor fits EXCLUSIVELY on $X_{\text{train}}$ features and is persisted as `data/processed/ml_preprocessor.joblib`. Prediction targets (`y_performance`, `y_risk`, `y_skill`) and learner tracking IDs are isolated separately into 11 dedicated CSV artifacts.

Reason:  
Guarantees absolute zero preprocessor data leakage, guarantees test set statistical independence, and provides a single, reproducible, shared dataset partition for fair comparison across all Phase 2 ML models.

Alternatives:  
Reusing the Phase 1B full-dataset preprocessor, creating independent random splits for each model target.

Trade-offs:  
Gained strict statistical integrity and leak-free ML preparation. Requires maintaining separate preprocessor artifacts (`preprocessor.joblib` for Phase 1B vs `ml_preprocessor.joblib` for Phase 1D).

Status:  
Accepted

---

### Decision: Linear Regression Baseline Performance Predictor & Coefficient Analysis

Date: 2026-09-03  
Phase: Phase 2A — Performance Prediction Model  
AI/Developer: Lead AI Architect  

Context:  
The platform requires a continuous `overall_score` predictor to estimate student expected mastery based on activity telemetry and topic performance. The model must be simple, explainable, and fast to execute.

Decision:  
Implement `sklearn.linear_model.LinearRegression` in `src/models/performance_model.py`. Evaluate using MAE, MSE, RMSE, and $R^2$ against a `DummyRegressor(strategy='mean')` baseline on the untouched 200-sample test set. Save model binary to `data/models/performance_linear_regression.joblib` and export sorted regression coefficients to `data/models/performance_coefficients.csv`.

Reason:  
Linear Regression provides an exact, human-interpretable baseline where coefficients explicitly highlight feature weights (`coding_score` $+3.009$, `quiz_score` $+2.820$, `challenge_score` $+1.531$). Evaluation confirmed near-perfect prediction accuracy ($R^2 = 1.0$, $\text{MAE} = 0.0243$) outperforming the dummy baseline ($\text{MAE} = 13.4785$).

Alternatives:  
Decision Tree Regressor, Random Forest Regressor, Neural Networks.

Trade-offs:  
Gained 100% explainability, instant inference (<1ms), and zero training overhead. Unbounded linear output requires safety clipping $[0, 100]$ during production API serving.

Status:  
Accepted

---

### Decision: Logistic Regression Binary Risk Prediction & Probability Calibration

Date: 2026-09-03  
Phase: Phase 2B — Learning Risk Prediction Model  
AI/Developer: Lead AI Architect  

Context:  
The platform requires an early-warning risk classification model to identify learners at risk of falling behind (`0 = On-Track`, `1 = At-Risk`). The model must produce continuous risk probabilities ($P(\text{At-Risk})$) alongside discrete classifications and prioritize high Recall for At-Risk learners.

Decision:  
Implement `sklearn.linear_model.LogisticRegression(max_iter=1000, random_state=42)` in `src/models/risk_model.py`. Evaluate using Accuracy, Precision, Recall, F1, and Confusion Matrix against a `DummyClassifier(strategy='most_frequent')` baseline. Save model binary to `data/models/learning_risk_logistic_regression.joblib`, export log-odds coefficients to `learning_risk_coefficients.csv`, and expose `predict_proba()`.

Reason:  
Logistic Regression achieved $99.50\%$ Accuracy and $98.41\%$ Recall on the At-Risk class (detecting 62 out of 63 at-risk learners on the test set), drastically outperforming the dummy baseline ($\text{Accuracy} = 68.50\%, \text{F1} = 0.0000$). Log-odds coefficients explicitly show that higher `quiz_score` ($-2.1561$) and `coding_score` ($-2.0539$) lower risk, while higher `errors` ($+0.6751$) increase risk.

Alternatives:  
Random Forest Classifier, Support Vector Machines (SVM), Neural Networks, SMOTE oversampling.

Trade-offs:  
Gained linear log-odds interpretability, probability calibration ($P(\text{At-Risk}) \in [0, 1]$), and high recall. Standard decision threshold of $0.5$ is sufficient for synthetic data, but threshold tuning could be applied in production if $100\%$ risk recall is mandated.

Status:  
Accepted

---

### Decision: Random Forest Selected as Primary Skill Level Classifier over Decision Tree Baseline

Date: 2026-09-03  
Phase: Phase 2C — Skill Level Classification  
AI/Developer: Lead AI Architect  

Context:  
Learner skill level classification requires categorizing students into multi-class mastery tiers (`Beginner`, `Intermediate`, `Advanced`). The system needs both high multi-class predictive accuracy and explainable feature importances.

Decision:  
Implement both `DecisionTreeClassifier(max_depth=5, random_state=42)` and `RandomForestClassifier(n_estimators=100, max_depth=7, random_state=42)` in `src/models/skill_model.py`. Evaluate both on the untouched test set ($N=200$) using weighted Precision, Recall, and F1-score against a `DummyClassifier(strategy='most_frequent')` baseline. Select **Random Forest** as the primary production model binary (`data/models/skill_random_forest.joblib`) while preserving the Decision Tree (`data/models/skill_decision_tree.joblib`) for visual graph inspection (`skill_decision_tree.png`).

Reason:  
Random Forest achieved superior test set performance ($\text{Test Accuracy} = 94.50\%, \text{Weighted F1} = 0.9442$) compared to Decision Tree ($\text{Test Accuracy} = 93.50\%, \text{Weighted F1} = 0.9351$), while both overwhelmingly beat the dummy baseline ($\text{Test Accuracy} = 43.00\%, \text{F1} = 0.2586$). Random Forest feature importances identify `quiz_score` ($13.99\%$), `grover_score` ($13.83\%$), and `shor_score` ($13.72\%$) as the top skill tier discriminators.

Alternatives:  
Multi-class Logistic Regression, Support Vector Classifiers (SVC), K-Nearest Neighbors.

Trade-offs:  
Gained higher ensemble accuracy, reduced decision boundary variance, and robust Gini feature importance rankings. Decision tree visualization diagram retained for hackathon jury explainability.

Status:  
Accepted

---

### Decision: Centralized Model Registry Architecture & Automated Quality Gate Protocol

Date: 2026-09-03  
Phase: Phase 2D — ML Consolidation & Validation  
AI/Developer: Lead AI Architect  

Context:  
Deploying multiple distinct classical ML models (`performance_predictor`, `learning_risk_predictor`, `skill_classifier`) into downstream intelligence components (Learner Profiles, Weak Concept Detector, Recommendation Engine) requires a unified metadata contract, automated metric consolidation, and end-to-end inference verification.

Decision:  
Implement `src/models/validate_models.py` to automate quality gate assertions, generate `data/models/model_registry.json`, compile `data/models/model_metrics_summary.csv`, render `data/models/plots/model_comparison.png`, and verify end-to-end inference compatibility (`ml_preprocessor.joblib` -> 3 models -> score 72.75%, risk On-Track, skill Intermediate). All models are marked with status `prototype_validated`.

Reason:  
Establishes a single, machine-readable registry contract for Phase 3+ integration, guarantees zero data leakage or non-finite exceptions across model binaries, and compiles a comprehensive audit report `docs/ML_MODEL_REPORT.md` for hackathon evaluation.

Alternatives:  
Hardcoding model artifact paths inside API endpoint handlers, manually managing model metrics in separate text files.

Trade-offs:  
Gained robust model registry automation, zero runtime inference errors, and clean separation between classical ML and downstream systems. Requires maintaining `model_registry.json` when adding new model versions.

Status:  
Accepted

---

### Decision: Separation of ML Prediction from Intelligence Interpretation & Personalization Signal Contract

Date: 2026-09-03  
Phase: Phase 3 — Learner Intelligence & Personalization  
AI/Developer: Lead AI Architect  

Context:  
Raw ML predictions (continuous floats, calibrated probabilities, multi-class labels) must be interpreted into actionable educational insights (performance bands, risk statuses, topic strengths/weaknesses, behavioral signals) without altering trained ML binaries or introducing target data leakage.

Decision:  
Implement `src/intelligence/learner_profile.py` using transparent prototype heuristics: Performance bands (`Low` <50, `Moderate` 50-74.99, `High` >=75), Risk status (`Low Risk` <0.30, `Moderate Risk` 0.30-0.59, `High Risk` >=0.60), and Topic categorization (`strength` >=75, `weakness` <60, `developing` 60-74.99 across all 9 quantum topics). Generate neutral behavioral descriptors and explicit boolean/list `personalization_signals` for Phase 4 consumption.

Reason:  
Maintains strict decoupling between ML model inference and domain logic interpretation, prevents target data leakage, provides deterministic template-based summary strings without LLM calls, and yields a standardized JSON profile schema (`data/intelligence/learner_profiles.json`).

Alternatives:  
Embedding interpretation rules directly inside scikit-learn models, calling an LLM for profile generation.

Trade-offs:  
Gained 100% deterministic, instant (<1ms) profile generation and clean JSON contract. Thresholds are prototype heuristics requiring empirical tuning on real student cohorts.

Status:  
Accepted

---

### Decision: Deterministic 2-Stage Recommendation Architecture with Transparent Priority Scoring & Deterministic Critic Filter

Date: 2026-09-03  
Phase: Phase 4 — Personalized Recommendation Engine  
AI/Developer: Lead AI Architect  

Context:  
Personalized learning recommendations must translate Phase 3 learner intelligence profiles into prioritized, prerequisite-aware educational actions without using black-box recommendation models, retraining ML binaries, or invoking non-deterministic LLMs.

Decision:  
Implement `src/recommendation/recommendation_engine.py` featuring a 2-stage architecture: Candidate Generation across 6 logic channels (review weak topics, practice developing topics, prerequisite reinforcement, foundational slow-down, curriculum progression, challenges), coupled with a transparent Priority Scoring formula ($\text{Base Weight} + \text{Weakness Bonus} + \text{Risk Adjustment} + \text{Skill Alignment} + \text{Behavior Bonus}$) bounded in $[0.0, 100.0]$. Filter candidates using a Deterministic Critic (`validate_candidate()`) enforcing curriculum topic existence, schema completeness, deduplication, and risk safety filters. Select top 5 ranked recommendations and expose `next_best_action`.

Reason:  
Guarantees 100% deterministic, fully explainable recommendations, enforces curriculum prerequisite dependency checks (`quantum_topics.json`), prevents recommendation redundancy, and outputs structured JSON artifacts (`data/recommendations/learner_recommendations.json`).

Alternatives:  
Collaborative filtering ML models, LLM zero-shot prompt generation, heuristic hardcoded rule tables.

Trade-offs:  
Gained absolute explainability, zero API costs, instant execution (<1ms), and 100% reproducible results. Scoring weights are prototype heuristics suited for hackathon demonstration.

Status:  
Accepted

---

### Decision: Configurable LLM Provider Abstraction Layer with Offline Mock Client and Multi-Pass Loop Engineering

Date: 2026-09-03  
Phase: Phase 5 — AI Quantum Tutor & Loop Engineering  
AI/Developer: Lead AI Architect  

Context:  
The generative AI Quantum Tutor must deliver personalized explanations adapted to student skill level, weak topics, and Phase 4 recommendations while enforcing strict quality thresholds, bounded iteration counts, offline testability, and zero secret leakage.

Decision:  
Implement `src/tutor/quantum_tutor.py` executing the multi-pass Loop Engineering Architecture (`CONTEXT -> EXECUTION -> CRITIC -> EXIT CONDITION -> IMPROVE/DELIVER`) bounded by `QUALITY_THRESHOLD = 85.0` and `MAX_ITERATIONS = 3`. Build provider abstraction `src/tutor/llm_client.py` configured via `LLM_PROVIDER`, `LLM_MODEL`, and `LLM_API_KEY`, backed by an offline `MockLLMClient` (`src/tutor/mock_llm.py`) for zero-cost testing. Include a `fallback_critic()` to guarantee the engine never crashes due to API errors, and track `best_response` across iterations. Enforce zero `eval()` or `exec()` statements via AST verification.

Reason:  
Guarantees 100% quality-checked tutor responses, bounded latency and API cost protection, offline testability without live API keys, and strict safety compliance for hackathon demonstration.

Alternatives:  
Unbounded single-pass LLM calls, hardcoded vendor SDK locks, in-memory prompt strings without critic verification.

Trade-offs:  
Gained guaranteed response structure, offline test suite compatibility, and multi-pass quality control. Sacrificed single-pass latency when candidate refinement is required.

Status:  
Accepted

---

### Decision: End-to-End Terminal Demonstration & Comprehensive System Integration Test Suite

Date: 2026-09-03  
Phase: Phase 7 — Full Integration, Testing & Hackathon Demo  
AI/Developer: Lead AI Architect  

Context:  
Demonstrating the full 7-phase system during the hackathon requires a single, cohesive learner journey presentation (`scripts/demo.py`), automated project integrity verification (`scripts/validate_project.py`), and a 100% passing automated test suite (`tests/`).

Decision:  
Implement `scripts/demo.py` to walk through a complete learner story (Learner Telemetry -> Phase 2 ML -> Phase 3 Profile -> Phase 4 Recommendations -> Phase 5 AI Tutor & Loop Engineering) in under 2 seconds. Implement `scripts/validate_project.py` to audit all 11 required data and joblib model artifacts. Build `tests/test_end_to_end.py` and `tests/test_personalization.py` to empirically verify that differing learner profiles produce distinct recommendations and tutor contexts across a 33-test regression suite.

Reason:  
Provides a compelling, presentation-ready hackathon demonstration, proves zero component disconnection, and certifies 100% system integration safety.

Alternatives:  
Manual endpoint curl scripts, disconnected component demonstrations.

Trade-offs:  
Gained presentation speed, empirical verification, and clean documentation. Terminal demo requires ASCII characters for cross-platform Windows compatibility.

Status:  
Accepted

---

### Decision: Groq LLM Provider Integration & OpenAI-Compatible REST Schema Abstraction

Date: 2026-09-05  
Phase: Provider Change (Groq Migration)  
AI/Developer: Lead AI Architect  

Context:  
The live LLM provider for the AI Quantum Tutor needed to be expanded from Google Gemini to Groq (`LLM_PROVIDER="groq"`, `LLM_MODEL="llama-3.3-70b-versatile"`) to leverage ultra-fast inference speeds while preserving existing tutor schemas, Loop Engineering bounds (`QUALITY_THRESHOLD=85.0`, `MAX_ITERATIONS=3`), and offline MockLLM test capability.

Decision:  
Update `src/tutor/llm_client.py` to support Groq via its OpenAI-compatible chat completions REST API endpoint (`https://api.groq.com/openai/v1/chat/completions`). Support `GROQ_API_KEY` with fallback to `LLM_API_KEY`, default model `llama-3.3-70b-versatile`, and preserve full offline Mock client fallback when credentials are absent or network errors occur.

Reason:  
Preserves the exact provider abstraction interface without changing tutor engine prompts, critic logic, exit conditions, or API schemas. Uses Python built-in `urllib.request` requiring zero third-party SDK dependencies or architectural rewrites.

Alternatives:  
Installing third-party `groq` Python SDK, rewriting `quantum_tutor.py` prompt templates.

Trade-offs:  
Gained fast Groq inference, zero third-party binary dependencies, and 100% backward compatibility with Gemini, OpenAI, and Mock mode.

Status:  
Accepted
