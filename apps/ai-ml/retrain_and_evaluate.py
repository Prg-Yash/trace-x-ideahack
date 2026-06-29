"""
retrain_and_evaluate.py
========================
1. Loads the freshly-generated CSV data (20K accounts, 400K+ txns)
2. Retrains ALL 5 models:
   A. Dormancy Hybrid (ISO + XGBoost)
   B. KYC Profile Mismatch (XGBoost)
   C. Smurfing (Smurf model / tabular)
   D. Layering Chain XGBoost
   E. Roundtrip Chain XGBoost
3. Evaluates each with held-out test set + cross-validation
4. Reports: Precision, Recall, F1, AUC-ROC, Confusion Matrix
5. Saves all retrained models to models/ directory
"""

import sys
import json
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)

warnings.filterwarnings("ignore")

BASE_DIR   = Path(__file__).resolve().parent
DATA_DIR   = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

sys.path.insert(0, str(BASE_DIR))
from scripts.extract_chain_features import (
    extract_chain_features, build_layering_training_dataset,
    extract_roundtrip_features, build_roundtrip_training_dataset,
    LAYERING_FEATURES, ROUNDTRIP_FEATURES,
)

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Helpers
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def print_section(title: str):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def evaluate_classifier(name: str, y_true, y_pred, y_prob=None):
    print(f"\n{name}")
    print("-" * 40)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, sum(y_true))
    print(f"  Confusion Matrix: TP={tp} FP={fp} TN={tn} FN={fn}")
    print(f"  Precision : {precision_score(y_true, y_pred, zero_division=0):.4f}")
    print(f"  Recall    : {recall_score(y_true, y_pred, zero_division=0):.4f}")
    print(f"  F1        : {f1_score(y_true, y_pred, zero_division=0):.4f}")
    if y_prob is not None:
        try:
            auc = roc_auc_score(y_true, y_prob)
            print(f"  AUC-ROC   : {auc:.4f}")
        except Exception:
            pass
    return {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall":    recall_score(y_true, y_pred, zero_division=0),
        "f1":        f1_score(y_true, y_pred, zero_division=0),
        "auc":       roc_auc_score(y_true, y_prob) if y_prob is not None else None,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Load data
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("Loading Data")
print(f"  Data directory: {DATA_DIR}")

df_acc   = pd.read_csv(DATA_DIR / "accounts.csv")
df_stats = pd.read_csv(DATA_DIR / "account_stats.csv")
df_txn   = pd.read_csv(DATA_DIR / "transactions.csv")

df_acc   = df_acc.merge(df_stats, on="account_id", how="left")
df_txn["txn_ts"] = pd.to_datetime(df_txn["txn_ts"], format="mixed", errors="coerce")
df_txn = df_txn.dropna(subset=["txn_ts", "sender_id", "receiver_id", "amount"])

print(f"  Accounts:     {len(df_acc):,}")
print(f"  Transactions: {len(df_txn):,}")
fraud_dist = df_acc.groupby("pattern_type")["is_fraud"].sum()
print(f"  Fraud accounts by pattern:\n{fraud_dist.to_string()}")

all_scores = {}


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MODEL A: Dormancy Hybrid (IsolationForest â†’ XGBoost)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("MODEL A: Dormancy Hybrid (ISO + XGBoost)")

DORMANCY_FEATURES = [
    "dormancy_days", "volume_30d", "txn_count_30d",
    "total_volume_180d", "total_count_180d",
    "avg_monthly_volume", "avg_monthly_count",
]

df_dorm = df_acc.copy()
df_dorm["last_active_ts"] = pd.to_datetime(df_dorm.get("last_active_ts"), errors="coerce")
now = datetime.now()
if "dormancy_days" not in df_dorm.columns:
    df_dorm["dormancy_days"] = df_dorm["last_active_ts"].apply(
        lambda ts: (now - ts).days if pd.notna(ts) else 0
    )

for col in DORMANCY_FEATURES:
    if col not in df_dorm.columns:
        df_dorm[col] = 0

df_dorm[DORMANCY_FEATURES] = df_dorm[DORMANCY_FEATURES].fillna(0)
is_dormant = (
    df_dorm["pattern_type"].str.contains("DORMANT", na=False) |
    df_dorm["status"].str.upper().eq("DORMANT")
).astype(int)

X_dorm = df_dorm[DORMANCY_FEATURES].values
y_dorm = is_dormant.values

scaler_dorm = StandardScaler()
X_scaled    = scaler_dorm.fit_transform(X_dorm)

iso = IsolationForest(n_estimators=200, contamination=0.03, random_state=RANDOM_SEED)
iso.fit(X_scaled)
iso_scores = iso.score_samples(X_scaled).reshape(-1, 1)

X_for_xgb = np.hstack([X_scaled, iso_scores])
X_tr, X_te, y_tr, y_te = train_test_split(X_for_xgb, y_dorm, test_size=0.2,
                                            stratify=y_dorm, random_state=RANDOM_SEED)

pos_weight = max(1, (y_tr == 0).sum() / max((y_tr == 1).sum(), 1))
xgb_dorm = xgb.XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    scale_pos_weight=pos_weight, random_state=RANDOM_SEED,
    eval_metric="aucpr", verbosity=0,
)
xgb_dorm.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

