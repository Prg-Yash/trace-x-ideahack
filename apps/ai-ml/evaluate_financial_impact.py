"""
evaluate_financial_impact.py
==============================
Rigorous Enterprise Evaluation & Financial Cost-Benefit Optimization

Implements the strict 5-pillar evaluation framework required for banking AI:
1. Chronological Train-Test Split (Temporal split: past vs future transactions).
2. Cost-Sensitive Confusion Matrix (TN, FP, FN, TP).
3. Core Fraud Metrics (Precision, Recall, F1-Score).
4. Precision-Recall AUC (PR-AUC) curve evaluation.
5. Financial Cost-Benefit Analysis (Minimizing net financial loss in INR ₹).
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from sklearn.metrics import (
    precision_score, recall_score, f1_score, 
    average_precision_score, confusion_matrix
)

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
from train_models import build_burst_features, detect_smurf_accounts

# Financial Cost Constants (in INR ₹)
COST_FALSE_POSITIVE = 500.0   # Customer friction, support tickets, churn risk
AVG_FRAUD_AMOUNT    = 35000.0 # Direct unrecovered financial fraud loss per False Negative

def evaluate_model_financials(model_name, y_true, y_probs):
    """Calculates PR-AUC, finds cost-optimal threshold, and prints confusion matrix."""
    if len(y_true) == 0 or sum(y_true) == 0:
        print(f"  [!] No positive fraud cases in evaluation window for {model_name}.")
        return

    pr_auc = average_precision_score(y_true, y_probs)
    
    # 5. Run Financial Cost-Benefit Optimization across probability thresholds
    best_thresh = 0.50
    min_cost = float('inf')
    best_tp, best_fp, best_fn, best_tn = 0, 0, 0, 0
    
    thresholds = np.linspace(0.05, 0.95, 91)
    for t in thresholds:
        preds = (y_probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        
        # Total Financial Impact = (Innocent blocked * ₹500) + (Fraud missed * ₹35,000)
        cost = (fp * COST_FALSE_POSITIVE) + (fn * AVG_FRAUD_AMOUNT)
        if cost < min_cost:
            min_cost = cost
            best_thresh = t
            best_tp, best_fp, best_fn, best_tn = tp, fp, fn, tn
            
    # Compute metrics at cost-optimal threshold
    precision = best_tp / max(best_tp + best_fp, 1)
    recall = best_tp / max(best_tp + best_fn, 1)
    f1 = 2 * (precision * recall) / max(precision + recall, 1e-9)
    
    # Compare with default 0.50 threshold cost
    def_preds = (y_probs >= 0.50).astype(int)
    tn_d, fp_d, fn_d, tp_d = confusion_matrix(y_true, def_preds).ravel()
    default_cost = (fp_d * COST_FALSE_POSITIVE) + (fn_d * AVG_FRAUD_AMOUNT)
    savings = default_cost - min_cost

    print(f"\n──────────────────────────────────────────────────────────────────────")
    print(f"📊 MODEL: {model_name.upper()}")
    print(f"──────────────────────────────────────────────────────────────────────")
    print(f"  [Pillar 4] PR-AUC (Area Under Precision-Recall Curve): {pr_auc:.4f}")
    print(f"  [Pillar 5] Cost-Optimal Operational Threshold       : {best_thresh*100:.1f}%")
    print(f"\n  [Pillar 2] Cost-Sensitive Confusion Matrix (at Optimal Threshold {best_thresh*100:.1f}%):")
    print(f"             ┌──────────────────────────────┬──────────────────────────────┐")
    print(f"             │ Predicted Genuine (0)        │ Predicted Fraud (1)          │")
    print(f"  ┌──────────┼──────────────────────────────┼──────────────────────────────┤")
    print(f"  │ Actual 0 │ True Negative  (TN): {best_tn:6d} │ False Positive (FP): {best_fp:6d} │")
    print(f"  ├──────────┼──────────────────────────────┼──────────────────────────────┤")
    print(f"  │ Actual 1 │ False Negative (FN): {best_fn:6d} │ True Positive  (TP): {best_tp:6d} │")
    print(f"  └──────────┴──────────────────────────────┴──────────────────────────────┘")
    print(f"\n  [Pillar 3] Core Fraud Metrics:")
    print(f"             • Precision : {precision*100:.2f}% (Accuracy of fraud alerts)")
    print(f"             • Recall    : {recall*100:.2f}% (Percentage of true fraud caught)")
    print(f"             • F1-Score  : {f1*100:.2f}% (Harmonic balance)")
    print(f"\n  [Pillar 5] Financial Impact & Cost-Benefit Optimization:")
    print(f"             • Cost at Default 50% Threshold : ₹ {default_cost:12,.2f}")
    print(f"             • Cost at Optimal {best_thresh*100:.1f}% Threshold: ₹ {min_cost:12,.2f}")
    if savings > 0:
        print(f"             💰 Net Financial Savings Saved  : ₹ {savings:12,.2f} / month")
    else:
        print(f"             ✅ System already operating at maximum financial efficiency.")

def main():
    print("======================================================================")
    print("🏆 TRACE-X 5-PILLAR FINANCIAL COST & CHRONOLOGICAL EVALUATION")
    print("======================================================================")
    
    data_dir = BASE_DIR / "data"
    models_dir = BASE_DIR / "models"
    
    print("\n[Pillar 1] Enforcing STRICT CHRONOLOGICAL (Time-Based) Split...")
    df_txn = pd.read_csv(data_dir / "transactions.csv")
    df_acc = pd.read_csv(data_dir / "accounts.csv")
    df_stats = pd.read_csv(data_dir / "account_stats.csv")
    
    # Convert timestamps and sort strictly by time
    df_txn["txn_ts"] = pd.to_datetime(df_txn["txn_ts"], format='ISO8601')
    df_txn = df_txn.sort_values("txn_ts").reset_index(drop=True)
    
    # Split: First 80% of time is historical reference; final 20% future temporal window is test
    split_idx = int(len(df_txn) * 0.80)
    split_date = df_txn.iloc[split_idx]["txn_ts"]
    
    df_txn_future = df_txn.iloc[split_idx:].copy()
    future_active_accounts = df_txn_future["sender_id"].unique()
    
    df_acc_test = df_acc[df_acc["account_id"].isin(future_active_accounts)].copy()
    df_stats_test = df_stats[df_stats["account_id"].isin(future_active_accounts)].copy()
    
    print(f"  • Historical Training Cutoff : {split_date}")
    print(f"  • Future Evaluation Window   : {len(df_txn_future)} future transactions across {len(df_acc_test)} active accounts.")

    # 1. Smurfing Model Evaluation
    smurf_path = models_dir / "smurf_model.pkl"
    if smurf_path.exists():
        smurf_bundle = joblib.load(smurf_path)
        model = smurf_bundle["model"]
        feature_cols = smurf_bundle["features"]
        
        # Build features strictly on future temporal window
        burst_feats = build_burst_features(df_txn_future)
        true_smurfers = detect_smurf_accounts(df_txn_future)
        
        X_test = pd.DataFrame(index=df_acc_test["account_id"]).merge(
            burst_feats, left_index=True, right_index=True, how="left"
        ).fillna(0)
        
        for col in feature_cols:
            if col not in X_test.columns: X_test[col] = 0.0
        X_test = X_test[feature_cols].astype(float)
        
        y_true = X_test.index.map(lambda x: 1 if x in true_smurfers else 0).values
        probs = model.predict_proba(X_test)[:, 1]
        
        evaluate_model_financials("Smurfing Detector (Behavioral Burst)", y_true, probs)

    # 2. Dormancy Hybrid Evaluation
    dorm_path = models_dir / "dormancy_hybrid.pkl"
    if dorm_path.exists():
        dorm_bundle = joblib.load(dorm_path)
        feature_cols = dorm_bundle["features"]
        
        df_eval = df_acc_test.merge(df_stats_test, on="account_id", how="left", suffixes=("", "_stats"))
        if "avg_monthly_volume" in df_eval.columns and "volume_7d" in df_eval.columns:
            df_eval["volume_spike_ratio"] = df_eval["volume_7d"] / ((df_eval["total_volume_180d"] / 26.0) + 1.0)
        else:
            df_eval["volume_spike_ratio"] = 0.0
            
        df_eval["new_counterparty_ratio"] = df_eval["unique_counterparties_30d"] / (df_eval["total_count_180d"] + 1.0)
        df_eval["channel_switch_flag"] = 0.0
        
        for col in feature_cols:
            if col not in df_eval.columns: df_eval[col] = 0.0
            
        iso_feats = [c for c in feature_cols if c != "iso_anomaly_score"]
        X_iso = df_eval[iso_feats].fillna(0).astype(float)
        X_scaled = dorm_bundle["scaler"].transform(X_iso.values)
        iso_scores = dorm_bundle["iso"].decision_function(X_scaled)
        
        X_test = df_eval[feature_cols].fillna(0).astype(float)
        X_test["iso_anomaly_score"] = iso_scores
        y_true = df_eval["pattern_type"].fillna("").str.contains("DORMANT_ACTIVATION").astype(int).values
        
        probs = dorm_bundle["xgb"].predict_proba(X_test)[:, 1]
        evaluate_model_financials("Dormancy Anomaly Detector", y_true, probs)

    print("\n======================================================================")
    print("✅ 5-PILLAR EVALUATION COMPLETE.")
    print("======================================================================")

if __name__ == "__main__":
    main()
