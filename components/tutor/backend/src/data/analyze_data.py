"""
Exploratory Data Analysis (EDA) Module for Quantum Algorithm Learning Platform.

This module performs statistical analysis, data quality checks, distribution profiling,
topic difficulty assessment, correlation calculation, and visualization on the
synthetic learner dataset (data/raw/learner_data.csv).

READ-ONLY GUARANTEE:
This module reads raw telemetry data and writes analysis artifacts to data/analysis/
without modifying data/raw/learner_data.csv.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Set matplotlib non-interactive backend for headless environments
plt.switch_backend('Agg')


TOPIC_COLS = [
    "qubits_score", "superposition_score", "measurement_score",
    "quantum_gates_score", "entanglement_score", "bell_states_score",
    "quantum_circuits_score", "grover_score", "shor_score"
]

NUMERICAL_COLS = [
    "learning_hours_per_week", "quiz_score", "coding_score", "challenge_score",
    "attempts", "errors", "time_spent_minutes", "modules_completed"
] + TOPIC_COLS + ["overall_score"]


def load_raw_dataset(csv_path: str) -> pd.DataFrame:
    """
    Loads raw learner dataset and verifies file existence.
    
    Args:
        csv_path: Path to data/raw/learner_data.csv.
        
    Returns:
        Pandas DataFrame containing raw records.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw dataset not found at: {csv_path}")
    return pd.read_csv(csv_path)


def load_curriculum(json_path: str) -> list:
    """Loads quantum topics metadata from curriculum JSON."""
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Curriculum JSON missing at: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_data_quality(df: pd.DataFrame) -> dict:
    """
    Performs data quality checks: missing values, duplicates, ID uniqueness, and ranges.
    
    Args:
        df: Raw DataFrame.
        
    Returns:
        Dictionary of quality metric summaries.
    """
    missing_counts = df.isnull().sum().to_dict()
    total_missing = sum(missing_counts.values())
    duplicate_rows = df.duplicated().sum()
    duplicate_ids = df.duplicated(subset=["learner_id"]).sum()
    unique_learners = df["learner_id"].nunique()
    
    # Check bounds
    score_out_of_bounds = 0
    score_cols = [c for c in df.columns if "score" in c]
    for col in score_cols:
        score_out_of_bounds += ((df[col] < 0.0) | (df[col] > 100.0)).sum()
        
    quality_summary = {
        "total_records": len(df),
        "unique_learners": unique_learners,
        "duplicate_rows": int(duplicate_rows),
        "duplicate_ids": int(duplicate_ids),
        "total_missing_values": int(total_missing),
        "score_out_of_bounds_count": int(score_out_of_bounds)
    }
    return quality_summary


def generate_descriptive_statistics(df: pd.DataFrame, output_dir: str) -> pd.DataFrame:
    """
    Computes count, mean, std, median, min, max for numerical features.
    
    Args:
        df: Input DataFrame.
        output_dir: Path to data/analysis/ directory.
        
    Returns:
        DataFrame containing summary statistics.
    """
    stats_df = df[NUMERICAL_COLS].describe().T[["count", "mean", "std", "min", "50%", "max"]]
    stats_df.rename(columns={"50%": "median"}, inplace=True)
    stats_df = stats_df.round(2)
    
    os.makedirs(output_dir, exist_ok=True)
    stats_path = os.path.join(output_dir, "summary_statistics.csv")
    stats_df.to_csv(stats_path)
    print(f"[SUMMARY] Saved descriptive statistics to: {stats_path}")
    return stats_df


def analyze_topic_performance(df: pd.DataFrame, curriculum: list, output_dir: str) -> pd.DataFrame:
    """
    Analyzes performance statistics across the 9 quantum topics.
    
    Args:
        df: Input DataFrame.
        curriculum: Curriculum JSON topics list.
        output_dir: Output directory path.
        
    Returns:
        DataFrame with topic mean, median, std, min, max, and difficulty tier.
    """
    topic_map = {t["topic_id"]: t["difficulty"] for t in curriculum}
    
    # Col mapping dictionary
    col_to_id = {
        "qubits_score": "qubits",
        "superposition_score": "superposition",
        "measurement_score": "measurement",
        "quantum_gates_score": "quantum_gates",
        "entanglement_score": "entanglement",
        "bell_states_score": "bell_states",
        "quantum_circuits_score": "quantum_circuits",
        "grover_score": "grovers_algorithm",
        "shor_score": "shors_algorithm"
    }
    
    records = []
    for col in TOPIC_COLS:
        t_id = col_to_id.get(col, col)
        difficulty = topic_map.get(t_id, "Unknown")
        mean_val = df[col].mean()
        median_val = df[col].median()
        std_val = df[col].std()
        min_val = df[col].min()
        max_val = df[col].max()
        
        records.append({
            "topic_column": col,
            "topic_id": t_id,
            "difficulty_tier": difficulty,
            "mean_score": round(mean_val, 2),
            "median_score": round(median_val, 2),
            "std_dev": round(std_val, 2),
            "min_score": round(min_val, 2),
            "max_score": round(max_val, 2)
        })
        
    topic_summary_df = pd.DataFrame(records)
    topic_summary_path = os.path.join(output_dir, "topic_performance_summary.csv")
    topic_summary_df.to_csv(topic_summary_path, index=False)
    print(f"[SUMMARY] Saved topic performance summary to: {topic_summary_path}")
    return topic_summary_df


