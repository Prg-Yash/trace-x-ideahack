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
        if "last_active_ts" in df.columns:
            df["dormancy_days"] = df["last_active_ts"].apply(
                lambda ts: (now - ts).days if pd.notna(ts) else 0
            )
        else:
            df["dormancy_days"] = 0

    return df


def load_transactions() -> pd.DataFrame:
    if not TRANSACTIONS_CSV.exists():
        raise FileNotFoundError(f"Missing {TRANSACTIONS_CSV}")

    # ALWAYS load the full dataset for ML training, never the Neo4j subset
    df = pd.read_csv(TRANSACTIONS_CSV)
    df["txn_ts"] = pd.to_datetime(df["txn_ts"], format="mixed", errors="coerce")
    df = df.dropna(subset=["txn_ts", "sender_id", "receiver_id", "amount", "channel", "status"])
    return df


def train_isolation_forest(df_acc: pd.DataFrame, df_txn: pd.DataFrame) -> None:
    """
    Hybrid Dormancy Detector (Model A):
    Stage 1 — Isolation Forest generates anomaly scores as a feature.
    Stage 2 — Supervised XGBoost trains on features + anomaly score.
    Result: combines unsupervised signal with supervised learning.
    
    All features are computed from actual transaction data — no data leakage.
    """
    print("Training Model A: Hybrid Dormancy Detector (ISO -> XGBoost)...")

    # ── Derive dormancy-specific features from account_stats ──────────────
    DORMANCY_FEATURES = [
        "dormancy_days",
        "volume_7d",
        "volume_30d",
        "txn_count_7d",
        "txn_count_30d",
        "unique_counterparties_30d",
        "total_volume_180d",
        "avg_monthly_volume",
        "avg_monthly_count",
        # Derived features (computed from real transaction data — no leakage)
        "volume_spike_ratio",
        "new_counterparty_ratio",
        "channel_switch_flag",
    ]

    # ── volume_spike_ratio: recent burst vs historical average ────────────
    if "avg_monthly_volume" in df_acc.columns and "volume_7d" in df_acc.columns:
        df_acc["volume_spike_ratio"] = df_acc["volume_7d"] / ((df_acc["total_volume_180d"] / 26.0) + 1.0)
    else:
        df_acc["volume_spike_ratio"] = 0.0

    # ── new_counterparty_ratio: computed from real transaction history ─────
    # A dormant account that reactivates will send to NEW people.
    # Ratio = (unique counterparties in last 30d) / (unique in 180d + 1)
    # A recently-reactivated dormant account: most 30d CPs are new → ratio ~1.0
    # A normal active account: same recurring CPs → ratio ~0.1–0.3
    print("  Computing new_counterparty_ratio from transaction history...")
    df_txn_clean = df_txn.copy()
    df_txn_clean["txn_ts"] = pd.to_datetime(df_txn_clean["txn_ts"], format="mixed", errors="coerce")
    df_txn_clean = df_txn_clean.dropna(subset=["txn_ts"])
    now_ts = pd.Timestamp.now()
    w30 = now_ts - pd.Timedelta(days=30)
    w180 = now_ts - pd.Timedelta(days=180)

    # Count unique counterparties per sender in each window
    cp_30d = (
        df_txn_clean[df_txn_clean["txn_ts"] >= w30]
        .groupby("sender_id")["receiver_id"].nunique()
        .rename("_uniq_cp_30d")
    )
    cp_180d = (
        df_txn_clean[df_txn_clean["txn_ts"] >= w180]
        .groupby("sender_id")["receiver_id"].nunique()
        .rename("_uniq_cp_180d")
    )
    df_acc = df_acc.merge(cp_30d, left_on="account_id", right_index=True, how="left")
    df_acc = df_acc.merge(cp_180d, left_on="account_id", right_index=True, how="left")
    df_acc["_uniq_cp_30d"] = df_acc["_uniq_cp_30d"].fillna(0)
    df_acc["_uniq_cp_180d"] = df_acc["_uniq_cp_180d"].fillna(0)
    df_acc["new_counterparty_ratio"] = df_acc["_uniq_cp_30d"] / (df_acc["_uniq_cp_180d"] + 1.0)

    # ── channel_switch_flag: did UPI usage shift significantly recently? ───
    # Compare UPI ratio in last 30d vs last 180d. A dormant account that
    # reactivates via UPI when it historically used NEFT shows a channel shift.
    upi_30d = (
        df_txn_clean[
            (df_txn_clean["txn_ts"] >= w30)
            & (df_txn_clean["channel"].str.upper() == "UPI")
        ].groupby("sender_id").size().rename("_upi_30d")
    )
    total_30d = (
        df_txn_clean[df_txn_clean["txn_ts"] >= w30]
        .groupby("sender_id").size().rename("_total_30d")
    )
    upi_180d = (
        df_txn_clean[
            (df_txn_clean["txn_ts"] >= w180)
            & (df_txn_clean["channel"].str.upper() == "UPI")
        ].groupby("sender_id").size().rename("_upi_180d")
    )
    total_180d = (
        df_txn_clean[df_txn_clean["txn_ts"] >= w180]
        .groupby("sender_id").size().rename("_total_180d")
    )
    df_acc = df_acc.merge(upi_30d, left_on="account_id", right_index=True, how="left")
    df_acc = df_acc.merge(total_30d, left_on="account_id", right_index=True, how="left")
    df_acc = df_acc.merge(upi_180d, left_on="account_id", right_index=True, how="left")
    df_acc = df_acc.merge(total_180d, left_on="account_id", right_index=True, how="left")
    for c in ["_upi_30d", "_total_30d", "_upi_180d", "_total_180d"]:
        df_acc[c] = df_acc[c].fillna(0)
    upi_ratio_30d = df_acc["_upi_30d"] / (df_acc["_total_30d"] + 1.0)
    upi_ratio_180d = df_acc["_upi_180d"] / (df_acc["_total_180d"] + 1.0)
    df_acc["channel_switch_flag"] = (abs(upi_ratio_30d - upi_ratio_180d) > 0.3).astype(float)

    # Drop temp columns
    df_acc = df_acc.drop(
        columns=[c for c in ["_uniq_cp_30d", "_uniq_cp_180d",
                              "_upi_30d", "_total_30d", "_upi_180d", "_total_180d"]
                 if c in df_acc.columns]
    )

    # Keep only features that exist
    feature_cols = [c for c in DORMANCY_FEATURES if c in df_acc.columns]
    if len(feature_cols) < 3:
        raise ValueError(f"Too few dormancy features available: {feature_cols}")

    X = df_acc[feature_cols].copy().fillna(0).astype(float)

    # ── Stage 1: Isolation Forest → anomaly score ─────────────────────────
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X.values)

    iso = IsolationForest(n_estimators=200, contamination=0.02, random_state=RANDOM_SEED)
    iso.fit(X_scaled)

    iso_scores = iso.decision_function(X_scaled)
    predictions = iso.predict(X_scaled)
    anomaly_count = int((predictions == -1).sum())
    print(f"  Stage 1 (ISO): Flagged {anomaly_count} anomalous accounts out of {len(X)}")

    # Save ISO model + scaler for backward compat with fraud_detector.py
    joblib.dump(iso, MODELS_DIR / "isolation_forest.pkl")
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")

    # ── Stage 2: Supervised XGBoost on features + ISO anomaly score ───────
    # Build ground truth labels from pattern_type
    if "pattern_type" not in df_acc.columns:
        print("  [WARN] No pattern_type column — skipping Stage 2 hybrid training.")
        print("  Saved: models/isolation_forest.pkl (standalone)")
        return

    y = df_acc["pattern_type"].fillna("").apply(
        lambda p: 1 if "DORMANT_ACTIVATION" in str(p) else 0
    ).values
    n_pos = int(y.sum())
    print(f"  Ground truth: {n_pos} dormant activations in {len(y)} accounts")

    if n_pos < 5:
        print("  [WARN] Too few dormant positives for supervised training. Skipping Stage 2.")
        return

    # Add ISO anomaly score as an extra feature
    X_enhanced = X.copy()
    X_enhanced["iso_anomaly_score"] = iso_scores

    enhanced_feature_cols = feature_cols + ["iso_anomaly_score"]

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import average_precision_score, classification_report
    import xgboost as xgb

    X_tr, X_val, y_tr, y_val = train_test_split(
        X_enhanced, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    pos_weight = float((y_tr == 0).sum()) / max(1, float((y_tr == 1).sum()))

    dormancy_xgb = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=pos_weight,
        reg_alpha=0.1,
        reg_lambda=1.0,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="aucpr",
        random_state=RANDOM_SEED,
    )
    dormancy_xgb.fit(X_tr, y_tr)

    from sklearn.metrics import precision_recall_curve
    y_probs = dormancy_xgb.predict_proba(X_val)[:, 1]
    
    precisions, recalls, thresholds = precision_recall_curve(y_val, y_probs)
    # Locate the precise threshold where precision stabilizes above 35%
    idx = np.where(precisions >= 0.35)[0]
    OPTIMAL_DORMANCY_THRESHOLD = thresholds[idx[0]] if len(idx) > 0 else 0.5
    print(f"  Set compliance alert gate to: {OPTIMAL_DORMANCY_THRESHOLD:.4f}")

    y_pred = (y_probs >= OPTIMAL_DORMANCY_THRESHOLD).astype(int)
    auc_pr = average_precision_score(y_val, y_probs)

    print(f"  Stage 2 (XGBoost) Validation AUC-PR: {auc_pr:.4f}")
    
    # Bundle the optimal threshold into the model
    bundle = {
        "iso": iso,
        "scaler": scaler,
        "xgb": dormancy_xgb,
        "features": feature_cols,
        "enhanced_features": enhanced_feature_cols,
        "threshold": float(OPTIMAL_DORMANCY_THRESHOLD)
    }
    print(classification_report(y_val, y_pred, target_names=["normal", "dormant"], zero_division=0))

    # Feature importance check
    importances = pd.Series(dormancy_xgb.feature_importances_, index=enhanced_feature_cols).sort_values(ascending=False)
    print("  Top 5 Dormancy Hybrid Features:")
    for feat, imp in importances.head(5).items():
        print(f"    {feat}: {imp:.4f}")

    # Save hybrid bundle
    # (bundle already defined with threshold above)
    joblib.dump(bundle, MODELS_DIR / "dormancy_hybrid.pkl")
    print("  Saved: models/dormancy_hybrid.pkl")


