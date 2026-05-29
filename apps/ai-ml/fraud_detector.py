import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from dotenv import load_dotenv
from neo4j import GraphDatabase

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("FRAUD_DATA_DIR", BASE_DIR / "data"))
MODELS_DIR = Path(os.getenv("FRAUD_MODELS_DIR", BASE_DIR / "models"))

ROOT_ENV = BASE_DIR.parents[2] / ".env"
load_dotenv(ROOT_ENV, override=False)
load_dotenv(BASE_DIR / ".env", override=True)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
REL_TYPE = os.getenv("NEO4J_REL_TYPE", "SENT").upper()
if not re.fullmatch(r"[A-Z_][A-Z0-9_]*", REL_TYPE or ""):
    REL_TYPE = "SENT"

if not DATA_DIR.exists():
    raise FileNotFoundError(f"Missing data directory: {DATA_DIR}")
if not MODELS_DIR.exists():
    raise FileNotFoundError(f"Missing models directory: {MODELS_DIR}")

DF_TXN = pd.read_csv(DATA_DIR / "transactions.csv")
DF_ACC = pd.read_csv(DATA_DIR / "accounts.csv")
_DATA_MTIMES = {
    "transactions": (DATA_DIR / "transactions.csv").stat().st_mtime,
    "accounts": (DATA_DIR / "accounts.csv").stat().st_mtime,
}

DF_TXN["txn_ts"] = pd.to_datetime(DF_TXN["txn_ts"], errors="coerce")
DF_TXN["status"] = DF_TXN["status"].astype(str).str.upper()
DF_TXN["channel"] = DF_TXN["channel"].astype(str).str.upper()

DF_ACC["last_active_ts"] = pd.to_datetime(DF_ACC["last_active_ts"], errors="coerce")

ISO_MODEL = joblib.load(MODELS_DIR / "isolation_forest.pkl")
SCALER = joblib.load(MODELS_DIR / "scaler.pkl")

SMURF_THRESHOLD = 0.6
threshold_path = MODELS_DIR / "smurf_threshold.json"
if threshold_path.exists():
    with open(threshold_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
        SMURF_THRESHOLD = float(data.get("threshold", SMURF_THRESHOLD))


class SmurfLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=5,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3,
        )
        self.fc = nn.Sequential(
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 2),
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])


LSTM_MODEL = SmurfLSTM()
LSTM_MODEL.load_state_dict(torch.load(MODELS_DIR / "lstm_model.pt", map_location="cpu"))
LSTM_MODEL.eval()

if NEO4J_URI and NEO4J_USER and NEO4J_PASSWORD:
    NEO4J_DRIVER = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
else:
    NEO4J_DRIVER = None

FEATURE_COLS = [
    "dormancy_days",
    "txn_count_7d",
    "txn_count_30d",
    "volume_7d",
    "volume_30d",
    "avg_monthly_volume",
    "avg_monthly_count",
    "unique_counterparties_30d",
]



def refresh_data(force: bool = False) -> None:
    global DF_TXN, DF_ACC, _DATA_MTIMES
    transactions_path = DATA_DIR / "transactions.csv"
    accounts_path = DATA_DIR / "accounts.csv"

    current_mtimes = {
        "transactions": transactions_path.stat().st_mtime,
        "accounts": accounts_path.stat().st_mtime,
    }

    if not force and current_mtimes == _DATA_MTIMES:
        return

    DF_TXN = pd.read_csv(transactions_path)
    DF_ACC = pd.read_csv(accounts_path)
    DF_TXN["txn_ts"] = pd.to_datetime(DF_TXN["txn_ts"], errors="coerce")
    DF_TXN["status"] = DF_TXN["status"].astype(str).str.upper()
    DF_TXN["channel"] = DF_TXN["channel"].astype(str).str.upper()
    DF_ACC["last_active_ts"] = pd.to_datetime(DF_ACC["last_active_ts"], errors="coerce")
    _DATA_MTIMES = current_mtimes


def get_account_ids() -> List[str]:
    refresh_data()
    return DF_ACC["account_id"].dropna().astype(str).tolist()


def _neo4j_session():
    if NEO4J_DRIVER is None:
        raise RuntimeError("Neo4j connection is not configured.")
    return NEO4J_DRIVER.session()