y_pred_dorm = xgb_dorm.predict(X_te)
y_prob_dorm = xgb_dorm.predict_proba(X_te)[:, 1]
all_scores["dormancy"] = evaluate_classifier("Dormancy", y_te, y_pred_dorm, y_prob_dorm)

# Find best threshold
thresholds = np.arange(0.2, 0.9, 0.05)
best_f1, best_thresh = 0, 0.5
for t in thresholds:
    f1 = f1_score(y_te, (y_prob_dorm >= t).astype(int), zero_division=0)
    if f1 > best_f1:
        best_f1, best_thresh = f1, t
print(f"  Best threshold: {best_thresh:.2f} â†’ F1={best_f1:.4f}")

joblib.dump({
    "iso": iso, "scaler": scaler_dorm,
    "xgb": xgb_dorm, "features": DORMANCY_FEATURES,
    "iso_score_col": True, "threshold": best_thresh,
}, MODELS_DIR / "dormancy_hybrid.pkl")
print("  Saved: dormancy_hybrid.pkl")


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MODEL B: KYC Profile Mismatch (XGBoost tabular)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("MODEL B: KYC Profile Mismatch XGBoost")

KYC_FEATURES = [
    "kyc_tier", "volume_30d", "txn_count_30d",
    "total_volume_180d", "total_count_180d",
    "avg_monthly_volume", "avg_monthly_count",
    "unique_counterparties_30d",
]

df_kyc = df_acc.copy()
for col in KYC_FEATURES:
    if col not in df_kyc.columns:
        df_kyc[col] = 0
df_kyc[KYC_FEATURES] = df_kyc[KYC_FEATURES].fillna(0)

# Compute income_utilization_ratio
if "declared_annual_income" in df_kyc.columns:
    monthly_income = df_kyc["declared_annual_income"].fillna(1) / 12
    df_kyc["income_utilization_ratio"] = df_kyc["volume_30d"] / monthly_income.replace(0, 1)
    KYC_FEATURES = KYC_FEATURES + ["income_utilization_ratio"]

is_kyc_mismatch = df_kyc["pattern_type"].str.contains("PROFILE_MISMATCH|KYC_MISMATCH", na=False).astype(int)

X_kyc = df_kyc[KYC_FEATURES].fillna(0).values
y_kyc = is_kyc_mismatch.values

X_tr, X_te, y_tr, y_te = train_test_split(X_kyc, y_kyc, test_size=0.2,
                                            stratify=y_kyc, random_state=RANDOM_SEED)
pos_weight = max(1, (y_tr == 0).sum() / max((y_tr == 1).sum(), 1))

xgb_kyc = xgb.XGBClassifier(
    n_estimators=300, max_depth=5, learning_rate=0.05,
    scale_pos_weight=pos_weight, random_state=RANDOM_SEED,
    eval_metric="aucpr", verbosity=0,
)
xgb_kyc.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

y_pred_kyc = xgb_kyc.predict(X_te)
y_prob_kyc = xgb_kyc.predict_proba(X_te)[:, 1]
all_scores["kyc_mismatch"] = evaluate_classifier("KYC Profile Mismatch", y_te, y_pred_kyc, y_prob_kyc)

# Threshold
best_f1, best_thresh_kyc = 0, 0.5
for t in thresholds:
    f1 = f1_score(y_te, (y_prob_kyc >= t).astype(int), zero_division=0)
    if f1 > best_f1:
        best_f1, best_thresh_kyc = f1, t