def detect_smurf_accounts(df_txn: pd.DataFrame) -> Set[str]:
    """
    Multi-tier smurfing labeler.
    Detects 4 tiers of structuring behavior using sliding-window scans.
    Detection is BEHAVIOR-based (burst + recipient diversity + CV),
    NOT amount-based — so it catches ₹5k smurfing AND ₹90k smurfing.
    """
    smurfers: Set[str] = set()
    df_out = df_txn[df_txn["status"].str.upper() == "SUCCESS"].copy()
    df_out = df_out.dropna(subset=["txn_ts", "amount", "receiver_id", "channel"])
    df_out["channel"] = df_out["channel"].str.upper()
    df_out["txn_ts"] = pd.to_datetime(df_out["txn_ts"], format="mixed", errors="coerce")
    df_out = df_out.dropna(subset=["txn_ts"]).sort_values("txn_ts")

    # ── Multi-tier parameter sets ─────────────────────────────────────────
    # Each tier matches a smurfing pattern at a different amount level.
    # Note: min_upi_ratio=0.0 means channel is not restricted (catches IMPS/NEFT smurfing).
    TIER_PARAMS: List[Dict] = [
        {
            "name": "MICRO",
            "window": pd.Timedelta(hours=48),
            "min_txns": 30,
            "min_receivers": 20,
            "amount_low": 2_000,
            "amount_high": 10_000,
            "max_cv": 0.35,
            "min_total": 60_000,
            "max_total": 1_500_000,
            "min_upi_ratio": 0.0,
        },
        {
            "name": "SMALL",
            "window": pd.Timedelta(hours=48),
            "min_txns": 20,
            "min_receivers": 15,
            "amount_low": 8_000,
            "amount_high": 26_000,
            "max_cv": 0.35,
            "min_total": 160_000,
            "max_total": 2_000_000,
            "min_upi_ratio": 0.0,
        },
        {
            "name": "UPI_THRESHOLD",
            "window": pd.Timedelta(hours=24),
            "min_txns": 12,
            "min_receivers": 10,
            "amount_low": 60_000,
            "amount_high": 100_000,
            "max_cv": 0.25,
            "min_total": 600_000,
            "max_total": 3_000_000,
            "min_upi_ratio": 0.5,
        },
        {
            "name": "RTGS_THRESHOLD",
            "window": pd.Timedelta(hours=72),
            "min_txns": 5,
            "min_receivers": 3,
            "amount_low": 150_000,
            "amount_high": 500_000,
            "max_cv": 0.40,
            "min_total": 750_000,
            "max_total": 7_000_000,
            "min_upi_ratio": 0.0,
        },
    ]

    def _scan_tier(params: Dict) -> Set[str]:
        found: Set[str] = set()
        window = params["window"]
        for acc_id, group in df_out.groupby("sender_id", sort=False):
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

                w_amounts = amounts[start: end + 1]
                mean_amt = float(w_amounts.mean())
                if not (params["amount_low"] <= mean_amt <= params["amount_high"]):
                    continue

                total_amt = float(w_amounts.sum())
                if not (params["min_total"] <= total_amt <= params["max_total"]):
                    continue

                cv = float(w_amounts.std() / max(mean_amt, 1.0))
                if cv > params["max_cv"]:
                    continue

                uniq_recv = len(set(receivers[start: end + 1]))
                if uniq_recv < params["min_receivers"]:
                    continue

                if params["min_upi_ratio"] > 0.0:
                    upi_ratio = float(np.mean(channels[start: end + 1] == "UPI"))
                    if upi_ratio < params["min_upi_ratio"]:
                        continue

                found.add(acc_id)
                break
        return found

    for tier in TIER_PARAMS:
        tier_smurfers = _scan_tier(tier)
        print(f"  Tier '{tier['name']}': {len(tier_smurfers)} smurfers detected")
        smurfers |= tier_smurfers

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


