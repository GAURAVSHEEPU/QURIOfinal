# Project Constraints

## Architectural & Technical Constraints

1. **Language:** Python 3.10+ only.
2. **Machine Learning Framework:** Explainable classical `scikit-learn` algorithms only. No deep learning (TensorFlow, PyTorch), neural knowledge tracing, or black-box ensemble models.
3. **Data Preprocessing:** Strict separation of preprocessor fitting on training data ($X_{\text{train}}$) only. Zero target leakage permitted (`learner_id`, `overall_score`, `learning_risk`, `skill_level` excluded from input matrix $X$).
4. **Synthetic Data Disclosure:** All telemetry data is synthetic prototype data generated via latent factor modeling (seed 42) and must never be presented as real student data.
5. **AI Architecture:** Loop Engineering (`Context -> Execution -> Critic -> Exit Check -> Improve/Deliver`) with bounds `MAX_ITERATIONS = 3` and `QUALITY_THRESHOLD = 85.0`.
6. **No Arbitrary Code Execution:** Zero use of `eval()`, `exec()`, or untrusted shell calls across AI tutor and API layers.
7. **REST API Backend:** FastAPI powered by Uvicorn. Asynchronous route handling, Pydantic input validation, structured JSON serialization, and CORS restricted to local development origins.
8. **In-Memory Artifact Caching:** Pre-loads static JSON artifacts and ML models on server startup. Zero repetitive disk parsing per API request, zero model retraining, zero dynamic dataset generation.
9. **Secret Safety:** API keys and provider credentials must remain configurable via environment variables (`.env`) and never be hardcoded, logged, or printed.
10. **Scope Boundary:** 3-day MVP scope excludes database setups, Redis caching, microservices, vector databases, RAG pipelines, and quantum hardware execution.
