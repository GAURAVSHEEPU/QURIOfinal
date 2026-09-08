# AI-Based Interactive Quantum Algorithm Learning Platform
**SIH Problem Statement ID:** 26140

An intelligent, interactive platform for learning quantum computing concepts and algorithms, featuring classical ML learner profiling, weak concept diagnosis, adaptive recommendations, and bounded Loop Engineering AI tutoring.

## Key Features
- **Learner Intelligence Layer:** Continuous score prediction, risk classification, and skill level assessment via explainable scikit-learn models.
- **Weak Concept Detection:** Prerequisite-graph traversal to isolate fundamental conceptual bottlenecks.
- **Personalized Recommendations:** Adaptive learning path suggestions backed by explicit explanatory rationale.
- **Loop Engineering AI Tutor:** Iterative execution-critic tutoring engine capped at `MAX_ITERATIONS = 3` and `QUALITY_THRESHOLD = 85`.

## Project Structure
```
quantum-ai-platform/
├── data/
│   ├── raw/
│   ├── processed/
│   └── curriculum/
│       └── quantum_topics.json
├── models/
├── notebooks/
├── src/
│   ├── data/
│   ├── ml/
│   ├── intelligence/
│   ├── tutor/
│   └── api/
│       └── main.py
├── tests/
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── RULES.md
    ├── PHASES.md
    ├── DESIGN.md
    ├── MEMORY.md
    ├── DECISIONS.md
    ├── FLOW.md
    ├── CONSTRAINTS.md
    ├── TEST_CHECKLIST.md
    ├── ROLLBACK.md
    └── work/
        ├── FEATURES.md
        └── BUGS.md
```

## Setup & Running

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your LLM provider (Groq / Gemini / OpenAI / Mock):

```bash
cp .env.example .env
# Set LLM_PROVIDER=groq, LLM_MODEL=llama-3.3-70b-versatile, GROQ_API_KEY=your_groq_key
```


### 3. Run the Hackathon End-to-End Demo
```bash
python scripts/demo.py
```

### 4. Run Project Validation & Test Suite
```bash
python scripts/validate_project.py
python -m pytest -q
```

### 5. Start API Backend Server
```bash
uvicorn src.api.main:app --reload
```

Verify status at: `http://127.0.0.1:8000/health`  
Interactive Swagger Docs: `http://127.0.0.1:8000/docs`


## REST API Endpoints

- `GET /health`: Operational readiness and model loading status.
- `GET /api/learners/{id}/profile`: Phase 3 learner intelligence profile.
- `GET /api/learners/{id}/recommendations`: Phase 4 personalized recommendations & next_best_action.
- `POST /api/tutor`: Phase 5 AI Quantum Tutor & Loop Engineering query.
- `POST /api/learners/predict`: Phase 2 ML model telemetry prediction.


## AI-Assisted Development

This repository uses a disciplined, controlled AI-assisted development framework to ensure code quality, architecture synchronization, and rollback safety throughout the 3-day hackathon:

- [`docs/MEMORY.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/MEMORY.md): Persistent state memory tracking active tasks, implementation status, and change logs.
- [`docs/DECISIONS.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/DECISIONS.md): Formal decision records detailing context, rationale, trade-offs, and status.
- [`docs/FLOW.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/FLOW.md): Explicit documentation of implemented vs. planned execution flows.
- [`docs/CONSTRAINTS.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/CONSTRAINTS.md): Project guardrails covering scope, technology, ML explainability, AI loop bounds, and security.
- [`docs/TEST_CHECKLIST.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/TEST_CHECKLIST.md): Runnable verification checklist with empirical command results.
- [`docs/ROLLBACK.md`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/docs/ROLLBACK.md): Git-based checkpointing and safe rollback strategy.

*All AI-generated additions are systematically tested, verified, and reviewed against strict project constraints prior to integration.*


