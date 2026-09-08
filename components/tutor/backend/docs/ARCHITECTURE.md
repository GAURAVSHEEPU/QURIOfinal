# Technical Architecture Document

## 1. High-Level Architecture

```
                                USER / FRONTEND
                                      │
                                      ▼
                                 FASTAPI API
                                      │
                                      ▼
                       AI/ML INTELLIGENCE LAYER
 ┌──────────────────────────────────────────────────────────────────┐
 │                                                                  │
 │   ┌──────────────────────┐           ┌──────────────────────┐   │
 │   │    Context Layer     │ ────────► │     ML Engine        │   │
 │   └──────────────────────┘           └──────────────────────┘   │
 │              │                                  │                │
 │              ▼                                  ▼                │
 │   ┌──────────────────────┐           ┌──────────────────────┐   │
 │   │   Learner Profile    │ ◄──────── │ Weak Concept Detect  │   │
 │   └──────────────────────┘           └──────────────────────┘   │
 │              │                                  │                │
 │              ▼                                  ▼                │
 │   ┌──────────────────────┐           ┌──────────────────────┐   │
 │   │  Recommendation Eng  │ ────────► │       AI Tutor       │   │
 │   └──────────────────────┘           └──────────────────────┘   │
 │                                                 │                │
 │                                                 ▼                │
 │                                      ┌──────────────────────┐   │
 │                                      │      AI Critic       │   │
 │                                      └──────────────────────┘   │
 └──────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                           DATA / PERSISTED MODELS
                     (Curriculum JSON / Joblib Models)
```

## 2. Loop Engineering Architecture

The AI Tutor and Critic operate under a strict **Loop Engineering** design pattern:

```
  ┌───────────┐
  │  Context  │  (Learner Profile, Skill Level, Risk, Weak Concept, User Query)
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │ Execution │  (AI Tutor generates initial structured explanation / response)
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │  Critic   │  (Evaluates clarity, correctness, difficulty match, score 0-100)
  └─────┬─────┘
        │
        ▼
 ┌──────────────────┐
 │  Exit Condition  │ ──── YES ────► [ DELIVER RESPONSE ]
 └──────┬───────────┘
        │ NO (Score < QUALITY_THRESHOLD & Iteration < MAX_ITERATIONS)
        ▼
  ┌───────────┐
  │  Improve  │  (Refines prompt context with Critic feedback & re-executes)
  └───────────┘
```

### Loop Stage Responsibilities:
- **Context:** Aggregates learner history, current topic metrics, risk levels, and specific user prompt.
- **Execution:** Generates candidate output via prompt-engineered LLM template.
- **Critic:** Evaluates output on 4 dimensions: Correctness, Relevance, Difficulty Match, and Clarity. Produces a overall quality score (0–100) and explicit actionable feedback.
- **Exit Condition:** Checks if `Quality Score >= QUALITY_THRESHOLD (85)` OR `Iteration >= MAX_ITERATIONS (3)`.
- **Improve / Deliver:** If exit condition is false, feeds Critic critique back to Execution stage to generate an improved iteration. If true, returns final response payload with loop metadata.

## 3. ML Architecture

The classical ML models process quantitative learner telemetry (scores, time, attempts, errors):

1. **Linear Regression (Continuous Performance Prediction):**
   - **Purpose:** Predicts future assessment percentage scores based on past module scores, study duration, and error frequencies.
   - **Why chosen:** Highly explainable, linear feature weighting easy to inspect and present to judges.

2. **Logistic Regression (Binary Learning Risk Classification):**
   - **Purpose:** Classifies learners into binary risk states (At-Risk vs. On-Track) to trigger early intervention workflows.
   - **Why chosen:** Outputs clean probability scores ($P(\text{Risk})$) allowing threshold tuning.

3. **Decision Tree Classifier (Skill Level Classification & Rule Extraction):**
   - **Purpose:** Classifies learner mastery into discrete tiers (Beginner, Intermediate, Advanced).
   - **Why chosen:** Human-readable decision boundaries allow verification of classification logic.

4. **Random Forest Classifier (Multi-class Risk & Robust Skill Prediction):**
   - **Purpose:** Handles non-linear feature interactions and provides feature importance ranking for analytics dashboards.
   - **Why chosen:** Superior accuracy and robustness against noisy synthetic/real telemetry data.

## 4. Data Flow

```
Learner Interaction Telemetry (Quiz score, Circuit time, Error logs, Attempts)
  ↓
Feature Extraction & Normalization (Scikit-Learn Pipeline)
  ↓
ML Prediction Engine (Predicts Score, Risk Probability, Skill Class)
  ↓
Learner Profile Aggregator (Updates topic mastery state & history)
  ↓
Weak Concept Detection Engine (Traverses Curriculum Prerequisite Graph)
  ↓
Personalized Recommendation Engine (Generates ordered Action Items)
  ↓
AI Tutor + Critic Loop (Generates & evaluates tailored explanation)
  ↓
Final JSON Payload Delivered to Frontend / API Consumer
```

## 5. Backend Architecture

```
Frontend / Client Request
  ↓
FastAPI Router (`src/api/main.py`)
  ↓
Service Layer (`src/intelligence/`, `src/tutor/`, `src/ml/`)
  ↓
Model Registry & Inference (`joblib` loaded `.pkl` models)
  ↓
JSON Response Payload
```

## 6. Folder Structure

```
quantum-ai-platform/
│
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── curriculum/
│       └── quantum_topics.json
│
├── models/
│   └── .gitkeep
│
├── notebooks/
│   └── .gitkeep
│
├── src/
│   ├── __init__.py
│   ├── data/
│   │   └── __init__.py
│   ├── ml/
│   │   └── __init__.py
│   ├── intelligence/
│   │   └── __init__.py
│   ├── tutor/
│   │   └── __init__.py
│   └── api/
│       ├── __init__.py
│       └── main.py
│
├── tests/
│   └── __init__.py
│
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── RULES.md
    ├── PHASES.md
    ├── DESIGN.md
    └── MEMORY.md
```

## 7. Tech Stack

### Core Data & ML
- **Python 3.10+**: Core programming language.
- **NumPy & Pandas**: Matrix manipulations, telemetry data preprocessing, feature engineering.
- **Matplotlib**: Generation of analytics charts and learning curves.
- **Scikit-Learn**: Classical explainable machine learning models (Linear/Logistic Regression, Decision Trees, Random Forest).

### Backend & Persistence
- **FastAPI**: Asynchronous web API framework.
- **Uvicorn**: High-performance ASGI server.
- **Pydantic**: Strict data validation and schema enforcement.
- **Joblib**: Fast serialization and deserialization of trained scikit-learn models.

### AI & Loop Engineering
- **LLM API / OpenAI / Custom Provider**: Natural language generation.
- **Prompt Engineering**: Structured zero-shot / few-shot prompt templates.
- **Loop Controller**: Custom Python orchestration engine for Tutor-Critic iterations.

### Quantum Ecosystem (Interface layer)
- **Qiskit / Qiskit Aer**: Circuit representation and local simulator backend support.

