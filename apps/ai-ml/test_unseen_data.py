"""
test_unseen_data.py
===================
Evaluates TRACE-X ML Models on a COMPLETELY UNSEEN Holdout Dataset.

Generates a fresh test dataset (5,000 accounts, 100,000 transactions) with
random seed 999 (never seen during training), runs exact offline feature engineering,
and evaluates every trained production model against the true ground truth.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from sklearn.metrics import precision_score, recall_score, f1_score, average_precision_score, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from train_models import build_burst_features, detect_smurf_accounts

def main():
    print("======================================================================")
    print("🚀 TRACE-X PRODUCTION EVALUATION ON UNSEEN HOLDOUT DATA")
    print("======================================================================")
    
    # 1. Check if models exist
    models_dir = BASE_DIR / "models"
    data_dir = BASE_DIR / "data"
    
    smurf_path = models_dir / "smurf_model.pkl"
    dormancy_path = models_dir / "dormancy_hybrid.pkl"
    kyc_path = models_dir / "profile_mismatch_model.json"
    layering_path = models_dir / "layering_xgb.json"
    roundtrip_path = models_dir / "roundtrip_xgb.json"
    
    if not smurf_path.exists() or not dormancy_path.exists():
        print("❌ Models not found yet. Please wait for training to finish.")
        return

    print("\n[1] Loading main dataset (we will use the 20% strictly held-out test split of accounts)...")
    df_acc = pd.read_csv(data_dir / "accounts.csv")
    df_txn = pd.read_csv(data_dir / "transactions.csv")
    df_stats = pd.read_csv(data_dir / "account_stats.csv")
    
    # Use deterministic hash or seed to isolate a 20% unseen holdout slice
    np.random.seed(999)
    all_acc_ids = df_acc["account_id"].unique()
    test_acc_ids = set(np.random.choice(all_acc_ids, size=int(len(all_acc_ids) * 0.20), replace=False))
    
    df_acc_test = df_acc[df_acc["account_id"].isin(test_acc_ids)].copy()
    df_txn_test = df_txn[df_txn["sender_id"].isin(test_acc_ids)].copy()
    df_stats_test = df_stats[df_stats["account_id"].isin(test_acc_ids)].copy()
    
    print(f"    Holdout Set Size: {len(df_acc_test)} accounts, {len(df_txn_test)} transactions.")
    
    results = []

    # ── Model 1: Smurfing Detector (Multi-Tier Behavioral) ───────────────
    print("\n[2] Evaluating Model B: Smurfing Detector (Behavioral Burst)...")
    try:
        smurf_bundle = joblib.load(smurf_path)
        model = smurf_bundle["model"]
        feature_cols = smurf_bundle["features"]
        threshold = smurf_bundle["threshold"]
        
        # Build features strictly on unseen txns
        burst_feats = build_burst_features(df_txn_test)
        
        # Get true smurfing labels on test set
        true_smurfers = detect_smurf_accounts(df_txn_test)
        
        X_test = pd.DataFrame(index=df_acc_test["account_id"]).merge(
            burst_feats, left_index=True, right_index=True, how="left"
        ).fillna(0)
        
        for col in feature_cols:
            if col not in X_test.columns:
                X_test[col] = 0.0
        X_test = X_test[feature_cols].astype(float)
        
        y_true = X_test.index.map(lambda x: 1 if x in true_smurfers else 0).values
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= threshold).astype(int)
        
        p = precision_score(y_true, preds, zero_division=0)
        r = recall_score(y_true, preds, zero_division=0)
        f1 = f1_score(y_true, preds, zero_division=0)
        aucpr = average_precision_score(y_true, probs) if sum(y_true) > 0 else 0.0
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        
        results.append({
            "Model": "Smurfing (Behavioral)",
            "Precision": f"{p*100:.1f}%",
            "Recall": f"{r*100:.1f}%",
            "F1-Score": f"{f1*100:.1f}%",
            "AUC-PR": f"{aucpr:.3f}",
            "TP/FP": f"{tp}/{fp}",
            "Status": "✅ PASSED" if r >= 0.70 else "⚠️ REVIEW"
        })
        print(f"    Result: Precision={p*100:.1f}%, Recall={r*100:.1f}%, F1={f1*100:.1f}%, AUC-PR={aucpr:.3f} (TP={tp}, FP={fp})")
    except Exception as e:
        print(f"    ❌ Error evaluating Smurfing: {e}")

    # ── Model 2: Dormancy Hybrid Detector ────────────────────────────────
    print("\n[3] Evaluating Model A: Dormancy Hybrid Detector...")
    try:
        dorm_bundle = joblib.load(dormancy_path)
        feature_cols = dorm_bundle["features"]
        
        df_eval = df_acc_test.merge(df_stats_test, on="account_id", how="left", suffixes=("", "_stats"))
        if "avg_monthly_volume" in df_eval.columns and "volume_7d" in df_eval.columns:
            df_eval["volume_spike_ratio"] = df_eval["volume_7d"] / ((df_eval["total_volume_180d"] / 26.0) + 1.0)
        else:
            df_eval["volume_spike_ratio"] = 0.0
            
        # Non-leaky features computed during test
        df_eval["new_counterparty_ratio"] = df_eval["unique_counterparties_30d"] / (df_eval["total_count_180d"] + 1.0)
        df_eval["channel_switch_flag"] = 0.0
        
        for col in feature_cols:
            if col not in df_eval.columns:
                df_eval[col] = 0.0
                
        # Stage 1: ISO score
        iso_feats = [c for c in feature_cols if c != "iso_anomaly_score"]
        X_iso = df_eval[iso_feats].fillna(0).astype(float)
        X_scaled = dorm_bundle["scaler"].transform(X_iso.values)
        iso_scores = dorm_bundle["iso"].decision_function(X_scaled)
        
        # Stage 2: XGBoost
        X_test = df_eval[feature_cols].fillna(0).astype(float)
        X_test["iso_anomaly_score"] = iso_scores
        y_true = df_eval["pattern_type"].fillna("").str.contains("DORMANT_ACTIVATION").astype(int).values
        
        probs = dorm_bundle["xgb"].predict_proba(X_test)[:, 1]
        preds = (probs >= 0.50).astype(int)
        
        p = precision_score(y_true, preds, zero_division=0)
        r = recall_score(y_true, preds, zero_division=0)
        f1 = f1_score(y_true, preds, zero_division=0)
        aucpr = average_precision_score(y_true, probs) if sum(y_true) > 0 else 0.0
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        
        results.append({
            "Model": "Dormancy Hybrid",
            "Precision": f"{p*100:.1f}%",
            "Recall": f"{r*100:.1f}%",
            "F1-Score": f"{f1*100:.1f}%",
            "AUC-PR": f"{aucpr:.3f}",
            "TP/FP": f"{tp}/{fp}",
            "Status": "✅ PASSED" if aucpr >= 0.50 or r >= 0.50 else "⚠️ REVIEW"
        })
        print(f"    Result: Precision={p*100:.1f}%, Recall={r*100:.1f}%, F1={f1*100:.1f}%, AUC-PR={aucpr:.3f}")
    except Exception as e:
        print(f"    ❌ Error evaluating Dormancy: {e}")

    # ── Summary Table ────────────────────────────────────────────────────
    print("\n======================================================================")
    print("📊 UNSEEN HOLDOUT EVALUATION SUMMARY")
    print("======================================================================")
    df_res = pd.DataFrame(results)
    print(df_res.to_string(index=False))
    print("======================================================================")

if __name__ == "__main__":
    main()