def _build_smurf_sequence(account_id: str) -> Tuple[np.ndarray, pd.DataFrame]:
    txns = DF_TXN[(DF_TXN["sender_id"] == account_id) & (DF_TXN["status"] == "SUCCESS")]
    txns = txns.sort_values("txn_ts").tail(30)
    if len(txns) < 5:
        return np.array([]), txns

    seq = []
    prev_time = None
    for _, row in txns.iterrows():
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

    while len(seq) < 30:
        seq.insert(0, [0.0, 0.0, 0.0, 0.0, 0.0])

    return np.array(seq[-30:], dtype=np.float32), txns


def detect_layering(account_id: str) -> Dict:
    """
    Finds any path where money hops through 5+ accounts within 2 hours.
    Returns the chain with amounts and timestamps if found.
    """
    refresh_data()
    if NEO4J_DRIVER is None:
        return {"detected": False, "fraud_type": "LAYERING", "error": "Neo4j not configured"}

    query = f"""
        MATCH path = (start:Account {{account_id: $acc_id}})-[r:{REL_TYPE}*5..12]->(end:Account)
        WHERE start <> end
        WITH path,
             [rel IN relationships(path) | rel.amount] AS amounts,
             [rel IN relationships(path) | rel.txn_ts] AS times,
             [n IN nodes(path) | n.account_id] AS chain
        WHERE all(t IN times WHERE t IS NOT NULL)
        WITH path, amounts, times, chain,
             duration.between(min(times), max(times)) AS span
        WHERE span <= duration({{hours: 2}})
        RETURN chain, amounts, times
        LIMIT 1
    """

    with _neo4j_session() as session:
        record = session.run(query, acc_id=account_id).single()

    if not record:
        return {"detected": False, "fraud_type": "LAYERING"}

    return {
        "detected": True,
        "fraud_type": "LAYERING",
        "confidence": 0.92,
        "chain": record["chain"],
        "amounts": record["amounts"],
        "timestamps": record["times"],
        "hops": len(record["chain"]) - 1,
    }


def detect_roundtrip(account_id: str) -> Dict:
    """
    Finds a cycle where money leaves an account and returns to it.
    """
    refresh_data()
    if NEO4J_DRIVER is None:
        return {"detected": False, "fraud_type": "ROUND_TRIP", "error": "Neo4j not configured"}

    query = f"""
        MATCH path = (a:Account {{account_id: $acc_id}})-[r:{REL_TYPE}*3..8]->(a)
        WITH path,
             [rel IN relationships(path) | rel.amount] AS amounts,
             [n IN nodes(path) | n.account_id] AS loop
        RETURN loop, amounts
        LIMIT 1
    """

    with _neo4j_session() as session:
        record = session.run(query, acc_id=account_id).single()

    if not record:
        return {"detected": False, "fraud_type": "ROUND_TRIP"}

    return {
        "detected": True,
        "fraud_type": "ROUND_TRIP",
        "confidence": 0.89,
        "loop": record["loop"],
        "amounts": record["amounts"],
    }


def detect_smurfing(account_id: str) -> Dict:
    refresh_data()
    """
    Feeds the last 30 transactions into the LSTM.
    Returns smurfing probability.
    """
    seq, _ = _build_smurf_sequence(account_id)
    if seq.size == 0:
        return {"detected": False, "fraud_type": "SMURFING", "confidence": 0.0}

    x = torch.tensor([seq], dtype=torch.float32)
    with torch.no_grad():
        prob = torch.softmax(LSTM_MODEL(x), dim=1)[0, 1].item()

    return {
        "detected": prob >= SMURF_THRESHOLD,
        "fraud_type": "SMURFING",
        "confidence": round(float(prob), 4),
        "threshold": round(float(SMURF_THRESHOLD), 4),
    }


def detect_dormant(account_id: str) -> Dict:
    refresh_data()
    """
    Uses Isolation Forest on account-level behavior features.
    Returns anomaly score (0 = normal, 1 = anomalous).
    """
    acc_row = DF_ACC[DF_ACC["account_id"] == account_id]
    if acc_row.empty:
        return {"detected": False, "fraud_type": "DORMANT_ACTIVATION", "confidence": 0.0}

    acc = acc_row.iloc[0]
    features = np.array([[float(acc.get(col, 0.0)) for col in FEATURE_COLS]], dtype=np.float32)
    X_scaled = SCALER.transform(features)

    raw = -float(ISO_MODEL.score_samples(X_scaled)[0])
    anomaly_score = 1.0 / (1.0 + np.exp(-raw))

    return {
        "detected": anomaly_score >= 0.7,
        "fraud_type": "DORMANT_ACTIVATION",
        "confidence": round(float(anomaly_score), 4),
        "dormancy_days": int(acc.get("dormancy_days", 0)),
        "volume_30d": round(float(acc.get("volume_30d", 0.0)), 2),
    }


