# Development Phases Roadmap (3-Day Hackathon)

## Phase 0 — Foundation
- **Goal:** Set up project documentation control files, folder structure, python dependencies, curriculum dataset, and FastAPI service skeleton.
- **Tasks:**
  - Create standard directory hierarchy (`data/`, `models/`, `src/`, `tests/`, `docs/`).
  - Write all 6 project control documentation files (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PHASES.md`, `DESIGN.md`, `MEMORY.md`).
  - Configure `requirements.txt`, `.env.example`, and `.gitignore`.
  - Build 9-topic quantum curriculum dataset `data/curriculum/quantum_topics.json`.
  - Implement basic FastAPI app with `GET /health` endpoint.
- **Expected Files:**
  - `requirements.txt`, `.env.example`, `.gitignore`, `README.md`
  - `data/curriculum/quantum_topics.json`
  - `src/api/main.py`
  - `docs/*.md` (6 files)
- **Expected Output:** Functional FastAPI server responding 200 OK on `GET /health`.
- **Definition of Done:** Uvicorn starts clean, health endpoint verified, all 6 docs synchronized.
- **Status:** CURRENT

---

## Phase 1 — Learner Data Pipeline
- **Goal:** Build the telemetry data pipeline, synthetic dataset generator, and curriculum mapping engine.
- **Tasks:**
  - Implement synthetic learner telemetry generator simulating quiz scores, time spent, error counts, attempt counts, and topic IDs.
  - Build feature extraction and scaling preprocessing functions.
  - Map learner interaction features against the quantum curriculum graph.
- **Expected Files:**
  - `src/data/synthetic_generator.py`
  - `src/data/preprocessor.py`
  - `src/data/curriculum_loader.py`
  - `data/raw/synthetic_learner_data.csv`
  - `data/processed/processed_learner_data.csv`
- **Expected Output:** Processed CSV datasets ready for training ML models.
- **Definition of Done:** Datasets generated with reproducible seed and validated feature shapes.
- **Status:** NOT STARTED

---

## Phase 2 — ML Models
- **Goal:** Train, evaluate, and persist explainable scikit-learn models for learner analytics.
- **Tasks:**
  - Train Linear Regression model for Continuous Score Prediction.
  - Train Logistic Regression model for Binary Learning Risk Prediction.
  - Train Decision Tree & Random Forest models for Skill-Level Classification.
  - Evaluate models using standard metrics (MSE, MAE, Accuracy, F1-Score, ROC-AUC).
  - Persist trained models to disk using `joblib`.
- **Expected Files:**
  - `src/ml/train_performance_model.py`
  - `src/ml/train_risk_model.py`
  - `src/ml/train_skill_model.py`
  - `src/ml/evaluator.py`
  - `models/performance_model.joblib`
  - `models/risk_model.joblib`
  - `models/skill_model.joblib`
- **Expected Output:** Persisted `.joblib` model binaries with evaluation summary reports.
- **Definition of Done:** Models trained, evaluated, saved, and re-loadable without errors.
- **Status:** NOT STARTED

---

## Phase 3 — Learner Intelligence
- **Goal:** Build the learner profile aggregator, risk scoring engine, and weak concept detector.
- **Tasks:**
  - Implement `LearnerProfile` class to track student historical state.
  - Build `WeakConceptDetector` to identify root prerequisite bottlenecks using topic graph.
  - Create risk scoring and skill classification inference interface.
- **Expected Files:**
  - `src/intelligence/learner_profile.py`
  - `src/intelligence/weak_concept_detector.py`
  - `src/intelligence/intelligence_service.py`
- **Expected Output:** Structural diagnostic profile identifying weak topics and risk indicators.
- **Definition of Done:** Diagnostic engine accurately flags prerequisite weak concepts given low quiz scores.
- **Status:** NOT STARTED

---

## Phase 4 — Recommendation Engine
- **Goal:** Develop personalized recommendation engine suggesting actionable learning steps with explanations.
- **Tasks:**
  - Build topic recommendation logic based on skill level and weak concepts.
  - Build revision, practice exercise, and challenge generator.
  - Include explicit natural language explanations for WHY each recommendation was made.
- **Expected Files:**
  - `src/intelligence/recommendation_engine.py`
  - `tests/test_recommendations.py`
- **Expected Output:** Prioritized array of learning recommendations with supporting rationale.
- **Definition of Done:** Engine produces correct recommendations for Beginner, Intermediate, and Advanced test profiles.
- **Status:** NOT STARTED

---

## Phase 5 — AI Tutor + Loop Engineering
- **Goal:** Implement bounded AI Tutor and Critic feedback loop (`Context -> Execution -> Critic -> Exit Condition -> Improve/Deliver`).
- **Tasks:**
  - Implement prompt templates for Tutor generation and Critic evaluation.
  - Build `LoopEngine` controller enforcing `MAX_ITERATIONS = 3` and `QUALITY_THRESHOLD = 85`.
  - Provide fallback mechanisms if LLM API is unavailable.
  - Support topic explanation, code walk-throughs, debugging hints, and concept simplification.
- **Expected Files:**
  - `src/tutor/prompts.py`
  - `src/tutor/critic.py`
  - `src/tutor/loop_engine.py`
  - `src/tutor/tutor_service.py`
- **Expected Output:** High-quality, critique-refined AI explanations with loop telemetry.
- **Definition of Done:** Loop executes, respects iteration limits, and refines response quality dynamically.
- **Status:** NOT STARTED

---

## Phase 6 — FastAPI Integration
- **Goal:** Expose all intelligence, recommendation, and tutoring capabilities via RESTful API endpoints.
- **Tasks:**
  - Create Pydantic request/response schemas.
  - Implement API endpoints:
    - `POST /predict/performance`
    - `POST /predict/risk`
    - `POST /predict/skill`
    - `POST /recommend`
    - `POST /tutor`
    - `POST /learner/profile`
  - Add API middleware and error handlers.
- **Expected Files:**
  - `src/api/schemas.py`
  - `src/api/routes.py`
  - `src/api/main.py`
- **Expected Output:** OpenAPI documented FastAPI application (`/docs`).
- **Definition of Done:** All 6 endpoints respond correctly with 200 OK for valid payloads.
- **Status:** NOT STARTED

---

## Phase 7 — Integration and Demo
- **Goal:** Build an end-to-end integration demo script and verification flow for SIH presentation.
- **Tasks:**
  - Create end-to-end user scenario script simulating quiz telemetry -> ML diagnosis -> weak concept -> recommendation -> Loop Tutor explanation -> final payload.
  - Validate full pipeline end-to-end without manual intervention.
  - Prepare demonstration documentation and judge presentation walk-through.
- **Expected Files:**
  - `demo_walkthrough.py`
  - `tests/test_end_to_end.py`
- **Expected Output:** Flawless automated execution of full intelligence pipeline.
- **Definition of Done:** Full end-to-end pipeline passes execution test cleanly in < 2 seconds.
- **Status:** NOT STARTED

