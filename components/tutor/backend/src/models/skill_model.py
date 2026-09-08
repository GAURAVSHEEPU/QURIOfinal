"""
Multi-Class Skill Level Classification Models for Quantum Algorithm Learning Platform.

This module implements and compares Decision Tree and Random Forest classifiers for predicting
learner skill_level ('Beginner', 'Intermediate', 'Advanced') from preprocessed telemetry.
It outputs model evaluation metrics (Accuracy, Precision, Recall, F1 with weighted averaging),
confusion matrices, feature importances, decision tree visualizations, and persisted joblib binaries.

MODEL FUNCTION:
Skill Level Classifier (Phase 2C)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

# Set non-interactive backend for matplotlib graphics
plt.switch_backend('Agg')


def load_training_data(processed_dir: str):
    """
    Loads preprocessed X_train and isolated y_skill_train datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_train_df, y_train_series).
    """
    x_path = os.path.join(processed_dir, "X_train.csv")
    y_path = os.path.join(processed_dir, "y_skill_train.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Training artifacts missing in {processed_dir}")
        
    X_train = pd.read_csv(x_path)
    y_train = pd.read_csv(y_path)["skill_level"]
    return X_train, y_train


def load_test_data(processed_dir: str):
    """
    Loads preprocessed X_test and isolated y_skill_test datasets.
    
    Args:
        processed_dir: Path to data/processed/ directory.
        
    Returns:
        Tuple of (X_test_df, y_test_series).
    """
    x_path = os.path.join(processed_dir, "X_test.csv")
    y_path = os.path.join(processed_dir, "y_skill_test.csv")
    
    if not os.path.exists(x_path) or not os.path.exists(y_path):
        raise FileNotFoundError(f"Test artifacts missing in {processed_dir}")
        
    X_test = pd.read_csv(x_path)
    y_test = pd.read_csv(y_path)["skill_level"]
    return X_test, y_test


def train_decision_tree(X_train: pd.DataFrame, y_train: pd.Series, max_depth: int = 5) -> DecisionTreeClassifier:
    """
    Fits an explainable DecisionTreeClassifier on training data.
    
    Args:
        X_train: Training feature DataFrame.
        y_train: Multi-class skill_level target Series.
        max_depth: Maximum tree depth limit (default 5 for interpretability).
        
    Returns:
        Fitted DecisionTreeClassifier instance.
    """
    model = DecisionTreeClassifier(max_depth=max_depth, random_state=42)
    model.fit(X_train, y_train)
    return model


def train_random_forest(X_train: pd.DataFrame, y_train: pd.Series, n_estimators: int = 100, max_depth: int = 7) -> RandomForestClassifier:
    """
    Fits an ensemble RandomForestClassifier on training data.
    
    Args:
        X_train: Training feature DataFrame.
        y_train: Multi-class skill_level target Series.
        n_estimators: Number of trees in forest (default 100).
        max_depth: Maximum tree depth (default 7).
        
    Returns:
        Fitted RandomForestClassifier instance.
    """
    model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
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
    prec = float(precision_score(y_test, y_pred_baseline, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred_baseline, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred_baseline, average="weighted", zero_division=0))
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4)
    }


def evaluate_model(model, X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    """
    Evaluates a classification model on train and test sets, returning weighted metrics and 3x3 confusion matrix.
    
    Args:
        model: Fitted classifier model.
        X_train: Training features.
        y_train: Training targets.
        X_test: Test features.
        y_test: Test targets.
        
    Returns:
        Nested dictionary containing train/test performance metrics, per-class report, and confusion matrix.
    """
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    # Train Metrics
    train_acc = float(accuracy_score(y_train, y_pred_train))
    train_prec = float(precision_score(y_train, y_pred_train, average="weighted", zero_division=0))
    train_rec = float(recall_score(y_train, y_pred_train, average="weighted", zero_division=0))
    train_f1 = float(f1_score(y_train, y_pred_train, average="weighted", zero_division=0))
    
    # Test Metrics
    test_acc = float(accuracy_score(y_test, y_pred_test))
    test_prec = float(precision_score(y_test, y_pred_test, average="weighted", zero_division=0))
    test_rec = float(recall_score(y_test, y_pred_test, average="weighted", zero_division=0))
    test_f1 = float(f1_score(y_test, y_pred_test, average="weighted", zero_division=0))
    
    # Class order for confusion matrix
    labels = ["Beginner", "Intermediate", "Advanced"]
    cm = confusion_matrix(y_test, y_pred_test, labels=labels)
    report_dict = classification_report(y_test, y_pred_test, labels=labels, output_dict=True, zero_division=0)
    
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
        "classification_report": report_dict,
        "confusion_matrix": cm.tolist(),
        "y_pred_test": y_pred_test
    }


def extract_feature_importance(model, feature_names: list) -> pd.DataFrame:
    """
    Extracts feature importances from tree-based model and sorts descending.
    
    Args:
        model: Fitted DecisionTree or RandomForest model.
        feature_names: List of input feature names.
        
    Returns:
        DataFrame containing feature and importance columns.
    """
    importances = model.feature_importances_
    df_imp = pd.DataFrame({
        "feature": feature_names,
        "importance": np.round(importances, 4)
    })
    df_imp = df_imp.sort_values(by="importance", ascending=False).reset_index(drop=True)
    return df_imp


def generate_confusion_matrix_plot(cm: list, title: str, save_path: str):
    """
    Generates a 3x3 Matplotlib confusion matrix plot.
    
    Args:
        cm: 3x3 confusion matrix list.
        title: Plot title.
        save_path: Output file path.
    """
    cm_arr = np.array(cm)
    classes = ["Beginner", "Intermediate", "Advanced"]
    
    plt.figure(figsize=(7, 6))
    plt.imshow(cm_arr, interpolation="nearest", cmap="Purples")
    plt.title(title, fontsize=12, fontweight="bold")
    plt.colorbar(label="Learner Count")
    
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, fontsize=10)
    plt.yticks(tick_marks, classes, fontsize=10, rotation=90, va="center")
    
    plt.xlabel("Predicted Skill Level", fontsize=11, fontweight="bold")
    plt.ylabel("Actual Skill Level", fontsize=11, fontweight="bold")
    
    thresh = cm_arr.max() / 2.0 if cm_arr.max() > 0 else 1.0
    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            val = cm_arr[i, j]
            color = "white" if val > thresh else "black"
            plt.text(j, i, f"{val}", ha="center", va="center", color=color, fontsize=14, fontweight="bold")
            
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved confusion matrix plot to: {save_path}")


def generate_tree_plot(dt_model: DecisionTreeClassifier, feature_names: list, save_path: str):
    """
    Generates a visual diagram of the Decision Tree using sklearn.tree.plot_tree.
    
    Args:
        dt_model: Fitted DecisionTreeClassifier.
        feature_names: List of input feature names.
        save_path: Output file path.
    """
    plt.figure(figsize=(18, 10))
    plot_tree(
        dt_model,
        feature_names=feature_names,
        class_names=["Advanced", "Beginner", "Intermediate"],  # Alphabetical class names matching sklearn classes_
        filled=True,
        rounded=True,
        fontsize=8
    )
    plt.title("Decision Tree Visualization (Max Depth = 5)", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved Decision Tree visualization to: {save_path}")


def generate_rf_importance_plot(rf_imp_df: pd.DataFrame, save_path: str):
    """
    Generates a horizontal bar chart of Random Forest feature importances.
    
    Args:
        rf_imp_df: Feature importance DataFrame.
        save_path: Output file path.
    """
    top_df = rf_imp_df.head(10).sort_values(by="importance", ascending=True)
    
    plt.figure(figsize=(8, 6))
    plt.barh(top_df["feature"], top_df["importance"], color="#059669")
    plt.title("Random Forest Top 10 Feature Importances", fontsize=12, fontweight="bold")
    plt.xlabel("Gini Feature Importance")
    plt.ylabel("Feature")
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"[PLOT] Saved Random Forest feature importance plot to: {save_path}")


def main():
    """Main execution function for Phase 2C skill level model training and comparison."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    processed_dir = os.path.join(project_root, "data/processed")
    models_dir = os.path.join(project_root, "data/models")
    plots_dir = os.path.join(models_dir, "plots")
    
    print("--- Phase 2C: Skill Level Classification Models (Decision Tree & Random Forest) ---")
    X_train, y_train = load_training_data(processed_dir)
    X_test, y_test = load_test_data(processed_dir)
    
    print(f"Loaded X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
    print(f"Training skill distribution: {y_train.value_counts().to_dict()}")
    print(f"Test skill distribution: {y_test.value_counts().to_dict()}")
    
    # Train both models
    dt_model = train_decision_tree(X_train, y_train, max_depth=5)
    rf_model = train_random_forest(X_train, y_train, n_estimators=100, max_depth=7)
    
    # Evaluate baseline and models
    baseline_metrics = evaluate_baseline(y_train, y_test)
    dt_eval = evaluate_model(dt_model, X_train, y_train, X_test, y_test)
    rf_eval = evaluate_model(rf_model, X_train, y_train, X_test, y_test)
    
    dt_pred = dt_eval.pop("y_pred_test")
    rf_pred = rf_eval.pop("y_pred_test")
    
    # Extract feature importances
    dt_imp_df = extract_feature_importance(dt_model, list(X_train.columns))
    rf_imp_df = extract_feature_importance(rf_model, list(X_train.columns))
    
    # Save model binaries
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)
    
    dt_joblib_path = os.path.join(models_dir, "skill_decision_tree.joblib")
    rf_joblib_path = os.path.join(models_dir, "skill_random_forest.joblib")
    joblib.dump(dt_model, dt_joblib_path)
    joblib.dump(rf_model, rf_joblib_path)
    print(f"[SUCCESS] Saved Decision Tree model binary to: {dt_joblib_path}")
    print(f"[SUCCESS] Saved Random Forest model binary to: {rf_joblib_path}")
    
    # Save comparison CSV
    comp_df = pd.DataFrame([
        {
            "model": "Dummy Baseline",
            "accuracy": baseline_metrics["accuracy"],
            "precision": baseline_metrics["precision"],
            "recall": baseline_metrics["recall"],
            "f1_score": baseline_metrics["f1_score"]
        },
        {
            "model": "Decision Tree (max_depth=5)",
            "accuracy": dt_eval["test_metrics"]["accuracy"],
            "precision": dt_eval["test_metrics"]["precision"],
            "recall": dt_eval["test_metrics"]["recall"],
            "f1_score": dt_eval["test_metrics"]["f1_score"]
        },
        {
            "model": "Random Forest (n=100, depth=7)",
            "accuracy": rf_eval["test_metrics"]["accuracy"],
            "precision": rf_eval["test_metrics"]["precision"],
            "recall": rf_eval["test_metrics"]["recall"],
            "f1_score": rf_eval["test_metrics"]["f1_score"]
        }
    ])
    comp_csv_path = os.path.join(models_dir, "skill_model_comparison.csv")
    comp_df.to_csv(comp_csv_path, index=False)
    print(f"[SUCCESS] Saved model comparison CSV to: {comp_csv_path}")
    
    # Save metrics JSON
    metrics_payload = {
        "target": "skill_level",
        "classes": ["Beginner", "Intermediate", "Advanced"],
        "baseline_dummy": baseline_metrics,
        "decision_tree": dt_eval,
        "random_forest": rf_eval,
        "preferred_model": "Random Forest" if rf_eval["test_metrics"]["f1_score"] >= dt_eval["test_metrics"]["f1_score"] else "Decision Tree"
    }
    metrics_json_path = os.path.join(models_dir, "skill_metrics.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[SUCCESS] Saved metrics JSON to: {metrics_json_path}")
    
    # Save feature importances CSVs
    dt_imp_csv = os.path.join(models_dir, "skill_decision_tree_feature_importance.csv")
    rf_imp_csv = os.path.join(models_dir, "skill_random_forest_feature_importance.csv")
    dt_imp_df.to_csv(dt_imp_csv, index=False)
    rf_imp_df.to_csv(rf_imp_csv, index=False)
    print(f"[SUCCESS] Saved Decision Tree feature importances to: {dt_imp_csv}")
    print(f"[SUCCESS] Saved Random Forest feature importances to: {rf_imp_csv}")
    
    # Generate plots
    generate_confusion_matrix_plot(
        dt_eval["confusion_matrix"],
        "Decision Tree: Skill Level Confusion Matrix",
        os.path.join(plots_dir, "skill_decision_tree_confusion_matrix.png")
    )
    generate_confusion_matrix_plot(
        rf_eval["confusion_matrix"],
        "Random Forest: Skill Level Confusion Matrix",
        os.path.join(plots_dir, "skill_random_forest_confusion_matrix.png")
    )
    generate_tree_plot(
        dt_model,
        list(X_train.columns),
        os.path.join(plots_dir, "skill_decision_tree.png")
    )
    generate_rf_importance_plot(
        rf_imp_df,
        os.path.join(plots_dir, "skill_random_forest_feature_importance.png")
    )
    
    print("\n--- SKILL LEVEL CLASSIFICATION EVALUATION SUMMARY ---")
    print(f"Baseline Accuracy: {baseline_metrics['accuracy']} | F1: {baseline_metrics['f1_score']}")
    print(f"Decision Tree Test Acc: {dt_eval['test_metrics']['accuracy']} | F1: {dt_eval['test_metrics']['f1_score']} (Train Acc: {dt_eval['train_metrics']['accuracy']})")
    print(f"Random Forest Test Acc: {rf_eval['test_metrics']['accuracy']} | F1: {rf_eval['test_metrics']['f1_score']} (Train Acc: {rf_eval['train_metrics']['accuracy']})")
    print(f"Top RF Feature: {rf_imp_df.iloc[0]['feature']} (Importance: {rf_imp_df.iloc[0]['importance']})")


if __name__ == "__main__":
    main()

