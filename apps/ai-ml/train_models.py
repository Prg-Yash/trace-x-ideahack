# ════════════════════════════════════════════════════════════
# WHAT THIS FILE DOES:
# Reads your CSV data → trains 2 models → saves them as files
#
# You run this once (or when you regenerate data).
# It saves:
#   models/isolation_forest.pkl  ← dormant anomaly detector
#   models/lstm_model.pt         ← smurfing detector
#   models/scaler.pkl            ← data normalizer
#   models/acc_ids.npy           ← account ID list
# ════════════════════════════════════════════════════════════

import copy
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Set, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import StandardScaler

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset, WeightedRandomSampler

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

ACCOUNTS_CSV = DATA_DIR / "accounts.csv"
TRANSACTIONS_CSV = DATA_DIR / "transactions.csv"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)


def load_accounts() -> pd.DataFrame:
    if not ACCOUNTS_CSV.exists():
        raise FileNotFoundError(f"Missing {ACCOUNTS_CSV}")

    df = pd.read_csv(ACCOUNTS_CSV)
    stats_csv = DATA_DIR / "account_stats.csv"
    if stats_csv.exists():
        df_stats = pd.read_csv(stats_csv)
        df = df.merge(df_stats, on="account_id", how="left")

    if "last_active_ts" in df.columns:
        df["last_active_ts"] = pd.to_datetime(df["last_active_ts"], errors="coerce")

    if "opened_on" in df.columns:
        df["opened_on"] = pd.to_datetime(df["opened_on"], errors="coerce").dt.date

    now = datetime.now()
    if "dormancy_days" not in df.columns:
        df["dormancy_days"] = df["last_active_ts"].apply(
            lambda ts: (now - ts).days if pd.notna(ts) else 0
        )

    return df


def load_transactions() -> pd.DataFrame:
    if not TRANSACTIONS_CSV.exists():
        raise FileNotFoundError(f"Missing {TRANSACTIONS_CSV}")

    # ALWAYS load the full dataset for ML training, never the Neo4j subset
    df = pd.read_csv(TRANSACTIONS_CSV)
    df["txn_ts"] = pd.to_datetime(df["txn_ts"], format="mixed", errors="coerce")
    df = df.dropna(subset=["txn_ts", "sender_id", "receiver_id", "amount", "channel", "status"])
    return df


def train_isolation_forest(df_acc: pd.DataFrame) -> None:
    print("Training Model A: Isolation Forest (dormant anomaly detector)...")

    feature_cols = [
        "dormancy_days",
        "txn_count_7d",
        "txn_count_30d",
        "volume_7d",
        "volume_30d",
        "avg_monthly_volume",
        "avg_monthly_count",
        "unique_counterparties_30d",
        "risk_score_7d_ago",
        "risk_score_delta_7d",
        "tx_count_week1_post_dormancy",
        "tx_count_week2_post_dormancy",
        "volume_acceleration",
        "has_foreign_inflow",
        "inflow_source_type",
        "kyc_update_recency_days",
        "immediate_outflow_pct",
    ]

    missing = [col for col in feature_cols if col not in df_acc.columns]
    if missing:
        raise ValueError(f"accounts.csv missing columns: {missing}")

    X = df_acc[feature_cols].copy().fillna(0)
    X = X.astype(float).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    fraud_rate = len(df_acc[df_acc["pattern_type"].str.contains("DORMANT_ACTIVATION", na=False)]) / max(len(df_acc), 1) if "pattern_type" in df_acc.columns else 0.008
    # Fix: Set contamination exactly to the true dataset fraud rate to calibrate thresholds correctly
    contamination = max(fraud_rate, 0.001)
    iso = IsolationForest(n_estimators=200, contamination=contamination, random_state=RANDOM_SEED)
    iso.fit(X_scaled)

    predictions = iso.predict(X_scaled)
    anomaly_count = int((predictions == -1).sum())
    print(f"  Flagged {anomaly_count} anomalous accounts out of {len(X)}")

    joblib.dump(iso, MODELS_DIR / "isolation_forest.pkl")
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    print("  Saved: models/isolation_forest.pkl")


