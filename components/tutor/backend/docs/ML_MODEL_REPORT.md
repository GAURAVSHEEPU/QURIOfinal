# Classical Machine Learning Layer Report (Phase 2)

## 1. Classical ML Architecture Overview

The AI-Based Interactive Quantum Algorithm Learning Platform relies on an explainable, lightweight, classical machine learning intelligence layer built with **Scikit-Learn**. 

This layer processes normalized learner interaction telemetry (preprocessed by `data/processed/ml_preprocessor.joblib`) to estimate three distinct aspects of student mastery:
1. **Expected Performance Predictor:** Continuous overall score estimation ($\text{overall\_score} \in [0.0, 100.0]$).
2. **Learner Risk Predictor:** Early-warning risk classification ($\text{learning\_risk} \in \{0, 1\}$) with calibrated class probabilities.
3. **Skill Level Classifier:** Multi-class student mastery tiering ($\text{skill\_level} \in \{\text{Beginner}, \text{Intermediate}, \text{Advanced}\}$).

```
                             [ Raw Learner Telemetry Input ]
                                            │
                                            ▼
                       [ Preprocessor: ml_preprocessor.joblib ]
                                            │
                                            ▼
                    [ Transformed Feature Vector X (20-dim) ]
                                            │
       ┌────────────────────────────────────┼────────────────────────────────────┐
       │                                    │                                    │
       ▼                                    ▼                                    ▼
[ Performance Predictor ]          [ Risk Predictor ]                 [ Skill Classifier ]
 LinearRegression                   LogisticRegression                 RandomForestClassifier
 Target: overall_score              Target: learning_risk              Target: skill_level
 Output: 72.75%                     Output: On-Track (P=1.0)           Output: Intermediate
```

---

## 2. Model Inventory & Registry Summary

| Model Name | Algorithm | Task Type | Target Variable | Artifact Location | Status | Quality Gate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `performance_predictor` | `LinearRegression` | Regression | `overall_score` | `data/models/performance_linear_regression.joblib` | `prototype_validated` | **PASSED** |
| `learning_risk_predictor` | `LogisticRegression` | Binary Classification | `learning_risk` | `data/models/learning_risk_logistic_regression.joblib` | `prototype_validated` | **PASSED** |
| `skill_classifier` (Preferred) | `RandomForestClassifier` | Multi-Class | `skill_level` | `data/models/skill_random_forest.joblib` | `prototype_validated` | **PASSED** |
| `skill_decision_tree` (Fallback) | `DecisionTreeClassifier` | Multi-Class | `skill_level` | `data/models/skill_decision_tree.joblib` | `prototype_validated` | **PASSED** |

---

## 3. Consolidated Evaluation Metrics

All models were evaluated on the untouched 200-sample test set ($X_{\text{test}}$, $20\%$ partition of the 1,000-sample synthetic dataset, `random_state=42`).

### Regression Model (Performance Prediction)

| Model | Target | MAE | MSE | RMSE | $R^2$ | Baseline MAE (Mean) | Baseline $R^2$ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear Regression** | `overall_score` | **0.0243** | **0.0008** | **0.0285** | **1.0000** | 13.4785 | -0.0002 |

### Classification Models (Risk & Skill)

| Model | Task | Target | Accuracy | Precision | Recall | F1-Score | Baseline Accuracy | Baseline F1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | Binary Risk | `learning_risk` | **0.9950** | **1.0000** | **0.9841** | **0.9920** | 0.6850 | 0.0000 |
| **Decision Tree** (depth=5) | Multi-Class | `skill_level` | **0.9350** | **0.9364** | **0.9350** | **0.9351** | 0.4300 | 0.2586 |
| **Random Forest** (n=100) | Multi-Class | `skill_level` | **0.9450** | **0.9484** | **0.9450** | **0.9442** | 0.4300 | 0.2586 |

---

## 4. Baseline Comparisons & Performance Analysis

1. **Performance Model vs Baseline:**
   - The Dummy Mean Baseline achieved $\text{MAE} = 13.48$ and $R^2 = -0.0002$.
   - Linear Regression achieved $\text{MAE} = 0.0243$ and $R^2 = 1.0000$, demonstrating near-perfect linear recovery of student performance scores.
2. **Learning Risk Model vs Baseline:**
   - The Dummy Most-Frequent Baseline achieved $\text{Accuracy} = 68.50\%$ but missed $100\%$ of At-Risk learners ($\text{Recall} = 0.0, \text{F1} = 0.0$).
   - Logistic Regression achieved $\text{Accuracy} = 99.50\%$, $\text{Precision} = 100.0\%$, and $\text{Recall} = 98.41\%$ on the At-Risk class (detecting 62 out of 63 struggling learners).
