"""
Binary Learning Risk Prediction Model for Quantum Algorithm Learning Platform.

This module implements a Logistic Regression model predicting binary learning_risk
(0 = On-Track, 1 = At-Risk) from preprocessed learner telemetry features. It includes
baseline comparison (DummyClassifier), metrics calculation (Accuracy, Precision, Recall, F1,
Confusion Matrix), probability generation (predict_proba), log-odds coefficient analysis, and
confusion matrix visualization.

MODEL FUNCTION:
Learner Risk Predictor (Phase 2B)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Set non-interactive backend for matplotlib graphics
plt.switch_backend('Agg')


def load_training_data(processed_dir: str):
    """
    Loads preprocessed X_train and isolated y_risk_train datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_train_df, y_train_series).
    """
    x_path = os.path.join(processed_dir, "X_train.csv")
    y_path = os.path.join(processed_dir, "y_risk_train.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Training artifacts missing in {processed_dir}")
        
    X_train = pd.read_csv(x_path)
    y_train = pd.read_csv(y_path)["learning_risk"]
    return X_train, y_train


def load_test_data(processed_dir: str):
    """
    Loads preprocessed X_test and isolated y_risk_test datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_test_df, y_test_series).
    """
    x_path = os.path.join(processed_dir, "X_test.csv")
    y_path = os.path.join(processed_dir, "y_risk_test.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Test artifacts missing in {processed_dir}")
        
    X_test = pd.read_csv(x_path)
    y_test = pd.read_csv(y_path)["learning_risk"]
    return X_test, y_test


def train_risk_model(X_train: pd.DataFrame, y_train: pd.Series) -> LogisticRegression:
    """
    Fits a LogisticRegression classification model on training data.
    
    Args:
        X_train: Preprocessed training features.
        y_train: Binary target learning_risk.
        
    Returns:
        Fitted LogisticRegression instance.
    """
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    return model


def evaluate_baseline(y_train: pd.Series, y_test: pd.Series) -> dict:
    """
    Evaluates a majority-class predicting DummyClassifier baseline on the test set.
    
    Args:
        y_train: Training target Series.
        y_test: Testing target Series.
        
    Returns:
        Dictionary of baseline metrics (Accuracy, Precision, Recall, F1).
    """
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(np.zeros((len(y_train), 1)), y_train)
    y_pred_baseline = dummy.predict(np.zeros((len(y_test), 1)))
    
    acc = float(accuracy_score(y_test, y_pred_baseline))
    prec = float(precision_score(y_test, y_pred_baseline, pos_label=1, zero_division=0))
    rec = float(recall_score(y_test, y_pred_baseline, pos_label=1, zero_division=0))
    f1 = float(f1_score(y_test, y_pred_baseline, pos_label=1, zero_division=0))
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4)
    }


def evaluate_model(model: LogisticRegression, X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    """
    Calculates classification metrics (Accuracy, Precision, Recall, F1, Confusion Matrix) on train and test sets.
    
    Args:
        model: Fitted LogisticRegression model.
        X_train: Training features.
        y_train: Training target.
        X_test: Test features.
        y_test: Test target.
        
    Returns:
        Nested dictionary containing train/test performance and confusion matrix details.
    """
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Train Metrics
    train_acc = float(accuracy_score(y_train, y_pred_train))
    train_prec = float(precision_score(y_train, y_pred_train, pos_label=1, zero_division=0))
    train_rec = float(recall_score(y_train, y_pred_train, pos_label=1, zero_division=0))
    train_f1 = float(f1_score(y_train, y_pred_train, pos_label=1, zero_division=0))
    
    # Test Metrics
    test_acc = float(accuracy_score(y_test, y_pred_test))
    test_prec = float(precision_score(y_test, y_pred_test, pos_label=1, zero_division=0))
    test_rec = float(recall_score(y_test, y_pred_test, pos_label=1, zero_division=0))
    test_f1 = float(f1_score(y_test, y_pred_test, pos_label=1, zero_division=0))
    
    # Confusion Matrix (tn, fp, fn, tp)
    cm = confusion_matrix(y_test, y_pred_test)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]
    
    return {
        "train_metrics": {
            "accuracy": round(train_acc, 4),
            "precision": round(train_prec, 4),
            "recall": round(train_rec, 4),
            "f1_score": round(train_f1, 4)
        },
        "test_metrics": {
            "accuracy": round(test_acc, 4),
            "precision": round(test_prec, 4),
            "recall": round(test_rec, 4),
            "f1_score": round(test_f1, 4)
        },
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "matrix_array": cm.tolist()
        },
        "y_pred_test": y_pred_test
    }


def generate_probabilities(model: LogisticRegression, X: pd.DataFrame) -> pd.DataFrame:
    """
    Computes class probability predictions P(On-Track) and P(At-Risk).
    
    Args:
        model: Fitted LogisticRegression model.
        X: Input features DataFrame.
        
    Returns:
        DataFrame with columns ['prob_on_track', 'prob_at_risk'].
    """
    probs = model.predict_proba(X)
    df_probs = pd.DataFrame({
        "prob_on_track": np.round(probs[:, 0], 4),
        "prob_at_risk": np.round(probs[:, 1], 4)
    })
    return df_probs


def get_coefficients(model: LogisticRegression, feature_names: list) -> pd.DataFrame:
    """
    Extracts log-odds regression coefficients and sorts by absolute magnitude descending.
    
    Args:
        model: Fitted LogisticRegression model.
        feature_names: List of input feature names.
        
    Returns:
        DataFrame containing feature, coefficient, and absolute_coefficient.
    """
    coefs = model.coef_[0]
    df_coef = pd.DataFrame({
        "feature": feature_names,
        "coefficient": np.round(coefs, 4),
        "absolute_coefficient": np.round(np.abs(coefs), 4)
    })
    df_coef = df_coef.sort_values(by="absolute_coefficient", ascending=False).reset_index(drop=True)
    return df_coef


def generate_plots(cm: list, plots_dir: str):
    """
    Generates a simple Matplotlib confusion matrix plot.
    
    Args:
        cm: 2x2 list of lists representing confusion matrix [[TN, FP], [FN, TP]].
        plots_dir: Path to destination directory for plots.
    """
    os.makedirs(plots_dir, exist_ok=True)
    
    cm_arr = np.array(cm)
    plt.figure(figsize=(7, 6))
    plt.imshow(cm_arr, interpolation="nearest", cmap="Blues")
    plt.title("Logistic Regression: Learning Risk Confusion Matrix", fontsize=12, fontweight="bold")
    plt.colorbar(label="Learner Count")
    
    classes = ["0 = On-Track", "1 = At-Risk"]
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, fontsize=10)
    plt.yticks(tick_marks, classes, fontsize=10, rotation=90, va="center")
    
    plt.xlabel("Predicted Class", fontsize=11, fontweight="bold")
    plt.ylabel("Actual Class", fontsize=11, fontweight="bold")
    
    # Annotate counts inside matrix cells
    thresh = cm_arr.max() / 2.0
    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            val = cm_arr[i, j]
            color = "white" if val > thresh else "black"
            plt.text(j, i, f"{val}", ha="center", va="center", color=color, fontsize=14, fontweight="bold")
            
    plt.tight_layout()
    plot_path = os.path.join(plots_dir, "learning_risk_confusion_matrix.png")
    plt.savefig(plot_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved confusion matrix plot to: {plot_path}")


def main():
    """Main execution function for Phase 2B risk prediction model training and evaluation."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    processed_dir = os.path.join(project_root, "data/processed")
    models_dir = os.path.join(project_root, "data/models")
    plots_dir = os.path.join(models_dir, "plots")
    
    print("--- Phase 2B: Learning Risk Prediction Model (Logistic Regression) ---")
    X_train, y_train = load_training_data(processed_dir)
    X_test, y_test = load_test_data(processed_dir)
    
    print(f"Loaded X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
    print(f"Training risk distribution: {y_train.value_counts().to_dict()}")
    print(f"Test risk distribution: {y_test.value_counts().to_dict()}")
    
    # Train model
    model = train_risk_model(X_train, y_train)
    
    # Evaluate baseline and model
    baseline_metrics = evaluate_baseline(y_train, y_test)
    eval_results = evaluate_model(model, X_train, y_train, X_test, y_test)
    y_pred_test = eval_results.pop("y_pred_test")
    
    # Probabilities check
    probs_test = generate_probabilities(model, X_test)
    
    # Coefficients
    coef_df = get_coefficients(model, list(X_train.columns))
    
    # Save artifacts
    os.makedirs(models_dir, exist_ok=True)
    
    model_save_path = os.path.join(models_dir, "learning_risk_logistic_regression.joblib")
    metrics_save_path = os.path.join(models_dir, "learning_risk_metrics.json")
    coef_save_path = os.path.join(models_dir, "learning_risk_coefficients.csv")
    
    joblib.dump(model, model_save_path)
    print(f"[SUCCESS] Saved risk model binary to: {model_save_path}")
    
    metrics_payload = {
        "model": "LogisticRegression",
        "target": "learning_risk",
        "class_mapping": {"0": "On-Track", "1": "At-Risk"},
        "baseline_dummy_most_frequent": baseline_metrics,
        "model_performance": eval_results,
        "intercept": float(round(model.intercept_[0], 4))
    }
    
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[SUCCESS] Saved metrics JSON to: {metrics_save_path}")
    
    coef_df.to_csv(coef_save_path, index=False)
    print(f"[SUCCESS] Saved coefficients CSV to: {coef_save_path}")
    
    # Generate plot
    generate_plots(eval_results["confusion_matrix"]["matrix_array"], plots_dir)
    
    print("\n--- LEARNING RISK PREDICTION EVALUATION SUMMARY ---")
    print(f"Baseline Accuracy: {baseline_metrics['accuracy']} | Precision: {baseline_metrics['precision']} | Recall: {baseline_metrics['recall']} | F1: {baseline_metrics['f1_score']}")
    print(f"Logistic Regression Accuracy: {eval_results['test_metrics']['accuracy']} | Precision: {eval_results['test_metrics']['precision']} | Recall: {eval_results['test_metrics']['recall']} | F1: {eval_results['test_metrics']['f1_score']}")
    print(f"Confusion Matrix: TN={eval_results['confusion_matrix']['true_negatives']}, FP={eval_results['confusion_matrix']['false_positives']}, FN={eval_results['confusion_matrix']['false_negatives']}, TP={eval_results['confusion_matrix']['true_positives']}")
    print(f"Top At-Risk Risk Predictor (Positive Coef): {coef_df.iloc[0]['feature']} (coef: {coef_df.iloc[0]['coefficient']})")


if __name__ == "__main__":
    main()

