"""
ML-Ready Dataset Preparation Pipeline for Quantum Algorithm Learning Platform.

This module performs leak-free train/test splitting (80/20, random_state=42),
fits a fresh ColumnTransformer preprocessor ONLY on X_train, transforms both
X_train and X_test, isolates prediction targets (y_performance, y_risk, y_skill),
and serializes all ML-ready dataset artifacts to data/processed/.

LEAKAGE PREVENTION ARCHITECTURE:
1. Feature/Target Separation: Excludes 'learner_id', 'overall_score', 'learning_risk', 'skill_level' from X.
2. Train/Test Splitting FIRST: Partitions data prior to fitting any preprocessing transformers.
3. Fit on Training ONLY: ColumnTransformer fits exclusively on X_train; X_test is transformed using the X_train fit.
4. Persisted ML Preprocessor: Saved to data/processed/ml_preprocessor.joblib.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder


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


def load_dataset(csv_path: str) -> pd.DataFrame:
    """
    Loads raw learner dataset and performs structural assertions.
    
    Args:
        csv_path: Path to raw learner_data.csv.
        
    Returns:
        Pandas DataFrame containing raw records.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw dataset file not found at: {csv_path}")
        
    df = pd.read_csv(csv_path)
    if len(df) != 1000:
        raise ValueError(f"Expected 1000 raw records, found {len(df)}")
    return df


def separate_features_and_targets(df: pd.DataFrame):
    """
    Separates raw DataFrame into feature set X, target dictionary y_dict, and learner IDs.
    
    Args:
        df: Raw dataset DataFrame.
        
    Returns:
        Tuple of (X_df, y_dict, learner_ids):
            X_df: 18 raw input feature columns.
            y_dict: Dictionary containing target Series ('overall_score', 'learning_risk', 'skill_level').
            learner_ids: Series of learner_id strings.
    """
    # Verify zero target or identifier columns leak into X
    feature_cols = [col for col in df.columns if col not in EXCLUDED_COLUMNS]
    
    for forbidden in EXCLUDED_COLUMNS:
        assert forbidden not in feature_cols, f"CRITICAL TARGET LEAKAGE: {forbidden} found in feature set!"
        
    X_df = df[feature_cols].copy()
    learner_ids = df["learner_id"].copy()
    
    y_dict = {
        "overall_score": df["overall_score"].copy(),
        "learning_risk": df["learning_risk"].copy(),
        "skill_level": df["skill_level"].copy()
    }
    
    return X_df, y_dict, learner_ids


def create_train_test_split(X_df: pd.DataFrame, y_dict: dict, learner_ids: pd.Series, test_size: float = 0.20, random_state: int = 42):
    """
    Creates a single, shared, reproducible 80/20 train/test partition stratified by skill_level.
    
    Args:
        X_df: Raw feature DataFrame.
        y_dict: Targets dictionary.
        learner_ids: Learner ID Series.
        test_size: Proportion for testing (default 0.20 for 800 train / 200 test).
        random_state: Random seed (default 42).
        
    Returns:
        Tuple of (X_train_df, X_test_df, y_train_dict, y_test_dict, train_ids, test_ids).
    """
    # Combine target dictionary into temporary DataFrame for atomic splitting
    targets_df = pd.DataFrame(y_dict)
    
    # Perform stratified train_test_split using skill_level stratification
    X_train_df, X_test_df, targets_train_df, targets_test_df, train_ids, test_ids = train_test_split(
        X_df,
        targets_df,
        learner_ids,
        test_size=test_size,
        random_state=random_state,
        stratify=targets_df["skill_level"]
    )
    
    # Reconstruct target dictionaries
    y_train_dict = {col: targets_train_df[col].copy() for col in targets_train_df.columns}
    y_test_dict = {col: targets_test_df[col].copy() for col in targets_test_df.columns}
    
    # Assert zero ID overlap
    assert len(set(train_ids) & set(test_ids)) == 0, "CRITICAL ERROR: Learner IDs overlap between train and test sets!"
    assert len(train_ids) + len(test_ids) == len(X_df), "CRITICAL ERROR: Total train + test row count mismatch!"
    
    return X_train_df, X_test_df, y_train_dict, y_test_dict, train_ids, test_ids


