"""
Batch Recommendation Generator for Quantum Algorithm Learning Platform.

This script processes batch Phase 3 learner profiles (data/intelligence/learner_profiles.json)
through the Phase 4 Personalized Recommendation Engine to produce recommendations JSON and CSV artifacts.
"""

import os
import sys
import json
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.recommendation.recommendation_engine import load_curriculum, generate_recommendations


def generate_batch_recommendations(
    profiles_json_path: str = None,
    output_dir: str = None,
    project_root: str = None
) -> tuple[list[dict], pd.DataFrame]:
    """
    Generates structured personalized recommendations for all learner profiles.
    
    Args:
        profiles_json_path: Path to input profiles JSON.
        output_dir: Path to output directory.
        project_root: Path to project root.
        
    Returns:
        Tuple of (list of recommendation dicts, DataFrame of recommendation summaries).
    """
    if project_root is None:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
        
    if profiles_json_path is None:
        profiles_json_path = os.path.join(project_root, "data/intelligence/learner_profiles.json")
        
    if output_dir is None:
        output_dir = os.path.join(project_root, "data/recommendations")
        
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading Phase 3 profiles from: {profiles_json_path}")
    with open(profiles_json_path, "r", encoding="utf-8") as f:
        profiles = json.load(f)
    print(f"Loaded {len(profiles)} learner profiles.")
    
    curriculum = load_curriculum(project_root)
    
    results = []
    summary_rows = []
    
    for profile in profiles:
        rec_result = generate_recommendations(profile, curriculum=curriculum, project_root=project_root)
        results.append(rec_result)
        
        recs = rec_result["recommendations"]
        nba = rec_result.get("next_best_action")
        
        summary_rows.append({
            "learner_id": rec_result["learner_id"],
            "recommendation_count": len(recs),
            "top_topic": nba["topic"] if nba else "N/A",
            "top_action": nba["action"] if nba else "N/A",
            "top_type": nba["type"] if nba else "N/A",
            "top_priority": nba["priority"] if nba else 0.0
        })
        
    # Save JSON recommendations
    json_path = os.path.join(output_dir, "learner_recommendations.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"[SUCCESS] Saved {len(results)} recommendation outputs to: {json_path}")
    
    # Save CSV summary
    df_summary = pd.DataFrame(summary_rows)
    csv_path = os.path.join(output_dir, "recommendation_summary.csv")
    df_summary.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Saved recommendation summary CSV to: {csv_path}")
    
    return results, df_summary


if __name__ == "__main__":
    generate_batch_recommendations()