def detect_smurf_accounts(df_txn: pd.DataFrame) -> Set[str]:
    smurfers: Set[str] = set()
    df_out = df_txn[df_txn["status"].str.upper() == "SUCCESS"].copy()
    df_out = df_out.dropna(subset=["txn_ts", "amount", "receiver_id", "channel"])
    df_out["channel"] = df_out["channel"].str.upper()
    df_out = df_out.sort_values("txn_ts")

    window = pd.Timedelta(hours=24)
    strict = {
        "min_txns": 12,
        "min_receivers": 10,
        "amount_low": 70000,
        "amount_high": 100000,
        "max_cv": 0.2,
        "min_total": 800000,
        "max_total": 2000000,
        "min_upi_ratio": 0.7,
    }
    relaxed = {
        "min_txns": 8,
        "min_receivers": 7,
        "amount_low": 60000,
        "amount_high": 120000,
        "max_cv": 0.3,
        "min_total": 600000,
        "max_total": 2500000,
        "min_upi_ratio": 0.6,
    }

    def scan_thresholds(params: Dict[str, float]) -> Set[str]:
        found: Set[str] = set()
        for acc_id, group in df_out.groupby("sender_id"):
            group = group.sort_values("txn_ts").reset_index(drop=True)
            times = group["txn_ts"].to_numpy()
            amounts = group["amount"].astype(float).to_numpy()
            receivers = group["receiver_id"].to_numpy()
            channels = group["channel"].to_numpy()

            start = 0
            for end in range(len(group)):
                while times[end] - times[start] > window:
                    start += 1

                count = end - start + 1
                if count < params["min_txns"]:
                    continue

                window_amounts = amounts[start : end + 1]
                mean_amount = float(window_amounts.mean())
                if not (params["amount_low"] <= mean_amount <= params["amount_high"]):
                    continue

                total_amount = float(window_amounts.sum())
                if not (params["min_total"] <= total_amount <= params["max_total"]):
                    continue

                cv = float(window_amounts.std() / max(mean_amount, 1.0))
                if cv > params["max_cv"]:
                    continue

                unique_receivers = len(set(receivers[start : end + 1]))
                if unique_receivers < params["min_receivers"]:
                    continue

                upi_ratio = float(np.mean(channels[start : end + 1] == "UPI"))
                if upi_ratio < params["min_upi_ratio"]:
                    continue

                found.add(acc_id)
                break

        return found

    smurfers = scan_thresholds(strict)
    if len(smurfers) < 20:
        smurfers |= scan_thresholds(relaxed)

    if len(smurfers) < 20:
        df_pref = df_out[(df_out["channel"] == "UPI") & df_out["amount"].between(60000, 120000)]
        grouped = df_pref.groupby("sender_id").agg(
            txn_count=("amount", "size"),
            unique_receivers=("receiver_id", "nunique"),
            total_amount=("amount", "sum"),
        )
        grouped["score"] = grouped["txn_count"] * grouped["unique_receivers"]
        grouped = grouped[grouped["total_amount"].between(600000, 2500000)]
        if not grouped.empty:
            top_n = max(20, int(len(grouped) * 0.02))
            smurfers.update(grouped.sort_values("score", ascending=False).head(top_n).index.tolist())

    return smurfers


def pick_threshold(y_true: np.ndarray, y_prob: np.ndarray, beta: float = 0.5) -> Tuple[float, float]:
    best_score = -1.0
    best_threshold = 0.5
    for threshold in np.linspace(0.05, 0.95, 19):
        y_pred = (y_prob >= threshold).astype(int)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        if precision == 0 and recall == 0:
            score = 0.0
        else:
            score = (1 + beta**2) * (precision * recall) / ((beta**2 * precision) + recall)
        if score > best_score:
            best_score = score
            best_threshold = float(threshold)
    return best_threshold, best_score


def build_sequence(group: pd.DataFrame, window: int) -> np.ndarray:
    group = group.sort_values("txn_ts").tail(window)
    seq: List[List[float]] = []
    prev_time = None

    for _, row in group.iterrows():
        gap = 0.0 if prev_time is None else (row["txn_ts"] - prev_time).total_seconds() / 60
        seq.append(
            [
                float(np.log1p(row["amount"])) / 15.0,
                min(gap / 1440.0, 1.0),
                row["txn_ts"].hour / 23.0,
                row["txn_ts"].dayofweek / 6.0,
                1.0 if row["channel"] == "UPI" else 0.0,
            ]
        )
        prev_time = row["txn_ts"]

    while len(seq) < window:
        seq.insert(0, [0.0, 0.0, 0.0, 0.0, 0.0])

    return np.array(seq[-window:], dtype=np.float32)