def analyze_target_distributions(df: pd.DataFrame) -> dict:
    """
    Computes distribution counts and proportions for target variables.
    
    Args:
        df: Input DataFrame.
        
    Returns:
        Dictionary containing target distribution metrics.
    """
    overall_stats = {
        "mean": round(df["overall_score"].mean(), 2),
        "median": round(df["overall_score"].median(), 2),
        "std": round(df["overall_score"].std(), 2),
        "min": round(df["overall_score"].min(), 2),
        "max": round(df["overall_score"].max(), 2)
    }
    
    risk_counts = df["learning_risk"].value_counts().to_dict()
    risk_props = (df["learning_risk"].value_counts(normalize=True) * 100).round(2).to_dict()
    
    skill_counts = df["skill_level"].value_counts().to_dict()
    skill_props = (df["skill_level"].value_counts(normalize=True) * 100).round(2).to_dict()
    
    return {
        "overall_score": overall_stats,
        "learning_risk_counts": risk_counts,
        "learning_risk_percentages": risk_props,
        "skill_level_counts": skill_counts,
        "skill_level_percentages": skill_props
    }


def compute_correlation_matrix(df: pd.DataFrame, output_dir: str) -> pd.DataFrame:
    """
    Computes Pearson correlation matrix for numerical features and exports CSV.
    
    Args:
        df: Input DataFrame.
        output_dir: Output directory path.
        
    Returns:
        Correlation matrix DataFrame.
    """
    corr_df = df[NUMERICAL_COLS].corr().round(3)
    corr_path = os.path.join(output_dir, "correlation_matrix.csv")
    corr_df.to_csv(corr_path)
    print(f"[SUMMARY] Saved correlation matrix to: {corr_path}")
    return corr_df


