# Hackathon Demo Guide & System Walkthrough (Phase 7)

## 1. What the Platform Demonstrates

The **AI-Based Interactive Quantum Algorithm Learning Platform** (SIH Problem Statement 26140) demonstrates an end-to-end personalized learning system powered by explainable classical machine learning and bounded Loop Engineering AI tutoring:

1. **Quantitative Telemetry Analysis:** Continuous score prediction, binary risk classification, and multi-class skill level assessment (Phase 2 ML).
2. **Learner Intelligence & Personalization:** Qualitatively mapped learner profiles with topic strengths, weak concepts, developing areas, and neutral behavioral signals (Phase 3).
3. **Personalized Recommendation Engine:** Prerequisite-aware, 2-stage priority recommendation engine suggesting next best learning actions (Phase 4).
4. **AI Quantum Tutor & Loop Engineering:** Multi-pass generative AI tutoring engine bounded by `MAX_ITERATIONS = 3` and `QUALITY_THRESHOLD = 85.0` (Phase 5).
5. **FastAPI REST Backend:** Asynchronous API service exposing health, profile, recommendation, prediction, and tutoring endpoints (Phase 6).

---

## 2. System Flow Architecture

```
 Client (Frontend / Script / Test Suite)
                   │
                   ▼
         [ FastAPI REST API ] (src/api/main.py)
                   │
                   ├──► GET  /health                            ──► System Health & Model Readiness
                   ├──► GET  /api/learners/{id}/profile         ──► Phase 3 Learner Profile
                   ├──► GET  /api/learners/{id}/recommendations ──► Phase 4 Recommendations & Next Best Action
                   ├──► POST /api/learners/predict              ──► Phase 2 ML Telemetry Inference
                   └──► POST /api/tutor                         ──► Phase 5 Bounded AI Quantum Tutor Loop
```

---

## 3. How to Run the End-to-End Terminal Demo

### Option A: Run Terminal Demo Script (Default: Learner 1)
```bash
python scripts/demo.py
```

### Option B: Run Terminal Demo for a Specific Learner
```bash
python scripts/demo.py LEARNER_0002
```

---

## 4. How to Start the REST API Backend & Interactive Docs

### 1. Start Server via Uvicorn
```bash
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Access Documentation Interfaces
- **Swagger Interactive UI:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

---

## 5. Mode Configurations

### A. Mock Mode (Default / Offline / Zero-Cost)
By default, setting `LLM_PROVIDER="mock"` or omitting `LLM_API_KEY` routes tutor queries through `MockLLMClient` (`src/tutor/mock_llm.py`). This guarantees 100% deterministic, instant (<1ms) testing without network overhead.

### B. Live LLM Mode (Optional)
To run live generative queries with Google Gemini or OpenAI:
1. Edit `.env`:
   ```ini
   LLM_PROVIDER=gemini
   LLM_MODEL=gemini-1.5-flash
   LLM_API_KEY=your_actual_api_key_here
   ```
2. Re-run `python scripts/demo.py`. The script will automatically detect credentials and invoke the live provider.

---

## 6. Sample Learner Journey Output

```text
======================================================================
  SIH PROBLEM STATEMENT 26140: QUANTUM ALGORITHM LEARNING PLATFORM
  AI-POWERED INTERACTIVE LEARNER JOURNEY DEMONSTRATION
======================================================================

[1/4] Initializing AI Engine & In-Memory Artifact Store...
      Loaded 1,000 Intelligence Profiles & 1,000 Recommendations in 1907.8 ms.

----------------------------------------------------------------------
  STEP 1: LEARNER INTELLIGENCE PROFILE (LEARNER_0001)
----------------------------------------------------------------------
  > Skill Level Classification: Intermediate (Random Forest Classifier)
  > Predicted Performance:    65.29% (Moderate Band)
  > Risk Assessment:          Low Risk (P(At-Risk) = 0.0007)

  > Topic Strengths (>=75%):  measurement, entanglement
  > Developing Concepts:      qubits, superposition, quantum_gates, bell_states, quantum_circuits
  > Weak Topics (<60%):       grover, shor

  > Observable Telemetry:     8.7 hrs/wk | 7 errors | 5 attempts
  > Behavioral Signals:       Moderate error frequency, Moderate exercise attempts

----------------------------------------------------------------------
  STEP 2: PERSONALIZED RECOMMENDATION ENGINE & NEXT BEST ACTION
----------------------------------------------------------------------
  [NEXT BEST LEARNING ACTION]:
    > Action:   Reinforce prerequisite concept: Quantum Circuits
    > Topic:    Quantum Circuits (reinforce_prerequisite)
    > Priority: 100.0 / 100.0
    > Rationale: Prerequisite Quantum Circuits (score 61.3%) requires reinforcement before advancing in Grover's Algorithm.

----------------------------------------------------------------------
  STEP 3: AI QUANTUM TUTOR & BOUNDED LOOP ENGINEERING [DETERMINISTIC MOCK MODE]
----------------------------------------------------------------------
  Learner Question: 'Explain the concept of quantum entanglement and why I should Reinforce prerequisite concept: Quantum Circuits.'
  Tutor Mode:       explain

  [TUTOR RESPONSE PAYLOAD Delivered in 0.2 ms]:
  > Concept Focus:   Entanglement
  > Difficulty Fit:  Intermediate
  > Quality Score:   90.0 / 100.0 (Evaluated by AI Critic)
  > Loop Iterations: 1 iteration(s) executed
  > Confidence:      0.95

======================================================================
  DEMONSTRATION COMPLETED SUCCESSFULLY - ALL PHASES INTEGRATED
======================================================================
```

---

## 7. Known Limitations & Disclosure

> [!IMPORTANT]
> **Synthetic Prototype Data Disclosure:**
> The 1,000 synthetic learner records were generated via a correlated latent ability model (seed 42) for MVP prototyping.
> 
> **Limitations:**
> 1. ML classification and recommendation scoring weights are hackathon prototype heuristics.
> 2. The platform is designed for decision-support and educational assistance; it does not replace human instructors.
> 3. Real-world deployment requires testing with human student cohorts.