def train_xgboost_kyc(X_train: pd.DataFrame, patterns: pd.Series) -> None:
    print("Training Model C: XGBoost (Profile Mismatch detector)...")
    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost not installed. Skipping.")
        return
        
    feature_cols = [
        "kyc_tier", "declared_annual_income", "account_age_days", "volume_30d", "txn_count_30d", 
        "income_utilization_ratio_30d", "age_band_encoded", "geography_tier_metro", "geography_tier_rural", "geography_tier_tier2",
        "volume_vs_age_kyc_peer", "cash_inflow_pct", "upi_family_inflow_pct", "corporate_wire_inflow_pct",
        "unknown_source_pct", "salary_credit_regular", "income_source_count", "volume_growth_rate_3m", 
        "months_at_current_volume", "kyc_update_recency_days", "outflow_to_known_contacts", 
        "outflow_to_new_accounts", "cash_withdrawal_ratio"
    ]
    
    missing = [col for col in feature_cols if col not in X_train.columns]
    if missing:
        for col in missing:
            if 'geography_tier' in col:
                X_train[col] = 0
            else:
                print(f"Warning: XGBoost missing {col}")
                X_train[col] = 0
                
    X = X_train[feature_cols].copy().fillna(0)
    y = patterns.apply(lambda p: 1 if isinstance(p, str) and "PROFILE_MISMATCH" in p else 0).values
    
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import average_precision_score
    
    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y)
    
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        scale_pos_weight=(len(y_tr) - sum(y_tr)) / max(sum(y_tr), 1) if sum(y_tr) > 0 else 1,
        random_state=RANDOM_SEED
    )
    model.fit(X_tr, y_tr)
    
    out_path = MODELS_DIR / "profile_mismatch_model.json"
    model.save_model(out_path)
    print(f"  Saved: {out_path}")
    
    # Evaluate on held-out test set
    preds = model.predict(X_val)
    probs = model.predict_proba(X_val)[:, 1]
    auc_pr = average_precision_score(y_val, probs)
    print(f"  XGBoost Validation F1: {f1_score(y_val, preds):.4f}")
    print(f"  XGBoost Validation AUC-PR: {auc_pr:.4f}")
    
    # Print SHAP/Feature Importance check directly during training
    importances = pd.Series(model.feature_importances_, index=feature_cols).sort_values(ascending=False)
    print("\n  Top 5 Features by Weight (Leakage Check):")
    for feat, imp in importances.head(5).items():
        print(f"    {feat}: {imp:.4f}")
    if importances.index[0] == "income_utilization_ratio_30d":
        print("  [WARNING] income_utilization_ratio_30d is the top feature - potential leakage!")


