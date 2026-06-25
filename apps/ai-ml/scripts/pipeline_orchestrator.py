import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from sklearn.ensemble import IsolationForest
import os
import joblib
from pathlib import Path

# Import our custom feature engineering
from feature_engineering import build_training_features

def train_profile_mismatch_model(X, y):
    print(f"\n{'='*50}")
    print("Training Specialized Model: PROFILE_MISMATCH (XGBoost)")
    print(f"{'='*50}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    raw_weight = (len(y_train) - sum(y_train)) / sum(y_train) if sum(y_train) > 0 else 1.0
    scale_weight = min(15.0, raw_weight)
    
    model = xgb.XGBClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        scale_pos_weight=scale_weight,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # THRESHOLD TUNING
    print("\nRunning Threshold Tuning on Validation Set...")
    probs = model.predict_proba(X_test)[:, 1]
    
    best_thresh = 0.5
    best_f1 = 0.0
    for thresh in np.arange(0.1, 0.9, 0.05):
        preds = (probs >= thresh).astype(int)
        score = f1_score(y_test, preds, zero_division=0)
        if score > best_f1:
            best_f1 = score
            best_thresh = thresh
            
    print(f"Optimal Probability Threshold Found: {best_thresh:.2f} (F1: {best_f1:.2f})")
    
    y_pred = (probs >= best_thresh).astype(int)
    print("\n--- Classification Report (Optimized Threshold) ---")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Fraud"], zero_division=0))
    
    importances = pd.DataFrame({
        'Feature': X.columns,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False).head(10)
    
    print("\n--- Top 10 Feature Importances ---")
    print(importances.to_string(index=False))

    model_dir = Path(__file__).resolve().parent.parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "profile_mismatch_model.json"
    model.save_model(str(model_path))
    print(f"\nSaved: {model_path}")


def train_dormant_activation_model(X, y):
    print(f"\n{'='*50}")
    print("Training Specialized Model: DORMANT_ACTIVATION (Isolation Forest)")
    print(f"{'='*50}")
    
    # 1. Fix Dimensionality Dilution: Slice to strict core dormancy features
    core_features = ['dormancy_days', 'volume_7d', 'spike_ratio_7d', 'in_degree', 'out_degree']
    # Ensure only available columns are used
    cols_to_use = [c for c in core_features if c in X.columns]
    X_subset = X[cols_to_use]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_subset, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Calculate Data-Driven Contamination
    fraud_rate = y_train.mean()
    # Adding a 1.5x buffer, max 10%
    contamination = min(fraud_rate * 1.5, 0.10)
    print(f"Calibrated Contamination Rate: {contamination:.4f} (Actual fraud rate: {fraud_rate:.4f})")
    
    model = IsolationForest(
        n_estimators=200, 
        contamination=contamination, 
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train)
    
    # Predict (-1 is anomaly/fraud, 1 is normal)
    y_pred = model.predict(X_test)
    y_pred = np.where(y_pred == -1, 1, 0)
    
    print("\n--- Classification Report (Isolation Forest) ---")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Fraud"], zero_division=0))
    
    model_dir = Path(__file__).resolve().parent.parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "dormant_activation_model.pkl"
    joblib.dump(model, model_path)
    print(f"\nSaved: {model_path}")


def main():
    print("Initializing TRACE-X Orchestrator...")
    X, patterns = build_training_features()
    print(f"\nFinal feature matrix shape: {X.shape}")

    # Prepare targets
    y_dormant = patterns.apply(lambda p: 1 if "DORMANT_ACTIVATION" in str(p) else 0)
    y_profile = patterns.apply(lambda p: 1 if "PROFILE_MISMATCH" in str(p) else 0)

    # 2. Fix Cross-Pattern Contamination for XGBoost
    # Drop all rows associated with partner's patterns so XGBoost learns clean legitimate behavior
    partner_patterns = ['LAYERING', 'ROUND_TRIP', 'SMURFING']
    mask = ~patterns.apply(lambda p: any(pt in str(p) for pt in partner_patterns))
    
    X_profile_clean = X[mask]
    y_profile_clean = y_profile[mask]

    # Train Architecturally Aligned Models
    train_dormant_activation_model(X, y_dormant)
    train_profile_mismatch_model(X_profile_clean, y_profile_clean)

if __name__ == "__main__":
    main()
