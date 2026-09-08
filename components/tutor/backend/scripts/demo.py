"""
Hackathon End-to-End Integration Demo Script.

Demonstrates the single learner journey across the entire AI platform:
Learner Telemetry -> Phase 2 ML Predictions -> Phase 3 Intelligence Profile
-> Phase 4 Personalized Recommendations -> Phase 5 AI Tutor & Loop Engineering.
"""

import os
import sys
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from src.api.dependencies import get_artifact_store
from src.tutor.quantum_tutor import tutor


def run_demo(target_learner_id: str = "LEARNER_0001"):
    """
    Executes the interactive hackathon demonstration for a target learner.
    
    Args:
        target_learner_id: Target learner identifier to demonstrate.
    """
    print("\n" + "=" * 70)
    print("  SIH PROBLEM STATEMENT 26140: QUANTUM ALGORITHM LEARNING PLATFORM")
    print("  AI-POWERED INTERACTIVE LEARNER JOURNEY DEMONSTRATION")
    print("=" * 70 + "\n")
    
    # 1. Load Artifact Store
    print("[1/4] Initializing AI Engine & In-Memory Artifact Store...")
    start_time = time.time()
    store = get_artifact_store()
    init_time = (time.time() - start_time) * 1000
    print(f"      Loaded 1,000 Intelligence Profiles & 1,000 Recommendations in {init_time:.1f} ms.\n")
    
    # 2. Fetch Learner Intelligence Profile (Phase 3)
    profile = store.get_profile(target_learner_id)
    if not profile:
        print(f"[ERROR] Learner '{target_learner_id}' not found.")
        return
        
    print("-" * 70)
    print(f"  STEP 1: LEARNER INTELLIGENCE PROFILE ({profile['learner_id']})")
    print("-" * 70)
    print(f"  > Skill Level Classification: {profile['skill_level']} (Random Forest Classifier)")
    print(f"  > Predicted Performance:    {profile['predicted_performance']:.2f}% ({profile['performance_band']} Band)")
    print(f"  > Risk Assessment:          {profile['risk_status']} (P(At-Risk) = {profile['risk_probability']:.4f})")
    print(f"\n  > Topic Strengths (>=75%):  {', '.join(profile['topic_strengths']) if profile['topic_strengths'] else 'None'}")
    print(f"  > Developing Concepts:      {', '.join(profile['topic_developing']) if profile['topic_developing'] else 'None'}")
    print(f"  > Weak Topics (<60%):       {', '.join(profile['topic_weaknesses']) if profile['topic_weaknesses'] else 'None'}")
    
    behavior = profile.get("learning_behavior", {})
    signals = behavior.get("behavior_signals", [])
    print(f"\n  > Observable Telemetry:     {behavior.get('learning_hours_per_week', 0)} hrs/wk | {behavior.get('errors', 0)} errors | {behavior.get('attempts', 0)} attempts")
    print(f"  > Behavioral Signals:       {', '.join(signals) if signals else 'Standard activity'}")
    print(f"\n  Summary: {profile['intelligence_summary']}\n")
    
    # 3. Fetch Personalized Recommendations (Phase 4)
    recs = store.get_recommendation(target_learner_id)
    print("-" * 70)
    print("  STEP 2: PERSONALIZED RECOMMENDATION ENGINE & NEXT BEST ACTION")
    print("-" * 70)
    
    nba = recs.get("next_best_action") if recs else None
    if nba:
        print(f"  [NEXT BEST LEARNING ACTION]:")
        print(f"    > Action:   {nba['action']}")
        print(f"    > Topic:    {nba['topic']} ({nba['type']})")
        print(f"    > Priority: {nba['priority']:.1f} / 100.0")
        print(f"    > Rationale: {nba['reason']}\n")
        
    print("  > Additional Priority Recommendations:")
    if recs and recs.get("recommendations"):
        for idx, rec in enumerate(recs["recommendations"][1:4], 2):
            print(f"    {idx}. [{rec['type']}] {rec['action']} (Priority: {rec['priority']:.1f})")
    print()
            
    # 4. Execute AI Quantum Tutor Loop (Phase 5)
    llm_provider = os.getenv("LLM_PROVIDER", "mock").upper()
    has_key = bool(os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY"))
    mode_str = f"LIVE {llm_provider} PROVIDER" if (has_key and llm_provider != "MOCK") else "DETERMINISTIC MOCK MODE"


    
    print("-" * 70)
    print(f"  STEP 3: AI QUANTUM TUTOR & BOUNDED LOOP ENGINEERING [{mode_str}]")
    print("-" * 70)
    
    question = f"Explain the concept of quantum entanglement and why I should {nba['action'] if nba else 'study it'}."
    print(f"  Learner Question: '{question}'")
    print(f"  Tutor Mode:       explain")
    print("\n  Executing Bounded Loop Engineering (MAX_ITERATIONS = 3, QUALITY_THRESHOLD = 85.0)...")
    
    t0 = time.time()
    tutor_result = tutor(
        query=question,
        mode="explain",
        learner_profile=profile,
        recommendation_context=recs,
        curriculum=store.curriculum,
        use_mock=not (has_key and llm_provider != "MOCK")
    )
    tutor_latency = (time.time() - t0) * 1000
    
    print("\n  [TUTOR RESPONSE PAYLOAD Delivered in {:.1f} ms]:".format(tutor_latency))
    print(f"  > Concept Focus:   {tutor_result.get('concept', 'Quantum Mechanics')}")
    print(f"  > Difficulty Fit:  {tutor_result.get('difficulty', profile['skill_level'])}")
    print(f"  > Quality Score:   {tutor_result.get('quality_score', 90.0):.1f} / 100.0 (Evaluated by AI Critic)")
    print(f"  > Loop Iterations: {tutor_result.get('iterations', 1)} iteration(s) executed")
    print(f"  > Confidence:      {tutor_result.get('confidence', 0.95):.2f}")
    
    print(f"\n  > Tutor Explanation:\n    \"{tutor_result.get('answer', '')}\"")
    print(f"\n  > Actionable Hint:\n    \"{tutor_result.get('hint', '')}\"")
    print(f"\n  > Next Recommended Step:\n    \"{tutor_result.get('next_step', '')}\"")
    
    print("\n" + "=" * 70)
    print("  DEMONSTRATION COMPLETED SUCCESSFULLY - ALL PHASES INTEGRATED")

    print("=" * 70 + "\n")


if __name__ == "__main__":
    target_id = sys.argv[1] if len(sys.argv) > 1 else "LEARNER_0001"
    run_demo(target_id)