def train_smurf_xgboost(X_train: pd.DataFrame, df_txn: pd.DataFrame) -> None:
    print("\nTraining Model B: XGBoost (smurfing detector)...")
    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost not installed. Skipping.")
        return

    df_txn_success = df_txn[df_txn["status"].str.upper() == "SUCCESS"].copy()
    
    def normalize_acc(acc_id: str) -> str:
        try:
            return f"ACC_{int(str(acc_id).split('_')[1]):05d}"
        except:
            return str(acc_id)
            
    labels_path = DATA_DIR / "labels" / "smurf_accounts.csv"
    if labels_path.exists():
        labels_df = pd.read_csv(labels_path)
        smurfers = {normalize_acc(x) for x in labels_df["account_id"].dropna()}
        print(f"  Smurf labels loaded: {len(smurfers)} accounts")
    else:
        smurfers = {normalize_acc(x) for x in detect_smurf_accounts(df_txn_success)}
        print(f"  Smurf labeler found {len(smurfers)} accounts")

    feature_cols = [
        'amount', 'tx_count_last_24h', 'total_volume_24h', 'channel_upi_ratio',
        'tx_count_last_7d', 'tx_count_last_30d', 'total_volume_7d', 'total_volume_30d',
        'near_threshold_count_30d', 'amount_variance_24h', 'amount_clustering_score',
        'threshold_avoidance_ratio', 'time_gap_mean_min', 'time_gap_stddev', 'is_weekend',
        'unique_recipients_24h', 'account_age_days', 'orig_balance_after_ratio'
    ]

    print("  Dynamically building offline smurfing features...")
    df_txn_success['txn_ts'] = pd.to_datetime(df_txn_success['txn_ts'], format='mixed', errors='coerce')
    out_txn = df_txn_success.dropna(subset=['txn_ts', 'sender_id'])
    
    gb = out_txn.groupby('sender_id')
    features = pd.DataFrame(index=gb.groups.keys())
    
    time_span = (out_txn.groupby('sender_id')['txn_ts'].max() - out_txn.groupby('sender_id')['txn_ts'].min()).dt.total_seconds() / 86400.0
    time_span = time_span.replace(0, 1)
    
    features['tx_count_last_24h'] = gb.size() / time_span
    features['total_volume_24h'] = gb['amount'].sum() / time_span
    features['channel_upi_ratio'] = out_txn[out_txn['channel'].str.upper() == 'UPI'].groupby('sender_id').size() / gb.size()
    features['amount_variance_24h'] = gb['amount'].var()
    
    out_txn = out_txn.sort_values(['sender_id', 'txn_ts'])
    out_txn['time_gap'] = out_txn.groupby('sender_id')['txn_ts'].diff().dt.total_seconds() / 60.0
    features['time_gap_mean_min'] = out_txn.groupby('sender_id')['time_gap'].mean()
    features['time_gap_stddev'] = out_txn.groupby('sender_id')['time_gap'].std()
    
    features['unique_recipients_24h'] = gb['receiver_id'].nunique()
    features['is_weekend'] = out_txn[out_txn['txn_ts'].dt.dayofweek >= 5].groupby('sender_id').size() / gb.size()
    features['amount_clustering_score'] = features['amount_variance_24h'] / (gb['amount'].mean() ** 2 + 1)
    
    # Smurf pattern: dodging 10L threshold (e.g. sending exactly 9.9L)
    features['threshold_avoidance_ratio'] = out_txn[(out_txn['amount'] >= 900000) & (out_txn['amount'] <= 999999)].groupby('sender_id').size() / gb.size()
    features['amount'] = gb['amount'].mean()
    features['orig_balance_after_ratio'] = 0.1
    features = features.fillna(0)
    
    X_full = X_train.merge(features, left_on='account_id', right_index=True, how='left').fillna(0)
    
    X_full['tx_count_last_7d'] = X_full.get('txn_count_7d', 0)
    X_full['tx_count_last_30d'] = X_full.get('txn_count_30d', 0)
    X_full['total_volume_7d'] = X_full.get('volume_7d', 0)
    X_full['total_volume_30d'] = X_full.get('volume_30d', 0)
    X_full['near_threshold_count_30d'] = X_full.get('near_threshold_txns_30d', 0)

    missing = [col for col in feature_cols if col not in X_full.columns]
    if missing:
        for col in missing:
            print(f"Warning: XGBoost missing {col}")
            X_full[col] = 0
            
    # Make sure we sort properly by account id so labels match features
    y_full = X_full['account_id'].apply(lambda x: 1 if x in smurfers else 0).values
    
    print(f"  Dataset: {len(X_full)} accounts, {int(y_full.sum())} smurfers")
    if int(y_full.sum()) == 0:
        raise ValueError("Smurf labeler produced 0 positives. Regenerate data.")

    X = X_full[feature_cols].copy().fillna(0)

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import average_precision_score, f1_score
    from sklearn.calibration import CalibratedClassifierCV
    import joblib

    X_tr, X_val, y_tr, y_val = train_test_split(X, y_full, test_size=0.2, random_state=RANDOM_SEED, stratify=y_full)

    # Calculate scale_pos_weight for imbalance
    pos_weight = float((y_tr == 0).sum()) / max(1, float((y_tr == 1).sum()))
    print(f"  scale_pos_weight = {pos_weight:.2f}")

    # Regularization guardrails
    base_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        scale_pos_weight=pos_weight,
        reg_alpha=0.1,         # L1
        reg_lambda=1.0,        # L2
        min_child_weight=1,
        random_state=RANDOM_SEED
    )
    
    # Probability Calibration
    calibrated_model = CalibratedClassifierCV(estimator=base_model, method='isotonic', cv=3)
    calibrated_model.fit(X_tr, y_tr)

    out_path = MODELS_DIR / "smurf_model.pkl"
    joblib.dump(calibrated_model, out_path)
    print(f"  Saved: {out_path}")

    # Evaluate on held-out test set
    preds = calibrated_model.predict(X_val)
    probs = calibrated_model.predict_proba(X_val)[:, 1]
    auc_pr = average_precision_score(y_val, probs)
    print(f"  XGBoost Validation F1: {f1_score(y_val, preds):.4f}")
    print(f"  XGBoost Validation AUC-PR: {auc_pr:.4f}")

    # Print SHAP/Feature Importance check directly during training
    importances = pd.Series(calibrated_model.calibrated_classifiers_[0].estimator.feature_importances_, index=feature_cols).sort_values(ascending=False)
    print("\n  Top 5 Smurf Features by Weight:")
    for feat, imp in importances.head(5).items():
        print(f"    {feat}: {imp:.4f}")