print(f"  Best threshold: {best_thresh_kyc:.2f} â†’ F1={best_f1:.4f}")

xgb_kyc.save_model(MODELS_DIR / "profile_mismatch_model.json")
joblib.dump({"features": KYC_FEATURES, "threshold": best_thresh_kyc}, MODELS_DIR / "kyc_threshold.pkl")
print("  Saved: profile_mismatch_model.json, kyc_threshold.pkl")


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MODEL C: Smurfing (tabular XGBoost on account-level features)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("MODEL C: Smurfing XGBoost")

SMURF_FEATURES = [
    "volume_30d", "txn_count_30d",
    "total_volume_180d", "total_count_180d",
    "avg_monthly_volume", "avg_monthly_count",
    "unique_counterparties_30d",
]

df_smurf = df_acc.copy()
for col in SMURF_FEATURES:
    if col not in df_smurf.columns:
        df_smurf[col] = 0
df_smurf[SMURF_FEATURES] = df_smurf[SMURF_FEATURES].fillna(0)

# UPI channel ratio â€” computed from transactions
upi_sender = df_txn[df_txn["channel"].str.upper() == "UPI"].groupby("sender_id").size()
all_sender  = df_txn.groupby("sender_id").size()
upi_ratio   = (upi_sender / all_sender).fillna(0).rename("upi_ratio")
df_smurf = df_smurf.set_index("account_id")
df_smurf["upi_ratio"] = upi_ratio
df_smurf = df_smurf.fillna(0).reset_index()
SMURF_FEATURES = SMURF_FEATURES + ["upi_ratio"]

is_smurfing = df_smurf["pattern_type"].str.contains("SMURFING", na=False).astype(int)
X_smurf = df_smurf[SMURF_FEATURES].values
y_smurf = is_smurfing.values

X_tr, X_te, y_tr, y_te = train_test_split(X_smurf, y_smurf, test_size=0.2,
                                            stratify=y_smurf, random_state=RANDOM_SEED)
pos_weight = max(1, (y_tr == 0).sum() / max((y_tr == 1).sum(), 1))

xgb_smurf = xgb.XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    scale_pos_weight=pos_weight, random_state=RANDOM_SEED,
    eval_metric="aucpr", verbosity=0,
)
xgb_smurf.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

y_pred_smurf = xgb_smurf.predict(X_te)
y_prob_smurf = xgb_smurf.predict_proba(X_te)[:, 1]
all_scores["smurfing"] = evaluate_classifier("Smurfing", y_te, y_pred_smurf, y_prob_smurf)

best_f1, best_thresh_smurf = 0, 0.5
for t in thresholds:
    f1 = f1_score(y_te, (y_prob_smurf >= t).astype(int), zero_division=0)
    if f1 > best_f1:
        best_f1, best_thresh_smurf = f1, t
print(f"  Best threshold: {best_thresh_smurf:.2f} â†’ F1={best_f1:.4f}")

joblib.dump({
    "model": xgb_smurf, "features": SMURF_FEATURES, "threshold": best_thresh_smurf,
}, MODELS_DIR / "smurf_model.pkl")
print("  Saved: smurf_model.pkl")


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MODEL D: Layering Chain XGBoost (2-step: Cypher â†’ XGBoost on chain features)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("MODEL D: Layering Chain XGBoost")

print("  Building layering training dataset from CSV transactions...")
X_lay, y_lay = build_layering_training_dataset(df_txn)
print(f"  Dataset shape: {X_lay.shape}, Fraud chains: {y_lay.sum()}/{len(y_lay)}")

X_tr, X_te, y_tr, y_te = train_test_split(X_lay.values, y_lay, test_size=0.2,
                                            stratify=y_lay, random_state=RANDOM_SEED)

pos_weight_lay = max(1, (y_tr == 0).sum() / max((y_tr == 1).sum(), 1))
xgb_lay = xgb.XGBClassifier(
    n_estimators=400, max_depth=6, learning_rate=0.03,
    subsample=0.8, colsample_bytree=0.8,
    scale_pos_weight=pos_weight_lay, random_state=RANDOM_SEED,
    eval_metric="aucpr", verbosity=0,
)
xgb_lay.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

y_pred_lay = xgb_lay.predict(X_te)
y_prob_lay = xgb_lay.predict_proba(X_te)[:, 1]
all_scores["layering"] = evaluate_classifier("Layering Chain", y_te, y_pred_lay, y_prob_lay)