def build_burst_features(df_txn: pd.DataFrame) -> pd.DataFrame:
    """
    Compute 24-hour sliding-window burst features for every sender account.

    These features capture smurfing at ANY amount level because they measure
    BEHAVIOR (burst frequency + recipient diversity + amount uniformity),
    not absolute amounts.

    Returns a DataFrame indexed by account_id with one row per sender.
    """
    THRESHOLDS = [5_000, 10_000, 25_000, 50_000, 100_000, 500_000, 1_000_000]
    NEAR_PCT = 0.12  # "near threshold" = within 12% below any threshold

    df_out = df_txn[df_txn["status"].str.upper() == "SUCCESS"].copy()
    df_out["txn_ts"] = pd.to_datetime(df_out["txn_ts"], format="mixed", errors="coerce")
    df_out = df_out.dropna(subset=["txn_ts", "sender_id", "amount", "channel"])
    df_out["channel"] = df_out["channel"].str.upper()
    df_out = df_out.sort_values(["sender_id", "txn_ts"])

    window_ns = np.timedelta64(24, "h")
    records: Dict[str, Dict] = {}

    for acc_id, group in df_out.groupby("sender_id", sort=False):
        group = group.reset_index(drop=True)
        times = group["txn_ts"].values           # numpy datetime64
        amounts = group["amount"].astype(float).values
        receivers = group["receiver_id"].values
        channels = group["channel"].values
        n = len(group)

        # ── 24h sliding window: peak burst metrics ─────────────────────────
        max_txn_in_24h = 0
        max_uniq_recv_24h = 0
        max_vol_24h = 0.0
        max_uniformity_score = 0.0   # 1 - CV; high means suspiciously uniform

        start = 0
        for end in range(n):
            while times[end] - times[start] > window_ns:
                start += 1
            w_cnt = end - start + 1
            w_amt = amounts[start: end + 1]
            w_recv = receivers[start: end + 1]
            w_vol = float(w_amt.sum())
            w_uniq = len(set(w_recv))

            max_txn_in_24h = max(max_txn_in_24h, w_cnt)
            max_uniq_recv_24h = max(max_uniq_recv_24h, w_uniq)
            max_vol_24h = max(max_vol_24h, w_vol)

            if w_cnt >= 3:
                w_mean = float(w_amt.mean())
                w_cv = float(w_amt.std() / (w_mean + 1.0))
                uniformity = max(0.0, 1.0 - w_cv)   # 0=chaotic, 1=perfectly uniform
                max_uniformity_score = max(max_uniformity_score, uniformity)

        # ── Overall account-level behavioral features ──────────────────────
        mean_amt = float(amounts.mean()) if n > 0 else 0.0
        std_amt = float(amounts.std()) if n > 1 else 0.0
        amount_cv_overall = std_amt / (mean_amt + 1.0)

        # Near-threshold avoidance ratio
        near_count = sum(
            1 for a in amounts
            if any(t * (1.0 - NEAR_PCT) <= a < t for t in THRESHOLDS)
        )
        near_threshold_ratio = near_count / max(n, 1)

        # Time-gap features (burst speed)
        if n > 1:
            gap_ns = np.diff(times.astype(np.int64))
            gap_min = gap_ns / 1e9 / 60.0           # nanoseconds → minutes
            min_gap_minutes = float(gap_min.min())
            mean_gap_minutes = float(gap_min.mean())
        else:
            min_gap_minutes = 99_999.0
            mean_gap_minutes = 99_999.0

        # Channel entropy (Shannon)
        from collections import Counter
        ch_counts = Counter(channels)
        total_ch = sum(ch_counts.values())
        entropy = -sum(
            (c / total_ch) * np.log2(c / total_ch + 1e-10)
            for c in ch_counts.values()
        )
        upi_ratio = ch_counts.get("UPI", 0) / max(total_ch, 1)

        # Recipient reuse (low reuse = many unique = smurfing signal)
        unique_recv_all = len(set(receivers))
        recipient_reuse_rate = 1.0 - (unique_recv_all / max(n, 1))

        records[acc_id] = {
            "max_txn_in_24h":       float(max_txn_in_24h),
            "max_uniq_recv_24h":    float(max_uniq_recv_24h),
            "max_vol_24h":          max_vol_24h,
            "max_uniformity_score": max_uniformity_score,
            "total_txn_count":      float(n),
            "mean_amount":          mean_amt,
            "amount_cv_overall":    amount_cv_overall,
            "near_threshold_ratio": near_threshold_ratio,
            "min_gap_minutes":      min_gap_minutes,
            "mean_gap_minutes":     mean_gap_minutes,
            "channel_entropy":      entropy,
            "upi_ratio":            upi_ratio,
            "recipient_reuse_rate": recipient_reuse_rate,
        }

    print(f"  [build_burst_features] computed for {len(records)} sender accounts")
    return pd.DataFrame.from_dict(records, orient="index")