def detect_kyc_mismatch(account_id: str) -> Dict:
    """
    Compares recent 30d volume to declared monthly income.
    Ratio > 10 => CRITICAL, > 5 => HIGH.
    """
    refresh_data()
    acc_row = DF_ACC[DF_ACC["account_id"] == account_id]
    if acc_row.empty:
        return {"detected": False, "fraud_type": "KYC_MISMATCH"}

    acc = acc_row.iloc[0]
    declared_annual_income = float(acc.get("declared_annual_income", 0.0) or 0.0)
    expected_monthly = declared_annual_income / 12 if declared_annual_income > 0 else 50000.0

    actual_monthly = float(acc.get("volume_30d", 0.0))
    ratio = actual_monthly / max(expected_monthly, 1.0)

    if ratio > 10:
        severity = "CRITICAL"
    elif ratio > 5:
        severity = "HIGH"
    elif ratio > 2:
        severity = "MEDIUM"
    else:
        severity = "NORMAL"

    return {
        "detected": severity in ["CRITICAL", "HIGH"],
        "fraud_type": "KYC_MISMATCH",
        "confidence": round(min(ratio / 10, 1.0), 4),
        "mismatch_ratio": round(ratio, 2),
        "severity": severity,
        "expected_monthly": round(expected_monthly, 2),
        "actual_monthly": round(actual_monthly, 2),
    }


_SHAP_EXPLAINER = None
_SMURF_SHAP_EXPLAINER = None
_SMURF_SHAP_BACKGROUND = None
SMURF_FEATURES = ["amount", "gap_min", "hour", "day", "is_upi"]


def explain_dormant(account_id: str) -> Dict:
    """
    Returns SHAP values for the Isolation Forest anomaly score.
    Uses KernelExplainer for model-agnostic explanations.
    """
    try:
        import shap  # type: ignore
    except ImportError:
        return {"error": "shap is not installed"}

    acc_row = DF_ACC[DF_ACC["account_id"] == account_id]
    if acc_row.empty:
        return {"error": "account not found"}

    background = DF_ACC[FEATURE_COLS].fillna(0.0)
    background = background.sample(min(200, len(background)), random_state=42)

    def model_fn(X):
        X_scaled = SCALER.transform(X)
        raw_scores = -ISO_MODEL.score_samples(X_scaled)
        return 1.0 / (1.0 + np.exp(-raw_scores))

    global _SHAP_EXPLAINER
    if _SHAP_EXPLAINER is None:
        _SHAP_EXPLAINER = shap.KernelExplainer(model_fn, background.values)

    row = acc_row.iloc[0]
    x = np.array([[float(row.get(col, 0.0)) for col in FEATURE_COLS]], dtype=np.float32)

    shap_values = _SHAP_EXPLAINER.shap_values(x, nsamples=100)
    contributions = list(zip(FEATURE_COLS, shap_values[0][0]))
    contributions.sort(key=lambda item: abs(item[1]), reverse=True)

    return {
        "account_id": account_id,
        "base_value": float(_SHAP_EXPLAINER.expected_value),
        "top_features": [
            {"feature": name, "shap": round(float(value), 6)}
            for name, value in contributions[:8]
        ],
    }


def _smurf_model_fn(flattened: np.ndarray) -> np.ndarray:
    x = torch.tensor(flattened.reshape(-1, 30, 5), dtype=torch.float32)
    with torch.no_grad():
        probs = torch.softmax(LSTM_MODEL(x), dim=1)[:, 1].cpu().numpy()
    return probs


def _get_smurf_background() -> np.ndarray:
    global _SMURF_SHAP_BACKGROUND
    if _SMURF_SHAP_BACKGROUND is not None:
        return _SMURF_SHAP_BACKGROUND

    accounts = DF_TXN[DF_TXN["status"] == "SUCCESS"]["sender_id"].dropna().unique().tolist()
    random_accounts = accounts[:]
    np.random.shuffle(random_accounts)

    sequences = []
    for acc_id in random_accounts:
        seq, _ = _build_smurf_sequence(acc_id)
        if seq.size == 0:
            continue
        sequences.append(seq.flatten())
        if len(sequences) >= 20:
            break

    if not sequences:
        sequences = [np.zeros((30, 5), dtype=np.float32).flatten()]

    _SMURF_SHAP_BACKGROUND = np.array(sequences, dtype=np.float32)
    return _SMURF_SHAP_BACKGROUND


