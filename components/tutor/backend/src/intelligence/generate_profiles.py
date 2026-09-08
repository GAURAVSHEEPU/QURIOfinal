"""
Batch Profile Generator for Quantum Algorithm Learning Platform.

This script processes the raw synthetic dataset (data/raw/learner_data.csv) through the Phase 3
Learner Intelligence Layer to produce batch learner profile JSON and summary CSV artifacts.
"""

import os
import sys
import json
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.intelligence.learner_profile import load_models, build_learner_profile



def generate_batch_profiles(
    raw_csv_path: str = None,
    output_dir: str = None,
    project_root: str = None
) -> tuple[list[dict], pd.DataFrame]:
    """
    Generates structured intelligence profiles for all learners in the dataset.
    
    Args:
        raw_csv_path: Path to input CSV.
        output_dir: Path to output directory.
        project_root: Path to project root.
        
    Returns:
        Tuple of (list of profile dicts, DataFrame of profile summaries).
    """
    if project_root is None:
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
        
    if raw_csv_path is None:
        raw_csv_path = os.path.join(project_root, "data/raw/learner_data.csv")
        
    if output_dir is None:
        output_dir = os.path.join(project_root, "data/intelligence")
        
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading raw dataset from: {raw_csv_path}")
    df_raw = pd.read_csv(raw_csv_path)
    print(f"Loaded {len(df_raw)} learner records.")
    
    print("Loading Phase 2 ML models...")
    models_cache = load_models(project_root)
    
    profiles = []
    summary_rows = []
    
    for idx, row in df_raw.iterrows():
        profile = build_learner_profile(row.to_dict(), models_cache=models_cache, project_root=project_root)
        profiles.append(profile)
        
        summary_rows.append({
            "learner_id": profile["learner_id"],
            "skill_level": profile["skill_level"],
            "predicted_performance": profile["predicted_performance"],
            "performance_band": profile["performance_band"],
            "risk_probability": profile["risk_probability"],
            "risk_status": profile["risk_status"],
            "strengths_count": len(profile["topic_strengths"]),
            "weaknesses_count": len(profile["topic_weaknesses"]),
            "developing_count": len(profile["topic_developing"]),
            "behavior_signals_count": len(profile["learning_behavior"]["behavior_signals"])
        })
        
    # Save JSON profiles
    json_path = os.path.join(output_dir, "learner_profiles.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=2)
    print(f"[SUCCESS] Saved {len(profiles)} profiles to: {json_path}")
    
    # Save CSV summary
    df_summary = pd.DataFrame(summary_rows)
    csv_path = os.path.join(output_dir, "profile_summary.csv")
    df_summary.to_csv(csv_path, index=False)
    print(f"[SUCCESS] Saved profile summary CSV to: {csv_path}")
    
    return profiles, df_summary


if __name__ == "__main__":
    generate_batch_profiles()
