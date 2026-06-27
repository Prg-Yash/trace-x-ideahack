import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import json
import xgboost as xgb
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score

BASE_DIR = Path(r"c:\Users\YASH\OneDrive\Documents\Yash Docs\Hackathons\Idea2.0\trace-x\apps\ai-ml")
sys.path.append(str(BASE_DIR))

from scripts.extract_chain_features import build_layering_training_dataset, build_roundtrip_training_dataset
from train_models import load_transactions

def evaluate_models():
    print("Loading transactions dataset...")
    df_txn = load_transactions()

    print("\n" + "="*50)
    print(" Evaluating Layering Model (Model D)")
    print("="*50)
    
    try:
        X_layering, y_layering = build_layering_training_dataset(df_txn, neg_multiplier=10, rng_seed=42)
        
        layering_xgb = xgb.XGBClassifier()
        layering_xgb.load_model(BASE_DIR / "models" / "layering_xgb.json")
        
        with open(BASE_DIR / "models" / "layering_threshold.json", "r") as f:
            layering_threshold = json.load(f)["threshold"]
            
        y_probs = layering_xgb.predict_proba(X_layering)[:, 1]
        y_pred = (y_probs >= layering_threshold).astype(int)
        
        p = precision_score(y_layering, y_pred, zero_division=0)
        r = recall_score(y_layering, y_pred, zero_division=0)
        f1 = f1_score(y_layering, y_pred, zero_division=0)
        auc = roc_auc_score(y_layering, y_probs)
        tn, fp, fn, tp = confusion_matrix(y_layering, y_pred).ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        print(f"Precision: {p:.4f}")
        print(f"Recall: {r:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print(f"AUC-ROC: {auc:.4f}")
        print(f"False Positive Rate (FPR): {fpr:.4f}")
        print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    except Exception as e:
        print(f"Error evaluating Layering Model: {e}")

    print("\n" + "="*50)
    print(" Evaluating Round-Trip Model (Model E)")
    print("="*50)
    
    try:
        X_rt, y_rt = build_roundtrip_training_dataset(df_txn, neg_multiplier=5)
        
        rt_xgb = xgb.XGBClassifier()
        rt_xgb.load_model(BASE_DIR / "models" / "roundtrip_xgb.json")
        
        with open(BASE_DIR / "models" / "roundtrip_threshold.json", "r") as f:
            rt_threshold = json.load(f)["threshold"]
            
        y_probs = rt_xgb.predict_proba(X_rt)[:, 1]
        y_pred = (y_probs >= rt_threshold).astype(int)
        
        p = precision_score(y_rt, y_pred, zero_division=0)
        r = recall_score(y_rt, y_pred, zero_division=0)
        f1 = f1_score(y_rt, y_pred, zero_division=0)
        auc = roc_auc_score(y_rt, y_probs)
        tn, fp, fn, tp = confusion_matrix(y_rt, y_pred).ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        print(f"Precision: {p:.4f}")
        print(f"Recall: {r:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print(f"AUC-ROC: {auc:.4f}")
        print(f"False Positive Rate (FPR): {fpr:.4f}")
        print(f"Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    except Exception as e:
        print(f"Error evaluating Round-Trip Model: {e}")

if __name__ == '__main__':
    evaluate_models()
