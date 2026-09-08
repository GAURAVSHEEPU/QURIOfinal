"""
Synthetic Learner Data Generation Pipeline for Quantum Algorithm Learning Platform.

This module generates realistic synthetic learner interaction telemetry to train
and evaluate classical machine learning models (Performance Prediction, Risk Prediction,
Skill Classification).

SYNTHETIC DATA DISCLOSURE:
This dataset is completely synthetic and generated for MVP development and prototyping.
It does NOT represent real student behavior or personal data.
"""

import os
import json
import numpy as np
import pandas as pd


def load_curriculum(curriculum_path: str) -> list:
    """
    Loads curriculum topics from JSON configuration file to maintain
    topic consistency across data generation and curriculum definitions.
    
    Args:
        curriculum_path: Absolute or relative path to quantum_topics.json.
        
    Returns:
        List of curriculum topic dictionaries.
    """
    if not os.path.exists(curriculum_path):
        raise FileNotFoundError(f"Curriculum JSON file not found at: {curriculum_path}")
    
    with open(curriculum_path, "r", encoding="utf-8") as f:
        topics = json.load(f)
    return topics


def generate_learner_profiles(num_samples: int = 1000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates synthetic baseline learner activity and interaction features
    with realistic correlations and natural noise distributions.
    
    Args:
        num_samples: Total number of synthetic learner records to generate.
        random_seed: Random seed for statistical reproducibility.
        
    Returns:
        Pandas DataFrame containing learner telemetry features.
    """
    np.random.seed(random_seed)
    
    # 1. Generate Learner Identifiers & Age Categories
    learner_ids = [f"LEARNER_{i+1:04d}" for i in range(num_samples)]
    age_groups = np.random.choice(["18-24", "25-34", "35+"], size=num_samples, p=[0.55, 0.30, 0.15])
    
    # 2. Latent Learner Ability Factor (Standard Normal N(0, 1) + Noise)
    # Serves as the underlying latent driver for realistic feature correlations
    latent_ability = np.random.normal(loc=0.0, scale=1.0, size=num_samples)
    
    # 3. Weekly Learning Hours (Correlated with latent ability: 1 to 30 hours)
    base_hours = 12.0 + 5.0 * latent_ability + np.random.normal(0, 3.0, size=num_samples)
    learning_hours = np.clip(base_hours, 1.0, 30.0).round(1)
    
    # 4. Modules Completed (Correlated with ability & hours: 0 to 9 modules)
    base_modules = 4.5 + 2.0 * latent_ability + 0.1 * learning_hours + np.random.normal(0, 1.2, size=num_samples)
    modules_completed = np.clip(base_modules, 0, 9).astype(int)
    
    # 5. General Performance Scores (0 to 100)
    # Quiz Score: Strong correlation with latent ability & learning hours
    raw_quiz = 65.0 + 15.0 * latent_ability + 0.8 * learning_hours + np.random.normal(0, 7.0, size=num_samples)
    quiz_score = np.clip(raw_quiz, 0.0, 100.0).round(1)
    
    # Coding Score: High correlation with quiz score & completed modules
    raw_coding = 0.6 * quiz_score + 3.0 * modules_completed + np.random.normal(0, 8.0, size=num_samples)
    coding_score = np.clip(raw_coding, 0.0, 100.0).round(1)
    
    # Challenge Score: Harder assessment, requires higher modules & ability
    raw_challenge = 0.5 * coding_score + 10.0 * latent_ability + np.random.normal(0, 9.0, size=num_samples)
    challenge_score = np.clip(raw_challenge, 0.0, 100.0).round(1)
    
    # 6. Interaction Metrics (Attempts, Errors, Time Spent)
    # Attempts: Higher for lower ability / struggling learners (1 to 10 attempts)
    raw_attempts = 4.5 - 1.2 * latent_ability + np.random.normal(0, 1.0, size=num_samples)
    attempts = np.clip(raw_attempts, 1, 10).astype(int)
    
    # Errors: Inversely correlated with quiz/coding scores (0 to 20 errors)
    raw_errors = 10.0 - 0.08 * quiz_score + 0.8 * attempts + np.random.normal(0, 2.0, size=num_samples)
    errors = np.clip(raw_errors, 0, 20).astype(int)
    
    # Time Spent Minutes: Function of modules completed and attempts (5 to 180 mins)
    raw_time = 15.0 * modules_completed + 8.0 * attempts + np.random.normal(0, 12.0, size=num_samples)
    time_spent_minutes = np.clip(raw_time, 5.0, 180.0).round(1)
    
    df = pd.DataFrame({
        "learner_id": learner_ids,
        "age_group": age_groups,
        "learning_hours_per_week": learning_hours,
        "quiz_score": quiz_score,
        "coding_score": coding_score,
        "challenge_score": challenge_score,
        "attempts": attempts,
        "errors": errors,
        "time_spent_minutes": time_spent_minutes,
        "modules_completed": modules_completed,
        "_latent_ability": latent_ability  # Temporary column for topic score generation
    })
    
    return df


def generate_topic_scores(df: pd.DataFrame, topics: list) -> pd.DataFrame:
    """
    Generates topic-level performance scores based on topic difficulty tiers
    (Beginner, Intermediate, Advanced) and learner ability.
    
    Args:
        df: DataFrame containing base learner profiles.
        topics: List of topic metadata dictionaries loaded from curriculum JSON.
        
    Returns:
        DataFrame augmented with 9 individual topic score columns.
    """
    latent_ability = df["_latent_ability"].values
    num_samples = len(df)
    
    # Topic column mapping dictionary matching curriculum JSON order
    topic_col_map = {
        "qubits": "qubits_score",
        "superposition": "superposition_score",
        "measurement": "measurement_score",
        "quantum_gates": "quantum_gates_score",
        "entanglement": "entanglement_score",
        "bell_states": "bell_states_score",
        "quantum_circuits": "quantum_circuits_score",
        "grovers_algorithm": "grover_score",
        "shors_algorithm": "shor_score"
    }
    
    for topic in topics:
        t_id = topic["topic_id"]
        difficulty = topic["difficulty"]
        col_name = topic_col_map.get(t_id, f"{t_id}_score")
        
        # Difficulty penalty adjusts score distribution shift
        if difficulty == "Beginner":
            base_mean = 75.0
            ability_weight = 12.0
        elif difficulty == "Intermediate":
            base_mean = 62.0
            ability_weight = 16.0
        else:  # Advanced (Grover's & Shor's)
            base_mean = 48.0
            ability_weight = 20.0
            
        raw_topic_score = base_mean + ability_weight * latent_ability + np.random.normal(0, 8.0, size=num_samples)
        df[col_name] = np.clip(raw_topic_score, 0.0, 100.0).round(1)
        
    # Remove temporary latent ability column
    df.drop(columns=["_latent_ability"], inplace=True)
    return df


def calculate_derived_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates derived targets for downstream ML tasks.
    
    Derived Logic:
    1. overall_score: Weighted composite of general performance (40%) and topic scores (60%).
    2. learning_risk: Binary indicator (1 = At-Risk, 0 = On-Track). Learner is At-Risk if:
       overall_score < 55 OR errors >= 12 OR (quiz_score < 50 AND attempts >= 6).
    3. skill_level: Categorical tier ("Beginner", "Intermediate", "Advanced") derived from
       modules completed, overall score, and advanced algorithm topic scores.
       
    Args:
        df: DataFrame containing telemetry and topic scores.
        
    Returns:
        DataFrame augmented with derived label columns.
    """
    # Topic score columns
    topic_cols = [
        "qubits_score", "superposition_score", "measurement_score",
        "quantum_gates_score", "entanglement_score", "bell_states_score",
        "quantum_circuits_score", "grover_score", "shor_score"
    ]
    
    avg_topic_score = df[topic_cols].mean(axis=1)
    general_score = (0.4 * df["quiz_score"] + 0.4 * df["coding_score"] + 0.2 * df["challenge_score"])
    
    # 1. Derived Overall Score
    df["overall_score"] = (0.4 * general_score + 0.6 * avg_topic_score).round(1)
    
    # 2. Derived Learning Risk (Binary Target)
    # Risk is flagged for low performance, excessive errors, or high struggle/attempt patterns
    at_risk_condition = (
        (df["overall_score"] < 55.0) |
        (df["errors"] >= 12) |
        ((df["quiz_score"] < 50.0) & (df["attempts"] >= 6))
    )
    df["learning_risk"] = at_risk_condition.astype(int)
    
    # 3. Derived Skill Level (Multi-class Categorical Target)
    def determine_skill(row):
        if row["modules_completed"] >= 7 and row["overall_score"] >= 75.0 and row["grover_score"] >= 65.0:
            return "Advanced"
        elif row["modules_completed"] >= 4 and row["overall_score"] >= 58.0:
            return "Intermediate"
        else:
            return "Beginner"
            
    df["skill_level"] = df.apply(determine_skill, axis=1)
    return df


def save_dataset(df: pd.DataFrame, output_path: str) -> None:
    """
    Saves generated dataset to CSV format.
    
    Args:
        df: Processed Pandas DataFrame.
        output_path: Path where CSV file will be written.
    """
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Synthetic dataset saved to: {output_path} ({len(df)} records)")


def main():
    """Main execution function to generate synthetic learner dataset."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    curriculum_path = os.path.join(project_root, "data/curriculum/quantum_topics.json")
    output_path = os.path.join(project_root, "data/raw/learner_data.csv")
    
    print("--- Phase 1A: Synthetic Learner Data Generation ---")
    topics = load_curriculum(curriculum_path)
    print(f"Loaded {len(topics)} curriculum topics from {curriculum_path}")
    
    df_profiles = generate_learner_profiles(num_samples=1000, random_seed=42)
    df_full = generate_topic_scores(df_profiles, topics)
    df_final = calculate_derived_labels(df_full)
    
    save_dataset(df_final, output_path)
    print(f"Dataset columns: {list(df_final.columns)}")
    print(f"Skill Level distribution:\n{df_final['skill_level'].value_counts()}")
    print(f"Learning Risk distribution:\n{df_final['learning_risk'].value_counts()}")


if __name__ == "__main__":
    main()