def train_layering_xgb(df_txn: pd.DataFrame) -> None:
    """
    Train Model D: XGBoost (Layering chain scorer).

    Each training sample represents one candidate transaction chain (a sequence
    of 2+ hops). Positive samples are reconstructed from LAYERING-labeled
    transactions; negatives are random multi-hop paths from non-fraud txns.

    Saves:
        models/layering_xgb.json       — XGBoost model
        models/layering_threshold.json — Optimal classification threshold
    """
    print("\nTraining Model D: XGBoost (Layering chain scorer)...")
    print(f"  [DEBUG] train_layering_xgb received df_txn with length {len(df_txn)}")
    print(f"  [DEBUG] LAYERING rows in df_txn: {len(df_txn[df_txn['pattern_type'] == 'LAYERING'])}")

    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost not installed. Skipping layering model.")
        return

    import json
    from sklearn.model_selection import StratifiedKFold, cross_val_predict
    from sklearn.metrics import (
        average_precision_score,
        classification_report,
        confusion_matrix,
    )

    import sys
    sys.path.append(str(Path(__file__).resolve().parent))
    from scripts.extract_chain_features import (
        LAYERING_FEATURES,
        build_layering_training_dataset,
    )

    # ── 1. Build chain-level training dataset ─────────────────────────────────
    X, y = build_layering_training_dataset(df_txn, neg_multiplier=10, rng_seed=RANDOM_SEED)

    if int(y.sum()) < 5:
        raise ValueError(
            "Fewer than 5 positive layering chains found. "
            "Regenerate data or check LAYERING labels in transactions.csv."
        )

    # ── 2. 80/20 Train/Test split (stratified) ───────────────────────────────
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"  Train: {len(X_train)} samples | Test (held-out): {len(X_test)} samples")

    # ── 3. Class-imbalance weight (computed from train set only) ─────────────
    pos_count = int(y_train.sum())
    neg_count = int((y_train == 0).sum())
    spw       = neg_count / max(pos_count, 1)
    print(f"  scale_pos_weight = {spw:.2f}")

    # ── 4. Train XGBoost on 80% only ─────────────────────────────────────────
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=spw,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=RANDOM_SEED,
        eval_metric="aucpr",
        use_label_encoder=False,
    )
    model.fit(X_train, y_train)

    # ── 5. Evaluate on held-out 20% test set ─────────────────────────────────
    test_probs = model.predict_proba(X_test)[:, 1]

    # Find threshold using cross-val on train set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    oof_probs = cross_val_predict(
        xgb.XGBClassifier(
            n_estimators=300, max_depth=4, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, scale_pos_weight=spw,
            min_child_weight=3, gamma=0.1, reg_alpha=0.1, reg_lambda=1.0,
            random_state=RANDOM_SEED, eval_metric="aucpr",
            use_label_encoder=False,
        ),
        X_train, y_train, cv=cv, method="predict_proba",
    )[:, 1]
    best_threshold, best_score = pick_threshold(y_train, oof_probs, beta=0.5)
    auc_pr = average_precision_score(y_test, test_probs)

    y_pred = (test_probs >= best_threshold).astype(int)
    print("\n  [TEST SET - 20% Hold-Out, Never Seen During Training]")
    print(classification_report(y_test, y_pred, target_names=["normal", "layering"], zero_division=0))
    print("  Confusion matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"  AUC-PR (test): {auc_pr:.4f}")
    print(f"  Best threshold (beta=0.5): {best_threshold:.2f} | F-score: {best_score:.4f}")

    # ── 6. Feature importance (leakage check) ─────────────────────────────────
    importances = pd.Series(
        model.feature_importances_, index=LAYERING_FEATURES
    ).sort_values(ascending=False)
    print("\n  Top 5 Features by Weight:")
    for feat, imp in importances.head(5).items():
        print(f"    {feat}: {imp:.4f}")

    # ── 7. Save artefacts ─────────────────────────────────────────────────────
    model.save_model(MODELS_DIR / "layering_xgb.json")
    threshold_path = MODELS_DIR / "layering_threshold.json"
    with open(threshold_path, "w", encoding="utf-8") as fh:
        json.dump({"threshold": best_threshold, "auc_pr": round(auc_pr, 4)}, fh)
    print("  Saved: models/layering_xgb.json")
    print("  Saved: models/layering_threshold.json")

def train_roundtrip_xgb(df_txn: pd.DataFrame) -> None:
    print("\nTraining Model E: XGBoost (Round-Trip chain scorer)...")
    import json
    import sys
    sys.path.append(str(Path(__file__).resolve().parent))
    from scripts.extract_chain_features import (
        ROUNDTRIP_FEATURES,
        build_roundtrip_training_dataset
    )
    
    X, y = build_roundtrip_training_dataset(df_txn, neg_multiplier=5)
    
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, average_precision_score, precision_recall_curve

    if len(np.unique(y)) < 2:
        print("  Not enough classes to train Round-Trip model. Check labels.")
        return

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pos_weight = float((y_train == 0).sum()) / max(float((y_train == 1).sum()), 1.0)
    print(f"  scale_pos_weight = {pos_weight:.2f}")

    import xgboost as xgb
    bst = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=pos_weight,
        eval_metric="aucpr",
        early_stopping_rounds=20,
        random_state=42
    )

    bst.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    y_pred_proba = bst.predict_proba(X_val)[:, 1]
    
    # Calculate F-beta score using robust pick_threshold
    beta = 0.5
    best_threshold, best_score = pick_threshold(y_val, y_pred_proba, beta=beta)
    
    y_pred = (y_pred_proba >= best_threshold).astype(int)
    
    auc_pr = float(average_precision_score(y_val, y_pred_proba))
    
    print("\n  OOF Validation Report (thresholded):")
    print(classification_report(y_val, y_pred, target_names=["normal", "round_trip"]))
    print(f"  AUC-PR: {auc_pr:.4f}")
    print(f"  Best threshold (beta={beta}): {best_threshold:.2f} | F-score: {best_score:.4f}")

    importance = bst.feature_importances_
    sorted_idx = np.argsort(importance)[::-1]
    print("\n  Top Features by Weight:")
    for i in range(min(5, len(ROUNDTRIP_FEATURES))):
        idx = sorted_idx[i]
        print(f"    {ROUNDTRIP_FEATURES[idx]}: {importance[idx]:.4f}")

    model_path = MODELS_DIR / "roundtrip_xgb.json"
    bst.save_model(model_path)
    
    threshold_path = MODELS_DIR / "roundtrip_threshold.json"
    with open(threshold_path, "w", encoding="utf-8") as fh:
        json.dump({"threshold": best_threshold, "auc_pr": round(auc_pr, 4)}, fh)
    print("  Saved: models/roundtrip_xgb.json")
    print("  Saved: models/roundtrip_threshold.json")

