"""
Personalized Recommendation Engine for Quantum Algorithm Learning Platform.

This module consumes Phase 3 Learner Intelligence Profiles and curriculum structure
to generate ranked, explainable, personalized learning recommendations.

RECOMMENDATION ARCHITECTURE (Phase 4):
1. Candidate Generation: Rules across topic mastery, prerequisites, risk, skill, and behavior.
2. Candidate Scoring: Explainable transparent priority scoring formula (0.0 to 100.0).
3. Deterministic Critic Validation: Removes duplicates, invalid topics, or inappropriate actions.
4. Ranking & Selection: Sorts candidates by priority score and selects top 5 + next_best_action.
"""

import os
import json
import numpy as np
import pandas as pd


# Standard Topic Key Normalization Map
TOPIC_ID_MAP = {
    "grover": "grovers_algorithm",
    "shor": "shors_algorithm"
}

REVERSE_TOPIC_ID_MAP = {v: k for k, v in TOPIC_ID_MAP.items()}


def get_default_project_root() -> str:
    """Returns absolute path to project root directory."""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))


def load_curriculum(project_root: str = None) -> list[dict]:
    """
    Loads quantum curriculum topic metadata from JSON dataset.
    
    Args:
        project_root: Optional custom path to project root directory.
        
    Returns:
        List of curriculum topic dictionaries.
    """
    if project_root is None:
        project_root = get_default_project_root()
        
    curriculum_path = os.path.join(project_root, "data/curriculum/quantum_topics.json")
    if not os.path.exists(curriculum_path):
        raise FileNotFoundError(f"Curriculum JSON missing at: {curriculum_path}")
        
    with open(curriculum_path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_topic_id(topic_key: str) -> str:
    """Normalizes Phase 3 topic keys to curriculum topic IDs."""
    return TOPIC_ID_MAP.get(topic_key, topic_key)


def denormalize_topic_key(topic_id: str) -> str:
    """Maps curriculum topic IDs back to Phase 3 profile keys."""
    return REVERSE_TOPIC_ID_MAP.get(topic_id, topic_id)


def get_topic_metadata(topic_id: str, curriculum: list[dict]) -> dict | None:
    """Finds topic dictionary in curriculum by topic_id or normalized ID."""
    norm_id = normalize_topic_id(topic_id)
    for topic_dict in curriculum:
        if topic_dict["topic_id"] == norm_id:
            return topic_dict
    return None


def generate_candidates(profile: dict, curriculum: list[dict]) -> list[dict]:
    """
    Stage 1: Generates raw candidate recommendations across all recommendation types.
    
    Args:
        profile: Phase 3 Learner Profile dictionary.
        curriculum: Quantum curriculum list.
        
    Returns:
        List of raw candidate recommendation dictionaries.
    """
    candidates = []
    
    learner_id = profile.get("learner_id", "UNKNOWN_LEARNER")
    skill_level = profile.get("skill_level", "Intermediate")
    risk_status = profile.get("risk_status", "Low Risk")
    perf_score = float(profile.get("predicted_performance", 70.0))
    
    topic_scores = profile.get("topic_scores", {})
    weak_topics = profile.get("topic_weaknesses", [])
    developing_topics = profile.get("topic_developing", [])
    strong_topics = profile.get("topic_strengths", [])
    
    behavior_signals = profile.get("learning_behavior", {}).get("behavior_signals", [])
    signals = profile.get("personalization_signals", {})
    
    # 1. Type: review_weak_topic (For topics < 60)
    for topic_key in weak_topics:
        topic_meta = get_topic_metadata(topic_key, curriculum)
        if topic_meta:
            score = topic_scores.get(topic_key, 50.0)
            candidates.append({
                "recommendation_id": f"REC_WEAK_{topic_meta['topic_id'].upper()}",
                "topic": topic_meta["name"],
                "topic_id": topic_meta["topic_id"],
                "action": f"Review {topic_meta['name']} fundamentals",
                "type": "review_weak_topic",
                "base_priority": 80.0,
                "reason": f"Topic score ({score:.1f}%) is below the reinforcement threshold (60.0%).",
                "skill_level": topic_meta["difficulty"],
                "estimated_effort": "25 mins",
                "confidence": 0.95
            })
            
    # 2. Type: reinforce_prerequisite (Check prerequisites of weak/developing topics)
    for topic_key in weak_topics + developing_topics:
        topic_meta = get_topic_metadata(topic_key, curriculum)
        if topic_meta and topic_meta.get("prerequisites"):
            for prereq_id in topic_meta["prerequisites"]:
                prereq_key = denormalize_topic_key(prereq_id)
                prereq_score = topic_scores.get(prereq_key, 70.0)
                prereq_meta = get_topic_metadata(prereq_id, curriculum)
                
                if prereq_meta and prereq_score < 75.0:
                    candidates.append({
                        "recommendation_id": f"REC_PREREQ_{prereq_meta['topic_id'].upper()}",
                        "topic": prereq_meta["name"],
                        "topic_id": prereq_meta["topic_id"],
                        "action": f"Reinforce prerequisite concept: {prereq_meta['name']}",
                        "type": "reinforce_prerequisite",
                        "base_priority": 90.0,
                        "reason": f"Prerequisite {prereq_meta['name']} (score {prereq_score:.1f}%) requires reinforcement before advancing in {topic_meta['name']}.",
                        "skill_level": prereq_meta["difficulty"],
                        "estimated_effort": "20 mins",
                        "confidence": 0.92
                    })
                    
    # 3. Type: practice_developing_topic (For topics 60-74.99)
    for topic_key in developing_topics:
        topic_meta = get_topic_metadata(topic_key, curriculum)
        if topic_meta:
            score = topic_scores.get(topic_key, 65.0)
            candidates.append({
                "recommendation_id": f"REC_PRACTICE_{topic_meta['topic_id'].upper()}",
                "topic": topic_meta["name"],
                "topic_id": topic_meta["topic_id"],
                "action": f"Practice targeted exercises in {topic_meta['name']}",
                "type": "practice_developing_topic",
                "base_priority": 65.0,
                "reason": f"Topic score ({score:.1f}%) is in the developing range (60-75%). Practice will solidify mastery.",
                "skill_level": topic_meta["difficulty"],
                "estimated_effort": "30 mins",
                "confidence": 0.88
            })
            
    # 4. Type: slow_down_reinforce (High Risk / Elevated Errors)
    if risk_status == "High Risk" or signals.get("high_error_signal", False):
        # Pick the lowest scoring topic
        if topic_scores:
            lowest_topic_key = min(topic_scores, key=topic_scores.get)
            topic_meta = get_topic_metadata(lowest_topic_key, curriculum)
            if topic_meta:
                candidates.append({
                    "recommendation_id": "REC_SLOW_DOWN_FUNDAMENTALS",
                    "topic": topic_meta["name"],
                    "topic_id": topic_meta["topic_id"],
                    "action": f"Slow down and reinforce core fundamentals starting with {topic_meta['name']}",
                    "type": "slow_down_reinforce",
                    "base_priority": 88.0,
                    "reason": f"Learner risk status is {risk_status} with elevated error signals. Focus on foundational reinforcement.",
                    "skill_level": "Beginner",
                    "estimated_effort": "15 mins",
                    "confidence": 0.90
                })
                
    # 5. Type: next_curriculum_topic (Progression)
    # Find first un-mastered topic in curriculum sequence
    for topic_meta in curriculum:
        topic_key = denormalize_topic_key(topic_meta["topic_id"])
        score = topic_scores.get(topic_key, 0.0)
        
        if score < 75.0:
            candidates.append({
                "recommendation_id": f"REC_NEXT_{topic_meta['topic_id'].upper()}",
                "topic": topic_meta["name"],
                "topic_id": topic_meta["topic_id"],
                "action": f"Advance to next curriculum topic: {topic_meta['name']}",
                "type": "next_curriculum_topic",
                "base_priority": 50.0,
                "reason": f"Next logical step in curriculum sequence. Topic {topic_meta['name']} aligns with progression.",
                "skill_level": topic_meta["difficulty"],
                "estimated_effort": "35 mins",
                "confidence": 0.85
            })
            break
            
    # 6. Type: attempt_challenge (For Strong / Advanced learners)
    if skill_level in ("Intermediate", "Advanced") and perf_score >= 70.0:
        for topic_key in strong_topics:
            topic_meta = get_topic_metadata(topic_key, curriculum)
            if topic_meta:
                candidates.append({
                    "recommendation_id": f"REC_CHALLENGE_{topic_meta['topic_id'].upper()}",
                    "topic": topic_meta["name"],
                    "topic_id": topic_meta["topic_id"],
                    "action": f"Attempt an advanced quantum algorithm challenge in {topic_meta['name']}",
                    "type": "attempt_challenge",
                    "base_priority": 40.0,
                    "reason": f"High mastery ({topic_scores.get(topic_key, 80):.1f}%) in {topic_meta['name']}. Learner is ready for challenge exercises.",
                    "skill_level": "Advanced",
                    "estimated_effort": "45 mins",
                    "confidence": 0.82
                })
                
    return candidates


def score_candidate(candidate: dict, profile: dict, curriculum: list[dict]) -> float:
    """
    Stage 2: Computes a transparent, explainable priority score for a candidate (0.0 to 100.0).
    
    Formula:
        priority = base_priority + weakness_bonus + risk_adjustment + skill_alignment + behavior_bonus
    """
    base_priority = candidate.get("base_priority", 50.0)
    topic_id = candidate.get("topic_id")
    topic_key = denormalize_topic_key(topic_id)
    
    topic_scores = profile.get("topic_scores", {})
    topic_score = topic_scores.get(topic_key, 70.0)
    
    risk_status = profile.get("risk_status", "Low Risk")
    risk_prob = float(profile.get("risk_probability", 0.1))
    skill_level = profile.get("skill_level", "Intermediate")
    signals = profile.get("personalization_signals", {})
    
    # 1. Weakness bonus: Lower topic score increases priority
    weakness_bonus = max(0.0, (100.0 - topic_score) * 0.25)
    
    # 2. Risk adjustment: Boost remediation for high risk; penalize challenges
    risk_adj = 0.0
    if risk_status == "High Risk" or risk_prob >= 0.60:
        if candidate["type"] in ("review_weak_topic", "reinforce_prerequisite", "slow_down_reinforce"):
            risk_adj += 15.0
        elif candidate["type"] == "attempt_challenge":
            risk_adj -= 25.0
    elif risk_status == "Moderate Risk":
        if candidate["type"] in ("review_weak_topic", "practice_developing_topic"):
            risk_adj += 8.0
            
    # 3. Skill alignment adjustment
    topic_meta = get_topic_metadata(topic_id, curriculum)
    skill_adj = 0.0
    if topic_meta:
        topic_diff = topic_meta.get("difficulty", "Intermediate")
        if skill_level == topic_diff:
            skill_adj += 5.0
        elif skill_level == "Beginner" and topic_diff == "Advanced":
            skill_adj -= 15.0
            
    # 4. Behavioral bonus
    behavior_bonus = 0.0
    if signals.get("high_error_signal", False) and candidate["type"] in ("review_weak_topic", "reinforce_prerequisite"):
        behavior_bonus += 8.0
    if signals.get("high_learning_activity_signal", False) and candidate["type"] in ("practice_developing_topic", "attempt_challenge"):
        behavior_bonus += 5.0
        
    final_score = base_priority + weakness_bonus + risk_adj + skill_adj + behavior_bonus
    return round(float(np.clip(final_score, 0.0, 100.0)), 2)


def validate_candidate(
    candidate: dict,
    profile: dict,
    curriculum: list[dict],
    accepted_candidates: list[dict]
) -> bool:
    """
    Deterministic Recommendation Critic:
    Validates candidate eligibility and filters out invalid or contradictory recommendations.
    
    Critic Rules:
    1. Topic must exist in curriculum.
    2. Candidate must contain all required schema fields with valid types.
    3. Remove duplicate recommendation actions for the same topic.
    4. Reject basic review recommendations for strong topics (score >= 85) unless prerequisite.
    5. Reject advanced challenges for High Risk learners.
    """
    topic_id = candidate.get("topic_id")
    topic_meta = get_topic_metadata(topic_id, curriculum)
    
    # Critic Rule 1: Topic must exist in curriculum
    if not topic_meta:
        return False
        
    # Critic Rule 2: Schema completeness
    required_fields = ["recommendation_id", "topic", "action", "type", "priority", "reason", "skill_level", "estimated_effort", "confidence"]
    for f in required_fields:
        if f not in candidate:
            return False
            
    # Critic Rule 3: Deduplication (Same action or same topic/type combination)
    for existing in accepted_candidates:
        if existing["action"] == candidate["action"]:
            return False
        if existing["topic_id"] == candidate["topic_id"] and existing["type"] == candidate["type"]:
            return False
            
    # Critic Rule 4: Reject unnecessary review for high mastery (> 85%) topics
    topic_key = denormalize_topic_key(topic_id)
    topic_score = profile.get("topic_scores", {}).get(topic_key, 70.0)
    if topic_score >= 85.0 and candidate["type"] == "review_weak_topic":
        return False
        
    # Critic Rule 5: Reject challenge recommendations for High Risk learners
    risk_status = profile.get("risk_status", "Low Risk")
    if risk_status == "High Risk" and candidate["type"] == "attempt_challenge":
        return False
        
    return True


def remove_duplicates(candidates: list[dict]) -> list[dict]:
    """Removes exact duplicate recommendation dictionaries."""
    seen_ids = set()
    unique = []
    for c in candidates:
        if c["recommendation_id"] not in seen_ids:
            seen_ids.add(c["recommendation_id"])
            unique.append(c)
    return unique


def generate_recommendations(
    profile: dict,
    curriculum: list[dict] = None,
    project_root: str = None,
    max_recommendations: int = 5
) -> dict:
    """
    Full pipeline to generate ranked personalized recommendations for a Phase 3 learner profile.
    
    Args:
        profile: Phase 3 Learner Profile object.
        curriculum: Optional pre-loaded curriculum list.
        project_root: Optional custom path to project root.
        max_recommendations: Maximum number of top recommendations to return (default 5).
        
    Returns:
        JSON-serializable recommendation result dictionary.
    """
    if curriculum is None:
        curriculum = load_curriculum(project_root)
        
    learner_id = str(profile.get("learner_id", "UNKNOWN_LEARNER"))
    
    # 1. Stage 1: Candidate Generation
    raw_candidates = generate_candidates(profile, curriculum)
    
    # 2. Stage 2: Scoring
    scored_candidates = []
    for candidate in raw_candidates:
        cand_copy = candidate.copy()
        cand_copy["priority"] = score_candidate(cand_copy, profile, curriculum)
        scored_candidates.append(cand_copy)
        
    # 3. Sort candidates descending by priority score
    scored_candidates.sort(key=lambda x: x["priority"], reverse=True)
    
    # 4. Stage 3: Deterministic Critic Validation & Selection
    validated_recommendations = []
    for candidate in scored_candidates:
        if validate_candidate(candidate, profile, curriculum, validated_recommendations):
            # Clean candidate fields before returning
            clean_rec = {
                "recommendation_id": candidate["recommendation_id"],
                "topic": candidate["topic"],
                "topic_id": candidate["topic_id"],
                "action": candidate["action"],
                "type": candidate["type"],
                "priority": candidate["priority"],
                "reason": candidate["reason"],
                "skill_level": candidate["skill_level"],
                "estimated_effort": candidate["estimated_effort"],
                "confidence": candidate["confidence"]
            }
            validated_recommendations.append(clean_rec)
            
        if len(validated_recommendations) >= max_recommendations:
            break
            
    # 5. Extract Next-Best-Action (Highest ranked recommendation)
    next_best_action = None
    if validated_recommendations:
        top_rec = validated_recommendations[0]
        next_best_action = {
            "topic": top_rec["topic"],
            "topic_id": top_rec["topic_id"],
            "action": top_rec["action"],
            "type": top_rec["type"],
            "priority": top_rec["priority"],
            "reason": top_rec["reason"]
        }
        
    return {
        "learner_id": learner_id,
        "recommendations": validated_recommendations,
        "next_best_action": next_best_action
    }