def build_preprocessor() -> ColumnTransformer:
    """
    Constructs an unfitted ColumnTransformer preprocessing pipeline.
    
    Returns:
        Fresh ColumnTransformer instance.
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
        remainder="drop"
    )
    return preprocessor


def fit_preprocessor(preprocessor: ColumnTransformer, X_train_df: pd.DataFrame) -> ColumnTransformer:
    """
    Fits ColumnTransformer preprocessor EXCLUSIVELY on training data.
    
    Args:
        preprocessor: Unfitted ColumnTransformer object.
        X_train_df: Raw training feature DataFrame.
        
    Returns:
        Fitted ColumnTransformer object.
    """
    preprocessor.fit(X_train_df)
    return preprocessor


def transform_datasets(preprocessor: ColumnTransformer, X_train_df: pd.DataFrame, X_test_df: pd.DataFrame):
    """
    Transforms X_train_df and X_test_df using the preprocessor fitted on training data.
    
    Args:
        preprocessor: Fitted ColumnTransformer.
        X_train_df: Training features.
        X_test_df: Test features.
        
    Returns:
        Tuple of (X_train_processed_df, X_test_processed_df).
    """
    X_train_arr = preprocessor.transform(X_train_df)
    X_test_arr = preprocessor.transform(X_test_df)
    
    # Extract feature column names post-encoding
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    encoded_cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    feature_names = NUMERICAL_FEATURES + encoded_cat_names
    
    X_train_processed_df = pd.DataFrame(X_train_arr, columns=feature_names, index=X_train_df.index)
    X_test_processed_df = pd.DataFrame(X_test_arr, columns=feature_names, index=X_test_df.index)
    
    return X_train_processed_df, X_test_processed_df


def save_artifacts(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train_dict: dict,
    y_test_dict: dict,
    train_ids: pd.Series,
    test_ids: pd.Series,
    preprocessor: ColumnTransformer,
    output_dir: str
):
    """
    Saves ML-ready datasets, targets, learner IDs, and ml_preprocessor.joblib artifact.
    
    Args:
        X_train: Transformed training feature DataFrame.
        X_test: Transformed test feature DataFrame.
        y_train_dict: Dictionary of training targets.
        y_test_dict: Dictionary of testing targets.
        train_ids: Training learner ID Series.
        test_ids: Testing learner ID Series.
        preprocessor: Fitted ColumnTransformer instance.
        output_dir: Path to data/processed/.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Save transformed features
    X_train.to_csv(os.path.join(output_dir, "X_train.csv"), index=False)
    X_test.to_csv(os.path.join(output_dir, "X_test.csv"), index=False)
    
    # Save targets separately
    pd.DataFrame({"overall_score": y_train_dict["overall_score"]}).to_csv(os.path.join(output_dir, "y_performance_train.csv"), index=False)
    pd.DataFrame({"overall_score": y_test_dict["overall_score"]}).to_csv(os.path.join(output_dir, "y_performance_test.csv"), index=False)
    
    pd.DataFrame({"learning_risk": y_train_dict["learning_risk"]}).to_csv(os.path.join(output_dir, "y_risk_train.csv"), index=False)
    pd.DataFrame({"learning_risk": y_test_dict["learning_risk"]}).to_csv(os.path.join(output_dir, "y_risk_test.csv"), index=False)
    
    pd.DataFrame({"skill_level": y_train_dict["skill_level"]}).to_csv(os.path.join(output_dir, "y_skill_train.csv"), index=False)
    pd.DataFrame({"skill_level": y_test_dict["skill_level"]}).to_csv(os.path.join(output_dir, "y_skill_test.csv"), index=False)
    
    # Save learner IDs separately for traceability
    pd.DataFrame({"learner_id": train_ids}).to_csv(os.path.join(output_dir, "train_learner_ids.csv"), index=False)
    pd.DataFrame({"learner_id": test_ids}).to_csv(os.path.join(output_dir, "test_learner_ids.csv"), index=False)
    
    # Save training-fitted preprocessor separately from Phase 1B artifact
    joblib_path = os.path.join(output_dir, "ml_preprocessor.joblib")
    joblib.dump(preprocessor, joblib_path)
    print(f"[SUCCESS] ML preprocessor saved to: {joblib_path}")
    print(f"[SUCCESS] ML artifacts successfully saved to: {output_dir}")


def main():
    """Main execution function to prepare ML-ready datasets."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    raw_csv = os.path.join(project_root, "data/raw/learner_data.csv")
    output_dir = os.path.join(project_root, "data/processed")
    
    print("--- Phase 1D: ML-Ready Dataset Preparation ---")
    df = load_dataset(raw_csv)
    
    X_df, y_dict, learner_ids = separate_features_and_targets(df)
    X_train_df, X_test_df, y_train_dict, y_test_dict, train_ids, test_ids = create_train_test_split(
        X_df, y_dict, learner_ids, test_size=0.20, random_state=42
    )
    
    preprocessor = build_preprocessor()
    fitted_preprocessor = fit_preprocessor(preprocessor, X_train_df)
    
    X_train_processed, X_test_processed = transform_datasets(fitted_preprocessor, X_train_df, X_test_df)
    
    save_artifacts(
        X_train_processed, X_test_processed,
        y_train_dict, y_test_dict,
        train_ids, test_ids,
        fitted_preprocessor, output_dir
    )
    
    print(f"X_train shape: {X_train_processed.shape}, X_test shape: {X_test_processed.shape}")
    print(f"y_risk train balance: {y_train_dict['learning_risk'].value_counts().to_dict()}")
    print(f"y_skill train balance: {y_train_dict['skill_level'].value_counts().to_dict()}")


if __name__ == "__main__":
    main()

