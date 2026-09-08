# Personalized Recommendation Engine (Phase 4)

## 1. Purpose & Architecture Overview

The **Personalized Recommendation Engine** is a deterministic, explainable decision-support module that consumes structured Phase 3 Learner Profiles and curriculum structure (`data/curriculum/quantum_topics.json`) to answer:

> **"What specific learning actions should this student take next to optimize their quantum computing mastery?"**

It operates entirely without machine learning retraining or non-deterministic LLM calls, ensuring 100% reproducible, explainable, and fast (<1ms) recommendation ranking.

```
                         [ Phase 3 Learner Profile JSON ]
                                        │
                                        ▼
                  [ Candidate Generation (Stage 1) ]
                   - Topic-based (weak, developing)
                   - Prerequisite-aware (dependency checks)
                   - Risk-aware (slow-down vs challenge)
                   - Behavior-aware (error signals)
                                        │
                                        ▼
                  [ Candidate Scoring Engine (Stage 2) ]
                   - Transparent Priority Score (0-100)
                   - Weakness, Risk, Skill, Behavior Adjustments
                                        │
                                        ▼
               [ Deterministic Critic / Validation Loop ]
                   - Curriculum existence check
                   - Schema & priority validation
                   - Deduplication & appropriateness filter
                                        │
                                        ▼
               [ Ranking & Next-Best-Action Selection ]
                   - Returns Top 5 Recommendations
                   - Identifies next_best_action
                                        │
                                        ▼
                    [ Structured Recommendations JSON ]
```

---

## 2. Recommendation Schema (JSON Contract)

```json
{
  "learner_id": "LEARNER_0001",
  "recommendations": [
    {
      "recommendation_id": "REC_PREREQ_QUANTUM_CIRCUITS",
      "topic": "Quantum Circuits",
      "topic_id": "quantum_circuits",
      "action": "Reinforce prerequisite concept: Quantum Circuits",
      "type": "reinforce_prerequisite",
      "priority": 100.0,
      "reason": "Prerequisite Quantum Circuits (score 61.3%) requires reinforcement before advancing in Grover's Algorithm.",
      "skill_level": "Intermediate",
      "estimated_effort": "20 mins",
      "confidence": 0.92
    },
    {
      "recommendation_id": "REC_WEAK_GROVERS_ALGORITHM",
      "topic": "Grover's Algorithm",
      "topic_id": "grovers_algorithm",
      "action": "Review Grover's Algorithm fundamentals",
      "type": "review_weak_topic",
      "priority": 90.0,
      "reason": "Topic score (59.9%) is below the reinforcement threshold (60.0%).",
      "skill_level": "Advanced",
      "estimated_effort": "25 mins",
      "confidence": 0.95
    }
  ],
  "next_best_action": {
    "topic": "Quantum Circuits",
    "topic_id": "quantum_circuits",
    "action": "Reinforce prerequisite concept: Quantum Circuits",
    "type": "reinforce_prerequisite",
    "priority": 100.0,
    "reason": "Prerequisite Quantum Circuits (score 61.3%) requires reinforcement before advancing in Grover's Algorithm."
  }
}
```

---

## 3. Supported Recommendation Types

| Recommendation Type | Base Weight | Primary Trigger / Condition | Action Description |
| :--- | :--- | :--- | :--- |
| `reinforce_prerequisite` | **90.0** | Prerequisite topic score $< 75\%$ required before higher topic | *"Reinforce prerequisite concept: [Topic]"* |
| `slow_down_reinforce` | **88.0** | High Risk status OR elevated error frequency ($\ge 8$) | *"Slow down and reinforce core fundamentals starting with [Topic]"* |
| `review_weak_topic` | **80.0** | Topic score $< 60.0\%$ | *"Review [Topic] fundamentals"* |
| `practice_developing_topic` | **65.0** | Topic score $60.0\% - 74.99\%$ | *"Practice targeted exercises in [Topic]"* |
| `next_curriculum_topic` | **50.0** | Un-mastered topic ($< 75\%$) next in sequence | *"Advance to next curriculum topic: [Topic]"* |
| `attempt_challenge` | **40.0** | Topic score $\ge 75.0\%$ for Intermediate/Advanced learners | *"Attempt an advanced quantum algorithm challenge in [Topic]"* |

