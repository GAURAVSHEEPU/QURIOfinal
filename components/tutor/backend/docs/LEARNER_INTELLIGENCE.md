# Learner Intelligence & Personalization Engine (Phase 3)

## 1. Purpose & Architecture Overview

The **Learner Intelligence Layer** serves as the bridge between raw student interaction telemetry + trained Phase 2 Machine Learning models and downstream Phase 4 Personalization & Recommendation Engine.

It transforms quantitative ML predictions into a rich, structured, JSON-serializable **Learner Profile** that captures student skill tiering, performance bands, calibrated risk status, topic strengths/weaknesses, observable behavioral signals, and explicit personalization flags.

```
                              [ Raw Learner Telemetry Input ]
                                             │
                                             ▼
                        [ Preprocessor: ml_preprocessor.joblib ]
                                             │
                                             ▼
                      [ Transformed Feature Vector X (20-dim) ]
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      │                                      │                                      │
      ▼                                      ▼                                      ▼
[ Performance Predictor ]            [ Risk Predictor ]                   [ Skill Classifier ]
 LinearRegression                     LogisticRegression                   RandomForestClassifier
 Output: predicted_performance        Output: risk_probability             Output: skill_level
      │                                      │                                      │
      └──────────────────────────────────────┼──────────────────────────────────────┘
                                             │
                                             ▼
                          [ Learner Intelligence Layer Engine ]
                           (src/intelligence/learner_profile.py)
                                             │
                                             ├──► Topic Analysis (9 Quantum Topics)
                                             ├──► Behavior Summarization (Observable Signals)
                                             ├──► Personalization Flags Generation
                                             └──► Deterministic Summary Synthesis
                                             │
                                             ▼
                           [ Structured Learner Profile JSON ]
```

---

## 2. Learner Profile Schema

Each learner profile is represented as a clean, JSON-serializable dictionary:

```json
{
  "learner_id": "LEARNER_0001",
  "skill_level": "Intermediate",
  "predicted_performance": 65.29,
  "performance_band": "Moderate",
  "risk_probability": 0.0007,
  "risk_status": "Low Risk",
  "topic_scores": {
    "qubits": 73.5,
    "superposition": 67.2,
    "measurement": 76.5,
    "quantum_gates": 74.0,
    "entanglement": 83.3,
    "bell_states": 73.3,
    "quantum_circuits": 61.3,
    "grover": 59.9,
    "shor": 51.6
  },
  "topic_strengths": ["measurement", "entanglement"],
  "topic_weaknesses": ["grover", "shor"],
  "topic_developing": ["qubits", "superposition", "quantum_gates", "bell_states", "quantum_circuits"],
  "learning_behavior": {
    "learning_hours_per_week": 8.7,
    "modules_completed": 6,
    "attempts": 5,
    "errors": 7,
    "time_spent_minutes": 121,
    "behavior_signals": [
      "Moderate error frequency",
      "Moderate exercise attempts"
    ]
  },
  "personalization_signals": {
    "current_skill_level": "Intermediate",
    "performance_band": "Moderate",
    "risk_status": "Low Risk",
    "weak_topics": ["grover", "shor"],
    "strong_topics": ["measurement", "entanglement"],
    "developing_topics": ["qubits", "superposition", "quantum_gates", "bell_states", "quantum_circuits"],
    "high_error_signal": false,
    "high_attempt_signal": false,
    "low_module_completion_signal": false,
    "high_learning_activity_signal": false
  },
  "intelligence_summary": "Learner LEARNER_0001 is classified as an Intermediate skill learner with Moderate predicted performance (65.29%) and Low Risk (P=0.0007). Demonstrates strong mastery in [measurement, entanglement], developing concepts in [qubits, superposition, quantum_gates, bell_states, quantum_circuits], and identified weaknesses in [grover, shor]. Behavioral telemetry indicates: Moderate error frequency, Moderate exercise attempts."
}
```

---

## 3. Consumed Phase 2 ML Models & Preprocessor

The intelligence layer consumes the persisted Phase 2 artifacts via `load_models()`:
1. **Preprocessor:** `data/processed/ml_preprocessor.joblib` (ColumnTransformer, fitted exclusively on training data $X_{\text{train}}$).
2. **Performance Predictor:** `data/models/performance_linear_regression.joblib` (LinearRegression).
3. **Risk Predictor:** `data/models/learning_risk_logistic_regression.joblib` (LogisticRegression).
4. **Skill Classifier:** `data/models/skill_random_forest.joblib` (RandomForestClassifier, preferred model loaded via `data/models/model_registry.json`).