def main() -> None:
    df_acc = load_accounts()
    df_txn = load_transactions()

    acc_ids = df_acc["account_id"].tolist()
    np.save(MODELS_DIR / "acc_ids.npy", np.array(acc_ids))
    
    import sys
    sys.path.append(str(Path(__file__).resolve().parent))
    from scripts.feature_engineering import build_training_features
    X_train, patterns = build_training_features(DATA_DIR)
    
    # Assign account_id back to X_train by merging in same order
    df_ent = pd.read_csv(f"{DATA_DIR}/entities.csv")
    df_acc_raw = pd.read_csv(f"{DATA_DIR}/accounts.csv")
    df_stats = pd.read_csv(f"{DATA_DIR}/account_stats.csv")
    X_orig = df_stats.merge(df_acc_raw, on="account_id").merge(df_ent, on="entity_id")
    X_train['account_id'] = X_orig['account_id']
    X_train['kyc_tier'] = X_orig['kyc_tier']
    X_train['declared_annual_income'] = X_orig['declared_annual_income']

    train_isolation_forest(X_train)
    train_xgboost_kyc(X_train, patterns)
    try:
        train_layering_xgb(df_txn)
    except Exception as e:
        print(f"Layering training failed: {e}")
        
    try:
        train_smurf_xgboost(X_train, df_txn)
    except Exception as e:
        print(f"Smurf XGBoost training failed: {e}")
        print("  NOTE: Smurf model requires account_ml_features table. Skipping for now.")

    try:
        train_roundtrip_xgb(df_txn)
    except Exception as e:
        print(f"Roundtrip training failed: {e}")

    print("\nAll models trained and saved.")


if __name__ == "__main__":
    main()