---

## 4. Candidate Generation & Transparent Scoring Formula

### Stage 1: Candidate Generation
Candidates are generated across 6 distinct logic channels:
1. **Topic Weaknesses:** Scans `topic_weaknesses` ($<60\%$) for direct review recommendations.
2. **Prerequisites:** Traverses `prerequisites` in `quantum_topics.json`. If a higher topic is weak/developing and its prerequisite score is $<75\%$, a prerequisite reinforcement candidate is injected.
3. **Topic Practice:** Scans `topic_developing` ($60-74.99\%$) for practice candidates.
4. **Risk Mitigations:** If `risk_status == "High Risk"` or `high_error_signal == True`, injects foundational slow-down candidates.
5. **Progression:** Selects the first un-mastered topic in sequential curriculum order.
6. **Challenges:** Scans `topic_strengths` ($\ge 75\%$) for advanced challenge candidates (if not High Risk).

### Stage 2: Scoring Formula
Each candidate receives a transparent priority score bounded in $[0.0, 100.0]$:

$$\text{Priority Score} = \text{Base Weight} + \text{Weakness Bonus} + \text{Risk Adjustment} + \text{Skill Alignment} + \text{Behavior Bonus}$$

- **Weakness Bonus:** $\max(0, (100 - \text{topic\_score}) \times 0.25)$
- **Risk Adjustment:**
  - High Risk: $+15.0$ for remediation/prerequisites; $-25.0$ for challenges.
  - Moderate Risk: $+8.0$ for remediation.
- **Skill Alignment:** $+5.0$ if candidate difficulty matches student `skill_level`; $-15.0$ if Beginner assigned Advanced topic.
- **Behavior Bonus:** $+8.0$ for review if `high_error_signal`; $+5.0$ for practice if `high_learning_activity_signal`.

---

## 5. Deterministic Critic & Validation Loop

Before candidates are ranked, the **Deterministic Critic** (`validate_candidate()`) evaluates eligibility:
1. **Curriculum Verification:** Rejects any recommendation whose `topic_id` does not exist in `quantum_topics.json`.
2. **Schema & Field Verification:** Confirms all 9 required schema fields are present with valid types.
3. **Deduplication:** Filters out duplicate recommendation actions or duplicate topic-type combinations.
4. **Mastery Filter:** Rejects basic review recommendations for topics with score $\ge 85.0\%$ unless required as a prerequisite.
5. **Risk Safety Filter:** Rejects `attempt_challenge` recommendations for High Risk learners.

---

## 6. How Phase 5 (AI Tutor) Should Consume Recommendations

Phase 5 AI Tutor & Critic consumes the output of Phase 4:
```python
recommendation_result = generate_recommendations(profile)
next_action = recommendation_result["next_best_action"]

prompt_context = {
    "topic": next_action["topic"],
    "action": next_action["action"],
    "reason": next_action["reason"],
    "skill_level": profile["skill_level"],
    "weak_topics": profile["topic_weaknesses"]
}

# Pass prompt_context to Loop Engineering AI Tutor & Critic (Phase 5)
```

---

## 7. Important Limitations & Synthetic Data Disclosure

> [!IMPORTANT]
> **Synthetic Data Disclosure:**
> Recommendations are generated based on Phase 3 profiles derived from synthetic learner records ($N=1000$).
> 
> **Limitations:**
> 1. Priority scoring formulas are prototype ranking heuristics designed for hackathon demonstration.
> 2. Recommendation rules depend on curriculum structure defined in `quantum_topics.json`.
> 3. Recommendations serve as decision-support guidance rather than mandatory learning restrictions.
> 4. Real-world deployment requires validating recommendation efficacy against human learning gain outcomes.