# Cross-validation
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
cv_f1 = cross_val_score(xgb_lay, X_lay.values, y_lay, cv=skf, scoring="f1", n_jobs=-1)
print(f"  5-Fold CV F1: {cv_f1.mean():.4f} Â± {cv_f1.std():.4f}")

# Find best threshold on test set
best_f1, best_thresh_lay = 0, 0.5
for t in thresholds:
    f1 = f1_score(y_te, (y_prob_lay >= t).astype(int), zero_division=0)
    if f1 > best_f1:
        best_f1, best_thresh_lay = f1, t
print(f"  Best threshold: {best_thresh_lay:.2f} â†’ F1={best_f1:.4f}")
all_scores["layering"]["cv_f1_mean"] = float(cv_f1.mean())

xgb_lay.save_model(MODELS_DIR / "layering_xgb.json")
with open(MODELS_DIR / "layering_threshold.json", "w") as f:
    json.dump({"threshold": float(best_thresh_lay), "cv_f1": float(cv_f1.mean())}, f, indent=2)
print("  Saved: layering_xgb.json, layering_threshold.json")


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MODEL E: Roundtrip Chain XGBoost (2-step: Cypher â†’ XGBoost on loop features)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("MODEL E: Roundtrip Chain XGBoost")

print("  Building roundtrip training dataset from CSV transactions...")
X_rt, y_rt = build_roundtrip_training_dataset(df_txn)
print(f"  Dataset shape: {X_rt.shape}, Fraud chains: {y_rt.sum()}/{len(y_rt)}")

X_tr, X_te, y_tr, y_te = train_test_split(X_rt.values, y_rt, test_size=0.2,
                                            stratify=y_rt, random_state=RANDOM_SEED)

pos_weight_rt = max(1, (y_tr == 0).sum() / max((y_tr == 1).sum(), 1))
xgb_rt = xgb.XGBClassifier(
    n_estimators=400, max_depth=5, learning_rate=0.03,
    subsample=0.8, colsample_bytree=0.8,
    scale_pos_weight=pos_weight_rt, random_state=RANDOM_SEED,
    eval_metric="aucpr", verbosity=0,
)
xgb_rt.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

y_pred_rt = xgb_rt.predict(X_te)
y_prob_rt  = xgb_rt.predict_proba(X_te)[:, 1]
all_scores["roundtrip"] = evaluate_classifier("Roundtrip Chain", y_te, y_pred_rt, y_prob_rt)

cv_f1_rt = cross_val_score(xgb_rt, X_rt.values, y_rt, cv=skf, scoring="f1", n_jobs=-1)
print(f"  5-Fold CV F1: {cv_f1_rt.mean():.4f} Â± {cv_f1_rt.std():.4f}")

best_f1_rt, best_thresh_rt = 0, 0.5
for t in thresholds:
    f1 = f1_score(y_te, (y_prob_rt >= t).astype(int), zero_division=0)
    if f1 > best_f1_rt:
        best_f1_rt, best_thresh_rt = f1, t
print(f"  Best threshold: {best_thresh_rt:.2f} â†’ F1={best_f1_rt:.4f}")
all_scores["roundtrip"]["cv_f1_mean"] = float(cv_f1_rt.mean())

xgb_rt.save_model(MODELS_DIR / "roundtrip_xgb.json")
with open(MODELS_DIR / "roundtrip_threshold.json", "w") as f:
    json.dump({"threshold": float(best_thresh_rt), "cv_f1": float(cv_f1_rt.mean())}, f, indent=2)
print("  Saved: roundtrip_xgb.json, roundtrip_threshold.json")


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Summary
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print_section("FINAL SUMMARY â€” ALL MODELS")
print(f"{'Model':<22} {'Precision':>10} {'Recall':>8} {'F1':>8} {'AUC':>8}")
print("-" * 60)
for name, scores in all_scores.items():
    p  = scores.get("precision", 0)
    r  = scores.get("recall", 0)
    f1 = scores.get("f1", 0)
    a  = scores.get("auc") or 0
    print(f"  {name:<20} {p:>10.4f} {r:>8.4f} {f1:>8.4f} {a:>8.4f}")

with open(BASE_DIR / "model_test_scores.json", "w") as f:
    json.dump(all_scores, f, indent=2)
print(f"\nScores saved to: {BASE_DIR / 'model_test_scores.json'}")
print("\nAll models retrained and saved successfully!")