---

## 4. Interpretation Heuristics & Analysis Logic

### Performance Interpretation
- `score < 50.0`: `"Low"`
- `50.0 <= score < 75.0`: `"Moderate"`
- `score >= 75.0`: `"High"`

### Risk Probability Interpretation
- `probability < 0.30`: `"Low Risk"`
- `0.30 <= probability < 0.60`: `"Moderate Risk"`
- `probability >= 0.60`: `"High Risk"`

### Topic Analysis (9 Quantum Topics)
- `score >= 75.0`: Added to `topic_strengths`
- `score < 60.0`: Added to `topic_weaknesses`
- `60.0 <= score < 75.0`: Added to `topic_developing`

### Learning Behavior Descriptors
Observable signals are described using neutral, non-judgmental terminology:
- Errors $\ge 8$: `"Elevated error frequency"`
- Errors $4 - 7$: `"Moderate error frequency"`
- Attempts $\ge 6$: `"High attempt frequency"`
- Attempts $3 - 5$: `"Moderate exercise attempts"`
- Learning Hours $\ge 12.0$: `"Higher weekly learning activity"`
- Learning Hours $< 5.0$: `"Lower weekly learning activity"`
- Modules Completed $\le 3$: `"Limited module completion"`
- Modules Completed $\ge 7$: `"Advanced module progression"`

---

## 5. Personalization Signals Contract (For Phase 4 Recommendation Engine)

The `personalization_signals` dictionary provides boolean flags and clean topic lists for downstream consumption:
- `current_skill_level`: `"Beginner"` | `"Intermediate"` | `"Advanced"`
- `performance_band`: `"Low"` | `"Moderate"` | `"High"`
- `risk_status`: `"Low Risk"` | `"Moderate Risk"` | `"High Risk"`
- `weak_topics`: Array of topic strings requiring remediation.
- `strong_topics`: Array of topic strings ready for advanced challenges.
- `developing_topics`: Array of topic strings requiring reinforcement.
- `high_error_signal`: Boolean flag indicating elevated error rates.
- `high_attempt_signal`: Boolean flag indicating high attempt counts.
- `low_module_completion_signal`: Boolean flag indicating slow module progress.
- `high_learning_activity_signal`: Boolean flag indicating high weekly engagement.

---

## 6. Data Leakage Protection

The intelligence layer enforces strict target isolation:
- Raw learner inputs may contain ground-truth target labels (`overall_score`, `learning_risk`, `skill_level`) when processing historical benchmarks.
- Function `prepare_learner_features()` strictly filters out `FORBIDDEN_TARGETS` (`learner_id`, `overall_score`, `learning_risk`, `skill_level`) before passing feature vectors to `ml_preprocessor.joblib`.
- All prediction fields (`predicted_performance`, `risk_probability`, `skill_level`) are strictly generated by inference through trained ML models.

---

## 7. Important Limitations & Synthetic Data Disclosure

> [!IMPORTANT]
> **Synthetic Data Disclosure:**
> Learner telemetry and baseline records originate from a synthetic dataset ($N=1000$).
> 
> **Limitations:**
> 1. Performance, risk, and topic classification thresholds are prototype heuristics designed for hackathon demonstration.
> 2. Behavioral signals describe observed numerical telemetry (e.g. error counts) and do NOT make psychological, personality, or trait assertions about students.
> 3. Profiles represent educational decision-support indicators rather than absolute evaluations of student potential.
> 4. Real-world deployment requires calibrating interpretation thresholds against human student cohort distributions.

---

## 8. How Phase 4 (Recommendation Engine) Should Consume Profiles

Phase 4 should load `data/intelligence/learner_profiles.json` or invoke `build_learner_profile(learner_input)` to obtain the profile dictionary.

Phase 4 logic should directly query:
```python
profile = build_learner_profile(learner_data)
signals = profile["personalization_signals"]

if signals["risk_status"] == "High Risk" or signals["high_error_signal"]:
    # Prioritize prerequisite topic remediation for topics in signals["weak_topics"]
    ...
elif signals["current_skill_level"] == "Advanced" and not signals["weak_topics"]:
    # Recommend advanced algorithm challenges (e.g. Shor's algorithm, Grover search)
    ...
```

