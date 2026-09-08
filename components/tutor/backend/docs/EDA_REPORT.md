# Exploratory Data Analysis (EDA) Report

## 1. Dataset Overview
This report documents the exploratory data analysis conducted on the synthetic learner dataset (`data/raw/learner_data.csv`) generated for the **AI-Based Interactive Quantum Algorithm Learning Platform** (SIH 26140). 

> [!NOTE]
> **Synthetic Data Disclaimer:** All observations and statistical patterns documented in this report pertain strictly to the synthetic prototype dataset generated in Phase 1A. They do not represent empirical real-world human learner data.

- **Total Records:** 1,000 synthetic learner telemetry profiles.
- **Total Features:** 22 columns (1 categorical, 17 numerical features, 1 identifier, 3 derived target variables).
- **Curriculum Scope:** 9 quantum computing topics across Beginner, Intermediate, and Advanced difficulty tiers.

---

## 2. Data Quality Findings
Empirical verification confirms high data cleanliness suitable for machine learning development:
- **Missing Values:** `0` missing entries across all columns (100% complete).
- **Duplicate Rows:** `0` duplicate rows detected.
- **Duplicate Identifiers:** `0` duplicate `learner_id` entries (1,000 unique keys).
- **Range Validity:** 100% of score features fall strictly within $[0.0, 100.0]$.
- **Outlier Check:** All numerical values conform to defined domain bounds (`attempts` $\in [1, 8]$, `errors` $\in [0, 16]$, `time_spent_minutes` $\in [10.8, 180.0]$).

---

## 3. Performance Distribution Findings

```
  Assessment Type    Mean     Median    Std Dev    Min     Max
 ─────────────────────────────────────────────────────────────
  Quiz Score        75.06%    75.60%     17.89    16.90%  100.0%
  Coding Score      60.78%    61.25%     18.94     2.10%  100.0%
  Challenge Score   31.74%    31.00%     19.25     0.00%   86.90%
  Overall Score     63.11%    62.80%     15.88    14.90%   96.70%
```

### Insights:
- **Quiz Performance:** Highest mean score ($75.06\%$) reflecting foundational concept familiarity.
- **Coding & Practical Performance:** Moderate mean ($60.78\%$) with normal distribution around $61.25\%$.
- **Challenge Performance:** Lowest mean score ($31.74\%$), providing strong variance for differentiating Advanced learners.

---

## 4. Topic Performance & Relative Difficulty

Within this synthetic dataset, topic performance aligns with curriculum difficulty tiers:

```
  Topic Name           Difficulty Tier    Mean Score    Median Score    Std Dev
 ───────────────────────────────────────────────────────────────────────────────
  Qubits               Beginner             75.80%         76.65%        13.75
  Superposition        Beginner             75.82%         75.90%        13.82
  Quantum Measurement  Beginner             75.92%         76.00%        13.81
  Quantum Gates        Intermediate         63.68%         63.80%        17.56
  Entanglement         Intermediate         63.69%         63.80%        17.56
  Bell States          Intermediate         63.44%         63.50%        17.42
  Quantum Circuits     Intermediate         63.73%         63.25%        17.40
  Grover's Algorithm   Advanced             50.54%         49.95%        20.90
  Shor's Algorithm     Advanced             49.93%         50.00%        21.05
```

### Difficulty Insights:
- **Beginner Tier (Qubits, Superposition, Measurement):** High average performance ($\approx 75.8\%$) with low standard deviation ($\approx 13.8$).
- **Intermediate Tier (Gates, Entanglement, Bell States, Circuits):** Moderate average performance ($\approx 63.6\%$) with increased variance.
- **Advanced Tier (Grover's & Shor's):** Lowest average performance ($\approx 50.2\%$) with highest variance ($\approx 21.0$), establishing strong diagnostic capability for Weak Concept Detection.

---

## 5. Target Distribution Analysis

### 1. Continuous Performance Target (`overall_score`)
- **Distribution:** Symmetric bell-shaped distribution.
- **Mean:** $63.11\%$, **Median:** $62.80\%$, **Std:** $15.88$.
- **Suitability:** Excellent target for Linear Regression performance prediction models.

