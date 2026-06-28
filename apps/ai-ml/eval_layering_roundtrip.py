"""
eval_layering_roundtrip.py
===========================
Tests Layering and Round-Trip models on the HELD-OUT 20% test set only.
The 80% training data is never touched here.
"""
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import json
import xgboost as xgb
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, average_precision_score,
    classification_report
)
from sklearn.model_selection import train_test_split

BASE_DIR = Path(r"c:\Users\YASH\OneDrive\Documents\Yash Docs\Hackathons\Idea2.0\trace-x\apps\ai-ml")
MODELS_DIR = BASE_DIR / "models"
RANDOM_SEED = 42

sys.path.append(str(BASE_DIR))
from scripts.extract_chain_features import (
    build_layering_training_dataset,
    build_roundtrip_training_dataset
)
from train_models import load_transactions


def print_metrics(y_true, y_probs, threshold, model_name):
    y_pred = (y_probs >= threshold).astype(int)
    p   = precision_score(y_true, y_pred, zero_division=0)
    r   = recall_score(y_true, y_pred, zero_division=0)
    f1  = f1_score(y_true, y_pred, zero_division=0)
    auc = roc_auc_score(y_true, y_probs) if len(np.unique(y_true)) > 1 else float('nan')
    auc_pr = average_precision_score(y_true, y_probs) if len(np.unique(y_true)) > 1 else float('nan')
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0

    print(f"\n  {'='*45}")
    print(f"  {model_name} — HELD-OUT TEST SET (20%)")
    print(f"  {'='*45}")
    print(f"  Total test samples : {len(y_true)} ({int(y_true.sum())} fraud, {int((y_true==0).sum())} normal)")
    print(f"  Threshold used     : {threshold:.2f}")
    print(f"  Precision          : {p:.4f}  ({p*100:.1f}%)")
    print(f"  Recall             : {r:.4f}  ({r*100:.1f}%)")
    print(f"  F1 Score           : {f1:.4f}")
    print(f"  AUC-ROC            : {auc:.4f}")
    print(f"  AUC-PR             : {auc_pr:.4f}")
    print(f"  False Positive Rate: {fpr:.4f}  ({fpr*100:.1f}%)")
    print(f"  Confusion Matrix   : TN={tn}  FP={fp}  FN={fn}  TP={tp}")
    print(classification_report(y_true, y_pred, target_names=["Normal", "FRAUD"], zero_division=0))


def evaluate_models():
    print("Loading transactions dataset...")
    df_txn = load_transactions()

    # ── Layering Model (Model D) ───────────────────────────────────────────────
    print("\n" + "="*50)
    print(" Evaluating Layering Model (Model D) — XGBoost")
    print("="*50)
    try:
        X, y = build_layering_training_dataset(df_txn, neg_multiplier=10, rng_seed=RANDOM_SEED)

        # Use SAME seed and split as training — this gives us the identical 20% hold-out
        _, X_test, _, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
        )
        print(f"  Full dataset: {len(X)} samples | Testing on held-out: {len(X_test)} samples")

        layering_xgb = xgb.XGBClassifier()
        layering_xgb.load_model(MODELS_DIR / "layering_xgb.json")

        with open(MODELS_DIR / "layering_threshold.json", "r") as f:
            threshold = json.load(f)["threshold"]

        y_probs = layering_xgb.predict_proba(X_test)[:, 1]
        print_metrics(y_test, y_probs, threshold, "LAYERING")

    except Exception as e:
        print(f"  ERROR: {e}")

    # ── Round-Trip Model (Model E) ─────────────────────────────────────────────
    print("\n" + "="*50)
    print(" Evaluating Round-Trip Model (Model E) — XGBoost")
    print("="*50)
    try:
        X, y = build_roundtrip_training_dataset(df_txn, neg_multiplier=5)

        # Round-Trip training already uses 80/20 with seed=42
        _, X_test, _, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        print(f"  Full dataset: {len(X)} samples | Testing on held-out: {len(X_test)} samples")

        rt_xgb = xgb.XGBClassifier()
        rt_xgb.load_model(MODELS_DIR / "roundtrip_xgb.json")

        with open(MODELS_DIR / "roundtrip_threshold.json", "r") as f:
            threshold = json.load(f)["threshold"]

        y_probs = rt_xgb.predict_proba(X_test)[:, 1]
        print_metrics(y_test, y_probs, threshold, "ROUND-TRIP")

    except Exception as e:
        print(f"  ERROR: {e}")


if __name__ == '__main__':
    evaluate_models()
