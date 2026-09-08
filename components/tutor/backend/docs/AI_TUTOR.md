# AI Quantum Tutor & Loop Engineering (Phase 5 & AI Tutor Revamp)

## 1. Purpose & Architecture Overview

The **AI Quantum Tutor** is a generative, personalized educational assistant designed for quantum computing algorithms and Qiskit programming.

Unlike generic chatbots, the AI Tutor operates on the **Grounded Bounded Loop Engineering Architecture**:

$$\text{VERIFIED DATA} \longrightarrow \text{CONTEXT BUILDER} \longrightarrow \text{EXECUTION} \longrightarrow \text{CRITIC} \longrightarrow \text{EXIT CONDITION} \longrightarrow \text{IMPROVE / DELIVER}$$

It directly consumes Phase 3 Learner Profiles, Phase 4 Recommendations, Deterministic Circuit Validation, and Deterministic Quiz Analysis to personalize difficulty, tone, mathematical detail, hints, and explanations while strictly preventing AI hallucinations.

```
       [ User Query / Code / Circuit / Quiz ] + [ Phase 3 Profile ] + [ Phase 4 Recs ]
                                                │
                                                ▼
                         [ Grounded Context Builder (Deterministic) ]
                          - Rule-based Circuit Validator (circuit_validator.py)
                          - Rule-based Quiz Analyzer (quiz_analyzer.py)
                          - Learner Intelligence & Curriculum Groundings
                                                │
                                                ▼
                                  [ Execution: Generator LLM ]
                                  (Groq Llama-3.3 / Gemini / Mock)
                                                │
                                                ▼
                                   [ Candidate Response ]
                                                │
                                                ▼
                                   [ Critic: Evaluator LLM ]
                                   (Accuracy, Fit, Clarity)
                                                │
                                                ▼
                                   [ Exit Condition Check ]
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
  (Score >= 85 OR Iteration >= 3)                              (Score < 85 AND Iteration < 3)
                 │                                                             │
                 ▼                                                             ▼
     [ Deliver Best Response ]                                   [ Refine Prompt with Critic Feedback ]
```

---

## 2. LLM Provider Abstraction & Groq Provider

The provider abstraction layer [`src/tutor/llm_client.py`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/src/tutor/llm_client.py) supports:
- **Groq:** Fast Llama-3.3 inference via OpenAI-compatible REST endpoint (`https://api.groq.com/openai/v1/chat/completions`). Configured via:
  - `LLM_PROVIDER="groq"`
  - `LLM_MODEL="llama-3.3-70b-versatile"`
  - `GROQ_API_KEY` (strictly managed via environment, never printed or hardcoded).
- **Google Gemini:** Direct REST API (`generativelanguage.googleapis.com`) using `LLM_PROVIDER="gemini"`.
- **OpenAI:** OpenAI API (`api.openai.com`) using `LLM_PROVIDER="openai"`.
- **Deterministic Mock Mode (`src/tutor/mock_llm.py`):** For offline testing and zero-cost verification, setting `use_mock=True` or `LLM_PROVIDER="mock"` routes calls to `MockLLMClient`.

---

## 3. Three Core AI Capabilities

### AI Capability #1: AI Quantum Learning Chatbot
- Conversational tutoring for quantum computing concepts (`explain`, `chat`, `hint`, `practice`).
- Adapts difficulty (`Beginner`, `Intermediate`, `Advanced`) using Phase 3 profiles.
- Handles conceptual queries, simpler explanations, intuitive analogies, summaries, hints, and next-step recommendations.
- **Strict Grounding:** Only uses profile stats supplied by the learner profile; never invents statistics.

### AI Capability #2: Quantum Circuit Assistant (`src/tutor/circuit_validator.py`)
- Supports students while building and debugging quantum circuits (`circuit_assistant`, `circuit_explain`, `debug`).
- **Separation of Concerns:** Deterministic circuit validation is executed in Python (`CircuitValidator`), NOT by the LLM.
- Validates qubit registers, gate types (`H`, `X`, `Y`, `Z`, `CX`, `CZ`, `SWAP`, `CCX`, `RX`, `RY`, `RZ`), gate boundaries, self-controlled gate errors, and structural pattern algorithms (e.g. Bell state preparation $|\Phi^+\rangle$, GHZ state creation).
- **Behavior:**
  - If valid: Confirms circuit validity, explains the quantum concept, and suggests next steps.
  - If invalid: Identifies error type, explains what went wrong, provides exact `corrected_piece`, explains the underlying concept, and prompts the student to try again.

### AI Capability #3: Quiz Analysis Assistant (`src/tutor/quiz_analyzer.py`)
- Analyzes quiz submissions after completion (`quiz_analysis`).
- **Separation of Concerns:** Scores, percentages, correct counts, topic-wise performance breakdowns, weak topics (<60%), and strong topics (>=80%) are computed deterministically in Python (`QuizAnalyzer`). **The LLM never calculates scores.**
- **Behavior:** Receives verified quiz metrics and generates structured, encouraging explanations highlighting strengths, addressing mistakes, and suggesting targeted learning activities.

---

## 4. Supported Tutor Modes

- `explain`: Conceptual explanations adapted to learner skill level.
- `chat`: Conversational Q&A and follow-up tutoring.
- `hint`: Progressive hints without revealing full direct answers.
- `debug`: Code error identification and Qiskit syntax corrections.
- `code_explain`: Step-by-step code walkthroughs.
- `circuit_explain` / `circuit_assistant`: Deterministic circuit verification and AI explanation.
- `quiz_analysis`: Deterministic quiz scoring and AI performance walkthrough.
- `practice`: Guided practice problems and exercise solutions.

---

## 5. Bounded Loop Engineering & Exit Conditions

- **`QUALITY_THRESHOLD`:** `85.0` out of `100.0`.
- **`MAX_ITERATIONS`:** `3`.
- **No Unbounded Loops / Zero Background Processes:** Executes synchronously within a single request context without thread spawning or background tasks.
- **Best-Response Tracking:** Retains and returns the highest-scoring candidate if refinement iterations score lower.

---

## 6. Security, Error Handling & Secret Safety

1. **Zero Secret Exposure:** API keys are environment-loaded and never hardcoded, printed, logged, or returned in API responses. `.env` is gitignored.
2. **Graceful Provider Fallback:** Network timeouts, HTTP 429/500/503 errors, and malformed JSON payloads gracefully fall back to `MockLLMClient`.
3. **AST Safety:** Zero `eval()` or `exec()` execution.
