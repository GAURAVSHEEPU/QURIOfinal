# Engineering and AI/ML Rules

## 1. Development Rules
- **Prioritize Working MVP Functionality:** Focus exclusively on core hackathon requirements. Avoid premature optimization or unrequested features.
- **Keep Code Modular:** Maintain clean separation between data preprocessing (`src/data`), machine learning (`src/ml`), intelligence analytics (`src/intelligence`), tutoring (`src/tutor`), and API handlers (`src/api`).
- **Keep Code Readable & Maintainable:** Follow PEP 8 guidelines. Keep functions short and focused on a single responsibility.
- **Use Python Type Hints:** Annotate function arguments and return types to minimize runtime type bugs.
- **Add Docstrings:** Include clear docstrings for public classes, endpoints, and complex algorithmic helper methods.
- **Do Not Over-Engineer:** Avoid introducing unnecessary abstractions, complex design patterns, or extra architectural layers.
- **Do Not Duplicate Logic:** Enforce DRY (Don't Repeat Yourself) principles across data pipelines and evaluation scripts.
- **Do Not Silently Ignore Errors:** Always capture, log, and raise structured exceptions or HTTP status codes.

## 2. ML Rules
- **Start with Simple Explainable Models:** Use Linear Regression, Logistic Regression, Decision Trees, and Random Forests.
- **Use Appropriate Train/Test Splits:** Maintain split ratios (e.g., 80/20 train-test split with fixed `random_state=42`) for reproducibility.
- **Evaluate Models Using Standard Metrics:** Evaluate regression via MSE/RMSE/MAE/$R^2$ and classification via Accuracy/Precision/Recall/F1-score/ROC-AUC.
- **Do Not Fabricate Model Performance:** Benchmark exact performance metrics directly from test set evaluation.
- **Synthetic Data Protocols:**
  - Synthetic data generation is permitted for hackathon prototype validation.
  - Clearly label synthetic data generation modules and files (e.g., `generate_synthetic_data()`).
  - Never claim synthetic data represents real-world human learner telemetry.
- **Model Persistence:** Always serialize trained pipelines and estimators using `joblib` into the `models/` folder.

## 3. AI Rules
- **Never Train an LLM from Scratch:** Leverage cloud LLM APIs or lightweight pre-trained inference endpoints.
- **Strict Separation of Concerns:**
  - Classical ML handles quantitative, deterministic learner intelligence (risk, performance prediction, skill tier).
  - LLM handles qualitative natural language tutoring, concept explanation, and hint generation.
- **No LLM Score Determination:** Never allow the LLM alone to assign numerical learner proficiency scores or risk classifications.

## 4. Loop Engineering Rules
Every AI execution loop MUST strictly implement the five canonical stages:
1. **Context:** Inputs learner telemetry, skill level, risk, weak topic, user prompt.
2. **Execution:** Initial generation pass by the AI Tutor.
3. **Critic:** Quantitative scoring and qualitative critique by the AI Critic.
4. **Exit Condition:** Evaluates `score >= QUALITY_THRESHOLD` OR `iteration >= MAX_ITERATIONS`.
5. **Improve / Deliver:** Loop back to refine prompt if exit condition is false; deliver final output if true.

### Strict Bounded Loop Constants:
```python
MAX_ITERATIONS = 3
QUALITY_THRESHOLD = 85
```
- **Zero Infinite Loops:** Every loop execution must guarantee termination within `MAX_ITERATIONS`.

## 5. Security Rules
- **No Hard-coded Secrets:** Never hard-code API keys, credentials, or tokens in source code or documentation.
- **Use Environment Variables:** Load configuration settings using `python-dotenv` from `.env`.
- **Never Commit Environment Files:** Enforce `.env` in `.gitignore`.
- **Input Validation:** Validate all API request payloads using Pydantic models.
- **Sanitize Logging:** Never log sensitive environment variables or authorization headers.

## 6. What To Avoid
- Unnecessary deep learning frameworks (TensorFlow, PyTorch) during MVP.
- Unnecessary database setups (PostgreSQL, MongoDB) during MVP when JSON/in-memory data suffices.
- Monolithic single-file project implementations.
- Infinite AI loops without iteration limits.
- Fabricated or hard-coded ML metrics.
- Hard-coded static AI responses.
- Premature performance optimizations.
- Building features belonging to future roadmap phases.