def explain_smurfing(account_id: str) -> Dict:
    """
    Returns SHAP-style explanations for the LSTM smurf score.
    Falls back to occlusion if SHAP is unavailable.
    """
    seq, txns = _build_smurf_sequence(account_id)
    if seq.size == 0:
        return {"error": "not enough transactions"}

    start = time.time()
    flat = seq.flatten().astype(np.float32)

    try:
        import shap  # type: ignore

        global _SMURF_SHAP_EXPLAINER
        if _SMURF_SHAP_EXPLAINER is None:
            background = _get_smurf_background()
            _SMURF_SHAP_EXPLAINER = shap.KernelExplainer(_smurf_model_fn, background)

        shap_values = _SMURF_SHAP_EXPLAINER.shap_values(flat.reshape(1, -1), nsamples=50)
        values = np.array(shap_values).reshape(-1)
        contributions = values.reshape(30, 5)
        method = "shap"
    except Exception:
        base_prob = _smurf_model_fn(flat.reshape(1, -1))[0]
        contributions = np.zeros((30, 5), dtype=np.float32)
        for t in range(30):
            for f in range(5):
                perturbed = flat.copy().reshape(30, 5)
                perturbed[t, f] = 0.0
                prob = _smurf_model_fn(perturbed.reshape(1, -1))[0]
                contributions[t, f] = base_prob - prob
        method = "occlusion"

    feature_scores = contributions.sum(axis=0)
    feature_rank = sorted(
        zip(SMURF_FEATURES, feature_scores), key=lambda item: abs(item[1]), reverse=True
    )

    top_steps = []
    for t in np.argsort(np.abs(contributions).sum(axis=1))[::-1][:5]:
        top_steps.append(
            {
                "step": int(t),
                "features": {
                    name: round(float(contributions[t, idx]), 6)
                    for idx, name in enumerate(SMURF_FEATURES)
                },
            }
        )

    duration_ms = int((time.time() - start) * 1000)

    return {
        "account_id": account_id,
        "method": method,
        "duration_ms": duration_ms,
        "top_features": [
            {"feature": name, "importance": round(float(value), 6)}
            for name, value in feature_rank
        ],
        "top_steps": top_steps,
        "sequence_len": int(len(txns)),
    }


def _recompute_account_metrics(account_id: str) -> Dict:
    refresh_data(force=True)
    acc_row = DF_ACC[DF_ACC["account_id"] == account_id]
    if acc_row.empty:
        raise ValueError(f"Unknown account_id: {account_id}")

    acc = acc_row.iloc[0].to_dict()
    all_txns = DF_TXN[(DF_TXN["sender_id"] == account_id) | (DF_TXN["receiver_id"] == account_id)]
    now = pd.Timestamp.now()
    week_txns = all_txns[all_txns["txn_ts"] >= now - pd.Timedelta(days=7)]
    month_txns = all_txns[all_txns["txn_ts"] >= now - pd.Timedelta(days=30)]
    recent_6m = all_txns[all_txns["txn_ts"] >= now - pd.Timedelta(days=180)]

    last_active_ts = all_txns["txn_ts"].max() if not all_txns.empty else pd.NaT
    dormancy_days = int((now - last_active_ts).days) if pd.notna(last_active_ts) else int((now.date() - pd.to_datetime(acc["opened_on"]).date()).days)

    counterparties = set(month_txns.loc[month_txns["sender_id"] != account_id, "sender_id"].astype(str)).union(
        set(month_txns.loc[month_txns["receiver_id"] != account_id, "receiver_id"].astype(str))
    )
    counterparties.discard(account_id)

    updates = {
        "txn_count_7d": int(len(week_txns)),
        "txn_count_30d": int(len(month_txns)),
        "volume_7d": float(week_txns["amount"].sum()),
        "volume_30d": float(month_txns["amount"].sum()),
        "avg_monthly_count": float(len(recent_6m) / 6.0),
        "avg_monthly_volume": float(recent_6m["amount"].sum() / 6.0),
        "unique_counterparties_30d": int(len(counterparties)),
        "last_active_ts": last_active_ts.isoformat() if pd.notna(last_active_ts) else None,
        "dormancy_days": dormancy_days,
        "status": "DORMANT" if dormancy_days >= 365 else "ACTIVE",
    }
    return updates