### 2. Binary Risk Target (`learning_risk`)
- **Class 0 (On-Track):** 676 learners ($67.60\%$)
- **Class 1 (At-Risk):** 324 learners ($32.40\%$)
- **Class Balance Ratio:** $\approx 2:1$, representing a realistic, well-balanced distribution suitable for Logistic Regression without requiring extreme resampling.

### 3. Multi-Class Skill Level Target (`skill_level`)
- **Intermediate:** 428 learners ($42.80\%$)
- **Beginner:** 389 learners ($38.90\%$)
- **Advanced:** 183 learners ($18.30\%$)
- **Class Balance:** Healthy distribution with expected pyramid structure (fewer Advanced learners, balanced Beginner/Intermediate cohorts).

---

## 6. Correlation Analysis

Strong positive and negative Pearson correlation coefficients ($r$) were observed:

```
  Feature Pair                                Correlation (r)    Direction
 ─────────────────────────────────────────────────────────────────────────────
  Quiz Score vs. Overall Score                    +0.949        Strong Positive
  Coding Score vs. Overall Score                  +0.918        Strong Positive
  Grover / Shor Score vs. Overall Score           +0.921        Strong Positive
  Challenge Score vs. Overall Score               +0.891        Strong Positive
  Modules Completed vs. Overall Score             +0.883        Strong Positive
  Learning Hours/Week vs. Overall Score           +0.863        Strong Positive
  Time Spent Minutes vs. Modules Completed        +0.892        Strong Positive
  Attempts vs. Overall Score                      -0.696        Moderate Negative
  Errors vs. Overall Score                        -0.690        Moderate Negative
```

### Key Analytical Insights:
- **Study Effort & Completion:** Weekly learning hours ($r = 0.863$) and modules completed ($r = 0.883$) strongly predict overall mastery.
- **Struggle Telemetry:** High attempt counts ($r = -0.696$) and error rates ($r = -0.690$) correlate negatively with overall score, serving as reliable signals for early risk intervention.

---

## 7. Learner Profile Observations

Grouping telemetry across synthetic skill tiers reveals distinct cohort characteristics:

```
  Skill Tier      Mean Hours/Wk    Mean Modules    Mean Quiz    Mean Coding    Mean Errors
 ──────────────────────────────────────────────────────────────────────────────────────────
  Beginner            8.20             3.21          59.80%       44.60%          9.12
  Intermediate       13.80             5.85          79.40%       65.80%          5.84
  Advanced           18.90             8.35          93.20%       83.50%          3.21
```

- **Beginner Cohort:** Characterized by lower weekly hours ($8.20$), higher errors ($9.12$), and lower coding scores ($44.60\%$).
- **Advanced Cohort:** Demonstrates high effort ($18.90$ hrs/wk), high module completion ($8.35$), low error rate ($3.21$), and high mastery across advanced topics.

---

## 8. Machine Learning (ML) Readiness Assessment

The dataset is **FULLY READY** for Phase 2 machine learning model development based on the following criteria:

1. **Sample Size:** 1,000 instances provide sufficient data volume for 80/20 train/test splitting ($800$ train / $200$ test).
2. **Feature Quality:** $0$ missing values, $0$ duplicates, and clean numerical scaling bounds.
3. **Class Balance:** Balanced binary risk ($67.6\% / 32.4\%$) and multi-class skill distribution ($42.8\% / 38.9\% / 18.3\%$).
4. **Predictive Signal:** Strong linear and monotonic correlations ($r > 0.8$) exist between telemetry features and target labels.
5. **Leakage Protection:** Target variables are explicitly isolated, ensuring zero data leakage during model training.

---

## 9. Important Limitations
1. **Synthetic Nature:** Data is generated via mathematical latent factor models and cannot replace real human usability testing.
2. **Deterministic Rules:** Derived labels (`learning_risk`, `skill_level`) are rule-based, meaning trained models will learn these underlying decision logic functions.
3. **Static Snapshot:** Telemetry represents a single snapshot state per learner rather than a dynamic time-series log.