def generate_plots(df: pd.DataFrame, topic_summary_df: pd.DataFrame, corr_df: pd.DataFrame, output_dir: str):
    """
    Generates purposeful Matplotlib visualizations saved to data/analysis/.
    
    Plots:
    1. performance_distributions.png (Histogram/KDE of overall_score, quiz, coding, challenge)
    2. topic_difficulty.png (Bar chart of average scores across 9 topics)
    3. correlation_heatmap.png (Correlation matrix heatmap using Matplotlib)
    4. skill_level_profiles.png (Bar charts of key metrics grouped by skill level)
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Performance Distributions Plot
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle("Synthetic Learner Performance Score Distributions", fontsize=14, fontweight="bold")
    
    axes[0, 0].hist(df["overall_score"], bins=25, color="#7C3AED", edgecolor="black", alpha=0.8)
    axes[0, 0].set_title("Overall Score Distribution")
    axes[0, 0].set_xlabel("Score (0-100)")
    axes[0, 0].set_ylabel("Learner Count")
    
    axes[0, 1].hist(df["quiz_score"], bins=25, color="#06B6D4", edgecolor="black", alpha=0.8)
    axes[0, 1].set_title("Quiz Score Distribution")
    axes[0, 1].set_xlabel("Score (0-100)")
    axes[0, 1].set_ylabel("Learner Count")
    
    axes[1, 0].hist(df["coding_score"], bins=25, color="#22C55E", edgecolor="black", alpha=0.8)
    axes[1, 0].set_title("Coding Score Distribution")
    axes[1, 0].set_xlabel("Score (0-100)")
    axes[1, 0].set_ylabel("Learner Count")
    
    axes[1, 1].hist(df["challenge_score"], bins=25, color="#F59E0B", edgecolor="black", alpha=0.8)
    axes[1, 1].set_title("Challenge Score Distribution")
    axes[1, 1].set_xlabel("Score (0-100)")
    axes[1, 1].set_ylabel("Learner Count")
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plot1_path = os.path.join(output_dir, "performance_distributions.png")
    plt.savefig(plot1_path, dpi=150)
    plt.close()
    print(f"[PLOT] Saved performance distributions plot to: {plot1_path}")
    
    # 2. Topic Difficulty Plot
    plt.figure(figsize=(12, 6))
    colors = ["#22C55E" if d == "Beginner" else "#06B6D4" if d == "Intermediate" else "#EF4444" 
              for d in topic_summary_df["difficulty_tier"]]
    
    bars = plt.bar(topic_summary_df["topic_id"], topic_summary_df["mean_score"], color=colors, edgecolor="black")
    plt.axhline(60, color="gray", linestyle="--", alpha=0.7, label="60% Benchmark")
    plt.title("Average Score Across Quantum Topics by Difficulty Tier (Synthetic Data)", fontsize=13, fontweight="bold")
    plt.xlabel("Quantum Topic ID")
    plt.ylabel("Mean Score (0-100)")
    plt.xticks(rotation=35, ha="right")
    plt.ylim(0, 100)
    
    # Value labels on top of bars
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, yval + 1.5, f"{yval:.1f}", ha="center", va="bottom", fontsize=9)
        
    plt.tight_layout()
    plot2_path = os.path.join(output_dir, "topic_difficulty.png")
    plt.savefig(plot2_path, dpi=150)
    plt.close()
    print(f"[PLOT] Saved topic difficulty plot to: {plot2_path}")
    
    # 3. Correlation Heatmap (Matplotlib imshow)
    plt.figure(figsize=(10, 8))
    # Select key numerical subset for readable heatmap
    key_cols = ["learning_hours_per_week", "quiz_score", "coding_score", "challenge_score", 
                "attempts", "errors", "modules_completed", "overall_score"]
    sub_corr = df[key_cols].corr().values
    
    plt.imshow(sub_corr, cmap="coolwarm", vmin=-1, vmax=1)
    plt.colorbar(label="Pearson Correlation")
    plt.xticks(range(len(key_cols)), key_cols, rotation=45, ha="right", fontsize=9)
    plt.yticks(range(len(key_cols)), key_cols, fontsize=9)
    plt.title("Feature Correlation Matrix Heatmap", fontsize=13, fontweight="bold")
    
    # Annotate correlation numbers
    for i in range(len(key_cols)):
        for j in range(len(key_cols)):
            val = sub_corr[i, j]
            color = "white" if abs(val) > 0.5 else "black"
            plt.text(j, i, f"{val:.2f}", ha="center", va="center", color=color, fontsize=8)
            
    plt.tight_layout()
    plot3_path = os.path.join(output_dir, "correlation_heatmap.png")
    plt.savefig(plot3_path, dpi=150)
    plt.close()
    print(f"[PLOT] Saved correlation heatmap to: {plot3_path}")
    
    # 4. Skill Level Profiles Plot
    skill_grouped = df.groupby("skill_level")[["quiz_score", "coding_score", "challenge_score", "overall_score"]].mean()
    skill_grouped = skill_grouped.reindex(["Beginner", "Intermediate", "Advanced"])
    
    skill_grouped.plot(kind="bar", figsize=(10, 6), colormap="plasma", edgecolor="black")
    plt.title("Average Assessment Scores Grouped by Synthetic Skill Level Tier", fontsize=13, fontweight="bold")
    plt.xlabel("Skill Level Tier")
    plt.ylabel("Mean Score (0-100)")
    plt.xticks(rotation=0)
    plt.ylim(0, 100)
    plt.legend(title="Assessment Type")
    plt.grid(axis="y", linestyle=":", alpha=0.6)
    
    plt.tight_layout()
    plot4_path = os.path.join(output_dir, "skill_level_profiles.png")
    plt.savefig(plot4_path, dpi=150)
    plt.close()
    print(f"[PLOT] Saved skill level profiles plot to: {plot4_path}")


def main():
    """Main execution function to run complete EDA pipeline."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    raw_csv = os.path.join(project_root, "data/raw/learner_data.csv")
    curriculum_json = os.path.join(project_root, "data/curriculum/quantum_topics.json")
    output_dir = os.path.join(project_root, "data/analysis")
    
    print("--- Phase 1C: Exploratory Data Analysis (EDA) ---")
    df = load_raw_dataset(raw_csv)
    curriculum = load_curriculum(curriculum_json)
    
    quality = analyze_data_quality(df)
    print(f"Data Quality Check: {quality}")
    
    stats_df = generate_descriptive_statistics(df, output_dir)
    topic_summary_df = analyze_topic_performance(df, curriculum, output_dir)
    target_stats = analyze_target_distributions(df)
    corr_df = compute_correlation_matrix(df, output_dir)
    
    generate_plots(df, topic_summary_df, corr_df, output_dir)
    print("--- Phase 1C EDA Analysis Successfully Completed ---")


if __name__ == "__main__":
    main()