def upsert_account_record(account: Dict) -> Dict:
    refresh_data(force=True)
    record = account.copy()
    record.setdefault("declared_annual_income", None)
    record.setdefault("txn_count_7d", 0)
    record.setdefault("txn_count_30d", 0)
    record.setdefault("volume_7d", 0.0)
    record.setdefault("volume_30d", 0.0)
    record.setdefault("avg_monthly_volume", 0.0)
    record.setdefault("avg_monthly_count", 0.0)
    record.setdefault("unique_counterparties_30d", 0)
    record.setdefault("last_active_ts", None)
    record.setdefault("dormancy_days", 0)
    record.setdefault("is_fraud", False)
    record.setdefault("fraud_score", 0.0)
    record.setdefault("last_scored_ts", datetime.utcnow().isoformat())

    existing = DF_ACC[DF_ACC["account_id"] == record["account_id"]]
    if not existing.empty:
        merged = existing.iloc[0].to_dict()
        merged.update({key: value for key, value in record.items() if value is not None})
        record = merged

    global DF_ACC
    DF_ACC = DF_ACC[DF_ACC["account_id"] != record["account_id"]].copy()
    DF_ACC = pd.concat([DF_ACC, pd.DataFrame([record])], ignore_index=True)
    DF_ACC.to_csv(DATA_DIR / "accounts.csv", index=False)
    refresh_data(force=True)
    return record


def upsert_transaction_record(transaction: Dict) -> Dict:
    refresh_data(force=True)
    record = transaction.copy()
    record["txn_ts"] = pd.to_datetime(record["txn_ts"]) if not isinstance(record["txn_ts"], pd.Timestamp) else record["txn_ts"]
    global DF_TXN
    DF_TXN = DF_TXN[DF_TXN["txn_id"] != record["txn_id"]].copy()
    DF_TXN = pd.concat([DF_TXN, pd.DataFrame([record])], ignore_index=True)
    DF_TXN.to_csv(DATA_DIR / "transactions.csv", index=False)
    refresh_data(force=True)
    return record


def build_evidence_package(account_id: str) -> Dict:
    refresh_data()
    score = score_account(account_id)
    traces = {
        "layering": detect_layering(account_id),
        "roundtrip": detect_roundtrip(account_id),
    }
    explanations = {
        "dormant": explain_dormant(account_id),
        "smurfing": explain_smurfing(account_id),
    }
    return {
        "account_id": account_id,
        "generated_at": datetime.utcnow().isoformat(),
        "score": score,
        "traces": traces,
        "explanations": explanations,
        "report_summary": {
            "risk_level": score["risk_level"],
            "combined_score": score["combined_score"],
            "flagged_for": score["flagged_for"],
        },
    }


def build_alert_candidates() -> List[str]:
    refresh_data()
    if DF_ACC.empty:
        return []

    frame = DF_ACC.copy()
    frame["declared_annual_income"] = pd.to_numeric(frame.get("declared_annual_income"), errors="coerce")
    frame["declared_monthly_income"] = frame["declared_annual_income"].fillna(0) / 12.0
    frame["kyc_mismatch_ratio"] = np.where(
        frame["declared_monthly_income"] > 0,
        frame["volume_30d"].fillna(0) / frame["declared_monthly_income"],
        0,
    )

    heuristic = (
        frame[
            (frame["dormancy_days"].fillna(0) >= 90)
            | (frame["txn_count_30d"].fillna(0) >= 15)
            | (frame["volume_30d"].fillna(0) >= frame["volume_30d"].quantile(0.8))
            | (frame["kyc_mismatch_ratio"] >= 5)
        ]["account_id"]
        .dropna()
        .astype(str)
        .tolist()
    )

    if not heuristic:
        heuristic = frame["account_id"].dropna().astype(str).head(200).tolist()

    return heuristic


def score_account(account_id: str) -> Dict:
    """
    Runs all detectors and returns a combined fraud report.
    """
    results = {
        "layering": detect_layering(account_id),
        "round_trip": detect_roundtrip(account_id),
        "smurfing": detect_smurfing(account_id),
        "dormant": detect_dormant(account_id),
        "kyc_mismatch": detect_kyc_mismatch(account_id),
    }

    flagged = [key for key, value in results.items() if value.get("detected")]
    confidences = [value.get("confidence", 0.0) for value in results.values()]
    combined_score = max(confidences) if confidences else 0.0

    if combined_score > 0.85:
        risk_level = "CRITICAL"
    elif combined_score > 0.65:
        risk_level = "HIGH"
    elif combined_score > 0.45:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "account_id": account_id,
        "is_flagged": len(flagged) > 0,
        "risk_level": risk_level,
        "combined_score": round(float(combined_score), 4),
        "flagged_for": flagged,
        "detections": results,
    }