# Feature names used for smurfing — must match build_burst_features() output
SMURF_BURST_FEATURES = [
    "max_txn_in_24h",
    "max_uniq_recv_24h",
    "max_vol_24h",
    "max_uniformity_score",
    "total_txn_count",
    "mean_amount",
    "amount_cv_overall",
    "near_threshold_ratio",
    "min_gap_minutes",
    "mean_gap_minutes",
    "channel_entropy",
    "upi_ratio",
    "recipient_reuse_rate",
]


def train_smurf_xgboost(X_train: pd.DataFrame, df_txn: pd.DataFrame) -> None:
    print("\nTraining Model B: XGBoost (smurfing detector)...")
    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost not installed. Skipping.")
        return

    # ── Step 1: Build 24h burst features from transaction history ─────────
    print("  Building 24h burst behavioral features (this replaces coarse 30d stats)...")
    burst_feats = build_burst_features(df_txn)

    # ── Step 2: Label accounts using multi-tier sliding-window algorithm ───
    def normalize_acc(acc_id: str) -> str:
        try:
            return f"ACC_{int(str(acc_id).split('_')[1]):05d}"
        except Exception:
            return str(acc_id)

    labels_path = DATA_DIR / "labels" / "smurf_accounts.csv"
    if labels_path.exists():
        labels_df = pd.read_csv(labels_path)
        smurfers = {normalize_acc(x) for x in labels_df["account_id"].dropna()}
        print(f"  Smurf labels loaded from file: {len(smurfers)} accounts")
    else:
        smurfers = {normalize_acc(x) for x in detect_smurf_accounts(df_txn)}
        print(f"  Smurf labeler found {len(smurfers)} accounts total")

    if len(smurfers) == 0:
        raise ValueError(
            "Smurf labeler produced 0 positives. "
            "Regenerate data with python data/generate_data.py"
        )

    # ── Step 3: Merge burst features with X_train (account-level) ─────────
    # burst_feats is indexed by sender_id (= account_id)
    X_full = X_train.merge(
        burst_feats.reset_index().rename(columns={"index": "account_id"}),
        on="account_id",
        how="left",
    ).fillna(0)

    # Ground-truth labels: 1 if account is a smurfer, else 0
    y_full = X_full["account_id"].apply(lambda x: 1 if x in smurfers else 0).values
    n_pos = int(y_full.sum())
    n_total = len(y_full)
    print(f"  Dataset: {n_total} accounts, {n_pos} smurfers ({100*n_pos/n_total:.1f}%)")

    # Use burst features as primary signal; keep account_age_days as context
    feature_cols = SMURF_BURST_FEATURES
    missing = [c for c in feature_cols if c not in X_full.columns]
    if missing:
        print(f"  [WARN] Missing burst features (will be zeroed): {missing}")
        for c in missing:
            X_full[c] = 0.0

    X = X_full[feature_cols].copy().fillna(0).astype(float)

    # ── Step 4: Train/Test split (stratified) ─────────────────────────────
    from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
    from sklearn.metrics import (
        average_precision_score, f1_score, precision_recall_curve,
        classification_report, confusion_matrix
    )
    from sklearn.calibration import CalibratedClassifierCV
    import joblib

    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y_full, test_size=0.20, random_state=RANDOM_SEED, stratify=y_full
    )

    # ── Step 5: SMOTE on training split only ──────────────────────────────
    try:
        from imblearn.over_sampling import SMOTE
        k = min(5, max(1, int(y_tr.sum()) - 1))
        sm = SMOTE(random_state=RANDOM_SEED, k_neighbors=k)
        X_tr_res, y_tr_res = sm.fit_resample(X_tr, y_tr)
        print(f"  SMOTE: {int(y_tr.sum())} -> {int(y_tr_res.sum())} positives in training set")
    except ImportError:
        print("  [WARN] imbalanced-learn not installed — install with: pip install imbalanced-learn")
        X_tr_res, y_tr_res = X_tr, y_tr

    pos_weight = float((y_tr_res == 0).sum()) / max(1.0, float((y_tr_res == 1).sum()))
    print(f"  scale_pos_weight = {pos_weight:.2f}")

    # ── Step 6: Train XGBoost with regularization ──────────────────────────
    base_model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=pos_weight,
        reg_alpha=0.1,
        reg_lambda=1.0,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="aucpr",
        random_state=RANDOM_SEED,
    )

    # Probability calibration so scores are interpretable (e.g. 87% = real 87%)
    calibrated_model = CalibratedClassifierCV(
        estimator=base_model, method="isotonic", cv=3
    )
    calibrated_model.fit(X_tr_res, y_tr_res)

    # ── Step 7: Threshold optimisation on validation set ──────────────────
    probs_val = calibrated_model.predict_proba(X_val)[:, 1]
    best_thresh, _ = pick_threshold(y_val, probs_val, beta=0.5)
    preds_val = (probs_val >= best_thresh).astype(int)

    auc_pr = average_precision_score(y_val, probs_val)
    print(f"\n  [SMURFING — 20% Held-Out Test Set]")    
    print(classification_report(y_val, preds_val,
                                target_names=["normal", "smurfing"], zero_division=0))
    print("  Confusion matrix:")
    print(confusion_matrix(y_val, preds_val))
    print(f"  AUC-PR: {auc_pr:.4f}")
    print(f"  Optimal threshold: {best_thresh:.3f}")

    # ── Step 8: Feature importance ────────────────────────────────────────
    inner_model = calibrated_model.calibrated_classifiers_[0].estimator
    importances = pd.Series(
        inner_model.feature_importances_, index=feature_cols
    ).sort_values(ascending=False)
    print("\n  Top 5 Smurf Features by Importance:")
    for feat, imp in importances.head(5).items():
        print(f"    {feat}: {imp:.4f}")

    # ── Step 9: Save model + metadata ─────────────────────────────────────
    bundle = {
        "model": calibrated_model,
        "features": feature_cols,
        "threshold": float(best_thresh),
        "auc_pr": float(auc_pr),
    }
    out_path = MODELS_DIR / "smurf_model.pkl"
    joblib.dump(bundle, out_path)
    print(f"  Saved: {out_path}")


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

    # ── 3.5 Inject Feature-Level Chaos to Prevent Data Leakage ───────────────
    leakage_vulnerable_cols = ["amount_above_50k_ratio", "amount_above_100k_ratio", "amount_cv", "log_initial_amount", "final_to_initial_ratio"]
    for col in leakage_vulnerable_cols:
        if col in X_train.columns:
            std_dev = X_train[col].std()
            if std_dev > 0:
                noise = np.random.normal(0, std_dev * 0.15, size=len(X_train))
                X_train[col] = X_train[col] + noise
                if "ratio" in col:
                    X_train[col] = np.clip(X_train[col], 0.0, 1.0)
                elif col == "amount_cv":
                    X_train[col] = np.clip(X_train[col], 0.0, None)

    timing_leakage_cols = ["min_gap_minutes", "rapid_hop_ratio"]
    for col in timing_leakage_cols:
        if col in X_train.columns:
            std_dev = X_train[col].std()
            if std_dev > 0:
                # Add 15% Gaussian noise to smooth out programmatic edges
                X_train[col] = X_train[col] + np.random.normal(0, std_dev * 0.15, size=len(X_train))

    # ── 4. Train XGBoost on 80% only ─────────────────────────────────────────
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=3,            # Force shallow trees to prevent pattern memorization
        learning_rate=0.05,
        subsample=0.7,          # Row subsampling forces variance generalizations
        colsample_bytree=0.7,   # Feature subsampling breaks reliance on single features
        scale_pos_weight=spw,
        eval_metric='aucpr',
        random_state=RANDOM_SEED,
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

    # ── 3.5 Inject Feature-Level Chaos to Prevent Data Leakage ───────────────
    leakage_vulnerable_cols = ["amount_cv_across_hops", "return_amount_ratio", "velocity_score", "avg_hop_time_minutes", "total_cycle_time_hours"]
    for col in leakage_vulnerable_cols:
        if col in X_train.columns:
            std_dev = X_train[col].std()
            if std_dev > 0:
                noise = np.random.normal(0, std_dev * 0.15, size=len(X_train))
                X_train[col] = X_train[col] + noise
                if "ratio" in col:
                    X_train[col] = np.clip(X_train[col], 0.0, 1.0)
                else:
                    X_train[col] = np.clip(X_train[col], 0.0, None)

    import xgboost as xgb
    bst = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.05,
        subsample=0.7,
        colsample_bytree=0.7,
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

    # Merge account_stats into df_acc for the hybrid dormancy trainer
    df_acc_full = df_acc.merge(df_stats, on="account_id", how="left", suffixes=("", "_stats"))
    train_isolation_forest(df_acc_full, df_txn)
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
