"""
Continuous Performance Prediction Model for Quantum Algorithm Learning Platform.

This module implements a Linear Regression model predicting continuous overall_score
from preprocessed learner telemetry features. It includes baseline comparison (DummyRegressor),
evaluation metrics (MAE, MSE, RMSE, R^2), coefficient analysis, and visual diagnostics.

MODEL FUNCTION:
Expected Performance Predictor (Phase 2A)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LinearRegression
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Set non-interactive backend for matplotlib graphics
plt.switch_backend('Agg')


def load_training_data(processed_dir: str):
    """
    Loads preprocessed X_train and isolated y_performance_train datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_train_df, y_train_series).
    """
    x_path = os.path.join(processed_dir, "X_train.csv")
    y_path = os.path.join(processed_dir, "y_performance_train.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Training artifacts missing in {processed_dir}")
        
    X_train = pd.read_csv(x_path)
    y_train = pd.read_csv(y_path)["overall_score"]
    return X_train, y_train


def load_test_data(processed_dir: str):
    """
    Loads preprocessed X_test and isolated y_performance_test datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_test_df, y_test_series).
    """
    x_path = os.path.join(processed_dir, "X_test.csv")
    y_path = os.path.join(processed_dir, "y_performance_test.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Test artifacts missing in {processed_dir}")
        
    X_test = pd.read_csv(x_path)
    y_test = pd.read_csv(y_path)["overall_score"]
    return X_test, y_test


def train_performance_model(X_train: pd.DataFrame, y_train: pd.Series) -> LinearRegression:
    """
    Fits an explainable LinearRegression model on training data.
    
    Args:
        X_train: Preprocessed training features.
        y_train: Continuous target overall_score.
        
    Returns:
        Fitted LinearRegression instance.
    """
    model = LinearRegression()
    model.fit(X_train, y_train)
    return model


def evaluate_baseline(y_train: pd.Series, y_test: pd.Series) -> dict:
    """
    Evaluates a mean-predicting DummyRegressor baseline on the test set.
    
    Args:
        y_train: Training target Series.
        y_test: Testing target Series.
        
    Returns:
        Dictionary of baseline evaluation metrics (MAE, MSE, RMSE, R^2).
    """
    dummy = DummyRegressor(strategy="mean")
    dummy.fit(np.zeros((len(y_train), 1)), y_train)
    y_pred_baseline = dummy.predict(np.zeros((len(y_test), 1)))
    
    mae = float(mean_absolute_error(y_test, y_pred_baseline))
    mse = float(mean_squared_error(y_test, y_pred_baseline))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred_baseline))
    
    return {
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4)
    }


def evaluate_model(model: LinearRegression, X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    """
    Calculates evaluation metrics (MAE, MSE, RMSE, R^2) on both train and test sets.
    
    Args:
        model: Fitted LinearRegression model.
        X_train: Training features.
        y_train: Training target.
        X_test: Test features.
        y_test: Test target.
        
    Returns:
        Nested dictionary containing train and test performance metrics.
    """
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Train Metrics
    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    train_mse = float(mean_squared_error(y_train, y_pred_train))
    train_rmse = float(np.sqrt(train_mse))
    train_r2 = float(r2_score(y_train, y_pred_train))
    
    # Test Metrics
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    test_mse = float(mean_squared_error(y_test, y_pred_test))
    test_rmse = float(np.sqrt(test_mse))
    test_r2 = float(r2_score(y_test, y_pred_test))
    
    # Out of range prediction check (unbounded model audit)
    out_of_bounds_count = int(((y_pred_test < 0.0) | (y_pred_test > 100.0)).sum())
    
    return {
        "train_metrics": {
            "mae": round(train_mae, 4),
            "mse": round(train_mse, 4),
            "rmse": round(train_rmse, 4),
            "r2": round(train_r2, 4)
        },
        "test_metrics": {
            "mae": round(test_mae, 4),
            "mse": round(test_mse, 4),
            "rmse": round(test_rmse, 4),
            "r2": round(test_r2, 4)
        },
        "out_of_bounds_predictions_count": out_of_bounds_count,
        "y_pred_test": y_pred_test
    }


def get_coefficients(model: LinearRegression, feature_names: list) -> pd.DataFrame:
    """
    Extracts regression coefficients and sorts by absolute magnitude descending.
    
    Args:
        model: Fitted LinearRegression model.
        feature_names: List of input feature names.
        
    Returns:
        DataFrame containing feature, coefficient, and absolute_coefficient.
    """
    coefs = model.coef_
    df_coef = pd.DataFrame({
        "feature": feature_names,
        "coefficient": np.round(coefs, 4),
        "absolute_coefficient": np.round(np.abs(coefs), 4)
    })
    df_coef = df_coef.sort_values(by="absolute_coefficient", ascending=False).reset_index(drop=True)
    return df_coef


def generate_plots(y_test: pd.Series, y_pred: np.ndarray, plots_dir: str):
    """
    Generates actual vs predicted scatter plot and residual analysis plot.
    
    Args:
        y_test: True test target values.
        y_pred: Predicted target values.
        plots_dir: Path to destination directory for plots.
    """
    os.makedirs(plots_dir, exist_ok=True)
    
    # 1. Actual vs Predicted Scatter Plot
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, y_pred, color="#7C3AED", alpha=0.7, edgecolors="k", label="Learner Predictions")
    
    # Reference line y = x
    min_val = min(y_test.min(), y_pred.min())
    max_val = max(y_test.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], color="#EF4444", linestyle="--", linewidth=2, label="Ideal Prediction (y = x)")
    
    plt.title("Linear Regression: Actual vs Predicted Overall Score", fontsize=12, fontweight="bold")
    plt.xlabel("Actual Overall Score (%)")
    plt.ylabel("Predicted Overall Score (%)")
    plt.legend()
    plt.grid(True, linestyle=":", alpha=0.6)
    
    plot1_path = os.path.join(plots_dir, "performance_actual_vs_predicted.png")
    plt.savefig(plot1_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved actual vs predicted plot to: {plot1_path}")
    
    # 2. Residual Analysis Plot
    residuals = y_test.values - y_pred
    plt.figure(figsize=(8, 6))
    plt.scatter(y_pred, residuals, color="#06B6D4", alpha=0.7, edgecolors="k")
    plt.axhline(0, color="#EF4444", linestyle="--", linewidth=2)
    
    plt.title("Linear Regression: Residual Analysis (Actual - Predicted)", fontsize=12, fontweight="bold")
    plt.xlabel("Predicted Overall Score (%)")
    plt.ylabel("Residual Error (%)")
    plt.grid(True, linestyle=":", alpha=0.6)
    
    plot2_path = os.path.join(plots_dir, "performance_residuals.png")
    plt.savefig(plot2_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved residual plot to: {plot2_path}")


def main():
    """Main execution function for Phase 2A model training and evaluation."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    processed_dir = os.path.join(project_root, "data/processed")
    models_dir = os.path.join(project_root, "data/models")
    plots_dir = os.path.join(models_dir, "plots")
    
    print("--- Phase 2A: Performance Prediction Model (Linear Regression) ---")
    X_train, y_train = load_training_data(processed_dir)
    X_test, y_test = load_test_data(processed_dir)
    
    print(f"Loaded X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
    
    # Train model
    model = train_performance_model(X_train, y_train)
    
    # Evaluate baseline and model
    baseline_metrics = evaluate_baseline(y_train, y_test)
    eval_results = evaluate_model(model, X_train, y_train, X_test, y_test)
    y_pred_test = eval_results.pop("y_pred_test")
    
    # Coefficients
    coef_df = get_coefficients(model, list(X_train.columns))
    
    # Save artifacts
    os.makedirs(models_dir, exist_ok=True)
    
    model_save_path = os.path.join(models_dir, "performance_linear_regression.joblib")
    metrics_save_path = os.path.join(models_dir, "performance_metrics.json")
    coef_save_path = os.path.join(models_dir, "performance_coefficients.csv")
    
    joblib.dump(model, model_save_path)
    print(f"[SUCCESS] Saved model artifact to: {model_save_path}")
    
    metrics_payload = {
        "model": "LinearRegression",
        "target": "overall_score",
        "baseline_dummy_mean": baseline_metrics,
        "model_performance": eval_results,
        "intercept": float(round(model.intercept_, 4))
    }
    
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[SUCCESS] Saved metrics JSON to: {metrics_save_path}")
    
    coef_df.to_csv(coef_save_path, index=False)
    print(f"[SUCCESS] Saved coefficients CSV to: {coef_save_path}")
    
    # Generate plots
    generate_plots(y_test, y_pred_test, plots_dir)
    
    print("\n--- PERFORMANCE PREDICTION EVALUATION SUMMARY ---")
    print(f"Baseline Test R^2: {baseline_metrics['r2']} | MAE: {baseline_metrics['mae']}")
    print(f"Linear Regression Test R^2: {eval_results['test_metrics']['r2']} | MAE: {eval_results['test_metrics']['mae']} | RMSE: {eval_results['test_metrics']['rmse']}")
    print(f"Top Positive Predictor: {coef_df.iloc[0]['feature']} (coef: {coef_df.iloc[0]['coefficient']})")


if __name__ == "__main__":
    main()

