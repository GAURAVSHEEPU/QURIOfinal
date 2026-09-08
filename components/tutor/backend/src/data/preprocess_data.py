"""
Data Preprocessing & Scaling Pipeline for Quantum Algorithm Learning Platform.

This module provides a reproducible, leak-free scikit-learn ColumnTransformer
pipeline for handling numerical scaling, categorical one-hot encoding, and
missing value imputation across learner interaction telemetry.

LEAKAGE PREVENTION GUARANTEE:
Identifiers ('learner_id') and targets ('overall_score', 'learning_risk', 'skill_level')
are explicitly excluded from input features (X) prior to fitting or transforming.
"""

import os
import pandas as pd
import numpy as np
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder


# Define explicit feature lists to prevent target leakage
EXCLUDED_COLUMNS = ["learner_id", "overall_score", "learning_risk", "skill_level"]

CATEGORICAL_FEATURES = ["age_group"]

NUMERICAL_FEATURES = [
    "learning_hours_per_week",
    "quiz_score",
    "coding_score",
    "challenge_score",
    "attempts",
    "errors",
    "time_spent_minutes",
    "modules_completed",
    "qubits_score",
    "superposition_score",
    "measurement_score",
    "quantum_gates_score",
    "entanglement_score",
    "bell_states_score",
    "quantum_circuits_score",
    "grover_score",
    "shor_score"
]


def load_raw_data(csv_path: str) -> pd.DataFrame:
    """
    Loads raw learner telemetry dataset and performs data quality checks.
    
    Args:
        csv_path: Path to raw learner_data.csv file.
        
    Returns:
        Pandas DataFrame containing raw records.
        
    Raises:
        FileNotFoundError: If csv_path does not exist.
        ValueError: If mandatory features are missing or duplicate records found.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw dataset missing at: {csv_path}")
        
    df = pd.read_csv(csv_path)
    
    # Check for duplicate learner records
    duplicate_count = df.duplicated(subset=["learner_id"]).sum()
    if duplicate_count > 0:
        raise ValueError(f"Data quality error: Found {duplicate_count} duplicate learner_id records.")
        
    # Validate expected column presence
    all_expected = EXCLUDED_COLUMNS + CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    missing_cols = set(all_expected) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Dataset missing expected columns: {missing_cols}")
        
    return df


def separate_features_and_targets(df: pd.DataFrame):
    """
    Separates raw dataset into input features (X) and target dictionary (y_dict).
    Guarantees strict feature-target isolation to prevent data leakage.
    
    Args:
        df: Raw DataFrame containing all features and targets.
        
    Returns:
        Tuple of (X_df, y_dict):
            X_df: DataFrame containing ONLY valid predictive input features.
            y_dict: Dictionary mapping target names to target Series.
    """
    # Verify no target columns leak into X
    feature_cols = [col for col in df.columns if col not in EXCLUDED_COLUMNS]
    
    # Explicit double check against leakage
    for forbidden in EXCLUDED_COLUMNS:
        if forbidden in feature_cols:
            raise RuntimeError(f"CRITICAL LEAKAGE ERROR: {forbidden} found in feature set!")
            
    X_df = df[feature_cols].copy()
    
    y_dict = {
        "overall_score": df["overall_score"].copy(),
        "learning_risk": df["learning_risk"].copy(),
        "skill_level": df["skill_level"].copy()
    }
    
    return X_df, y_dict


def build_preprocessor_pipeline() -> ColumnTransformer:
    """
    Constructs an sklearn ColumnTransformer preprocessing pipeline containing:
    1. Numerical Pipeline: SimpleImputer (median) + StandardScaler
    2. Categorical Pipeline: SimpleImputer (most_frequent) + OneHotEncoder (handle_unknown='ignore')
    
    Returns:
        Unfitted ColumnTransformer instance.
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"  # Safely drop any unexpected extra columns
    )
    
    return preprocessor


def fit_and_save_preprocessor(X: pd.DataFrame, save_path: str) -> ColumnTransformer:
    """
    Fits preprocessing pipeline on feature set X and serializes it using joblib.
    
    Args:
        X: Feature DataFrame.
        save_path: Destination path for preprocessor.joblib file.
        
    Returns:
        Fitted ColumnTransformer preprocessor instance.
    """
    preprocessor = build_preprocessor_pipeline()
    preprocessor.fit(X)
    
    save_dir = os.path.dirname(save_path)
    if save_dir and not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
        
    joblib.dump(preprocessor, save_path)
    print(f"[SUCCESS] Preprocessor fitted and saved to: {save_path}")
    return preprocessor


def load_preprocessor(load_path: str) -> ColumnTransformer:
    """
    Loads a persisted joblib preprocessor object.
    
    Args:
        load_path: Path to preprocessor.joblib file.
        
    Returns:
        Fitted ColumnTransformer object.
    """
    if not os.path.exists(load_path):
        raise FileNotFoundError(f"Persisted preprocessor file missing at: {load_path}")
        
    return joblib.load(load_path)


def transform_features(preprocessor: ColumnTransformer, X: pd.DataFrame) -> np.ndarray:
    """
    Transforms input feature DataFrame into scaled, encoded NumPy matrix using fitted preprocessor.
    
    Args:
        preprocessor: Fitted ColumnTransformer instance.
        X: Input feature DataFrame.
        
    Returns:
        Transformed 2D NumPy array of floats.
    """
    return preprocessor.transform(X)


def main():
    """Main execution entry point for Phase 1B preprocessing pipeline."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    raw_csv_path = os.path.join(project_root, "data/raw/learner_data.csv")
    preprocessor_save_path = os.path.join(project_root, "data/processed/preprocessor.joblib")
    processed_x_path = os.path.join(project_root, "data/processed/X_processed.csv")
    
    print("--- Phase 1B: Data Preprocessing & Scaling Pipeline ---")
    df = load_raw_data(raw_csv_path)
    print(f"Loaded raw dataset with {len(df)} records and {len(df.columns)} columns.")
    
    X_df, y_dict = separate_features_and_targets(df)
    print(f"Features (X) shape: {X_df.shape} (Excluded: {EXCLUDED_COLUMNS})")
    
    preprocessor = fit_and_save_preprocessor(X_df, preprocessor_save_path)
    X_transformed = transform_features(preprocessor, X_df)
    print(f"Transformed features matrix shape: {X_transformed.shape}")
    
    # Save transformed features matrix to data/processed/X_processed.csv for inspection
    feature_names = (
        NUMERICAL_FEATURES + 
        list(preprocessor.named_transformers_["cat"].named_steps["encoder"].get_feature_names_out(CATEGORICAL_FEATURES))
    )
    X_processed_df = pd.DataFrame(X_transformed, columns=feature_names)
    X_processed_df.to_csv(processed_x_path, index=False)
    print(f"Processed feature matrix saved to: {processed_x_path}")


if __name__ == "__main__":
    main()