3. **Skill Classification Models vs Baseline:**
   - The Dummy Most-Frequent Baseline achieved $\text{Accuracy} = 43.00\%$ ($\text{F1} = 0.2586$).
   - Both Decision Tree ($93.50\%$) and Random Forest ($94.50\%$) dramatically outperformed the baseline across all 3 skill classes (`Beginner`, `Intermediate`, `Advanced`).

---

## 5. Skill Model Selection & Justification

- **Selected Primary Model:** **Random Forest Classifier** (`skill_random_forest.joblib`)
- **Fallback / Interpretability Model:** **Decision Tree Classifier** (`skill_decision_tree.joblib`)
- **Evidence for Selection:**
  1. **Superior Accuracy & F1:** Random Forest achieved higher test accuracy ($94.50\%$ vs $93.50\%$) and higher weighted F1-score ($94.42\%$ vs $93.51\%$).
  2. **Zero False Positives for Advanced Tier:** Random Forest achieved $100.0\%$ precision on Advanced learners (vs $91.18\%$ for Decision Tree).
  3. **Ensemble Smoothness:** Random Forest combines 100 trees to eliminate single-split variance, while the single Decision Tree ($max\_depth=5$) remains available as a transparent fallback visualization graph (`plots/skill_decision_tree.png`).

---

## 6. Interpretability & Feature Importance Rankings

### Linear Regression Coefficients (Top Predictors of Performance):
- `coding_score` ($+3.0090$): Strongest positive contributor to overall score.
- `quiz_score` ($+2.8197$): Second strongest positive contributor.
- `challenge_score` ($+1.5306$): Positive contributor.

### Logistic Regression Log-Odds Coefficients (Top Risk Signals):
- `quiz_score` ($-2.1561$): Higher quiz score decreases log-odds of risk.
- `coding_score` ($-2.0539$): Higher coding score decreases log-odds of risk.
- `errors` ($+0.6751$): Higher exercise errors increase log-odds of risk.

### Random Forest Feature Importances (Top Skill Tiers Drivers):
1. `quiz_score` ($13.99\%$)
2. `grover_score` ($13.83\%$)
3. `shor_score` ($13.72\%$)
4. `modules_completed` ($12.30\%$)
5. `coding_score` ($11.74\%$)

---

## 7. End-to-End Inference Compatibility Verification

The reusable validation engine [`src/models/validate_models.py`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/src/models/validate_models.py) performed end-to-end integration testing:
- **Raw Sample Input:** Quiz Score = 82.0%, Coding Score = 78.5%, Hours = 14.5 hrs/week.
- **Preprocessor Transformation (`ml_preprocessor.joblib`):** Output shape `(1, 20)`.
- **Inference Results:**
  - `performance_linear_regression`: Predicted Overall Score = **72.75%**
  - `learning_risk_logistic_regression`: Predicted Risk = **0 (On-Track)** ($P(\text{On-Track}) = 1.0000$)
  - `skill_random_forest`: Predicted Skill Level = **Intermediate**
- **Result:** 100% clean execution without dimensional mismatch or non-finite exceptions.

---

## 8. Limitations & Synthetic Data Disclosure

> [!IMPORTANT]
> **Synthetic Data Disclosure:**
> All models in this prototype were trained and evaluated exclusively on a seed-reproducible synthetic dataset ($N=1000$). Ground truth targets (`overall_score`, `learning_risk`, `skill_level`) were generated using mathematical latent-ability formulations.
> 
> **Limitations:**
> 1. Results demonstrate model learning capacity on synthetic telemetry rules, but do NOT establish real-world student prediction accuracy.
> 2. Regression coefficients and Gini feature importances indicate model-based associations, NOT real-world causal factors.
> 3. Model predictions must be treated as educational decision-support recommendations rather than unchallengeable student evaluations.
> 4. Real-world deployment requires retraining on anonymized, consent-given human interaction logs.

---

## 9. Phase 2 Completion Certification

Phase 2 Classical Machine Learning layer is **100% COMPLETE, VALIDATED, AND PERSISTED**.

- **Model Registry:** [`data/models/model_registry.json`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/data/models/model_registry.json)
- **Metrics Summary CSV:** [`data/models/model_metrics_summary.csv`](file:///c:/Users/Samarth%20Singh/Desktop/quantum/data/models/model_metrics_summary.csv)
- **Comparison Visualizations:** `data/models/plots/model_comparison.png`
- **Next Phase:** Phase 3 — Learner Profile & Weak Concept Detector.

