"""
extract_chain_features.py — Layering Chain Feature Engineering
===============================================================
Shared between:
  - train_models.py  (offline, reads CSVs)
  - fraud_detector.py (online, reads Neo4j results)

A "chain" is an ordered list of transaction dicts:
    [{"amount": float, "ts": timestamp, "channel": str}, ...]
sorted chronologically from first to last hop.
"""

import numpy as np
import pandas as pd
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# ── Feature schema (order matters for XGBoost consistency) ────────────────────
LAYERING_FEATURES = [
    "hop_count",                   # Number of hops (edges) in chain
    "mean_gap_minutes",            # Avg minutes between consecutive hops
    "std_gap_minutes",             # Std dev of gap — low = suspicious regularity
    "min_gap_minutes",             # Fastest hop
    "max_gap_minutes",             # Slowest hop
    "total_elapsed_minutes",       # First-to-last hop duration
    "log_initial_amount",          # log(1 + first hop amount) — normalised scale
    "amount_decay_ratio_mean",     # Mean of amounts[i+1]/amounts[i] — ~0.99 for layering
    "amount_decay_ratio_std",      # Std of decay ratios — low = consistent decay
    "amount_cv",                   # Coefficient of variation across all hop amounts
    "final_to_initial_ratio",      # amounts[-1] / amounts[0]
    "dominant_channel_ratio",      # Fraction of hops using the most common channel
    "is_imps_dominant",            # 1 if IMPS is the dominant channel
    "is_rtgs_dominant",            # 1 if RTGS is the dominant channel
    "is_neft_dominant",            # 1 if NEFT is the dominant channel
    "rapid_hop_ratio",             # Fraction of gaps < 30 minutes
    "amount_above_50k_ratio",      # Fraction of hops with amount >= 50,000
    "amount_above_100k_ratio",     # Fraction of hops with amount >= 100,000
]


# ── Timestamp parsing ─────────────────────────────────────────────────────────
def _parse_ts(ts) -> Optional[datetime]:
    """Parse timestamp from Neo4j DateTime, Python datetime, pandas Timestamp, or ISO string."""
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts.replace(tzinfo=None)
    if hasattr(ts, "to_native"):          # Neo4j DateTime object
        return ts.to_native().replace(tzinfo=None)
    if hasattr(ts, "to_pydatetime"):      # pandas Timestamp
        return ts.to_pydatetime().replace(tzinfo=None)
    try:
        parsed = pd.to_datetime(str(ts), errors="coerce")
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime().replace(tzinfo=None)
    except Exception:
        return None


# ── Core feature extractor ────────────────────────────────────────────────────
def extract_chain_features(chain_txns: List[Dict]) -> Optional[Dict]:
    """
    Extract 18 features from an ordered list of hop-level transaction dicts.

    Args:
        chain_txns: List of dicts, each with keys:
                    - "amount"  (float)
                    - "ts"      (any parseable timestamp)
                    - "channel" (str: "UPI", "IMPS", "NEFT", "RTGS")
                    List must be sorted chronologically (oldest first).

    Returns:
        Dict mapping LAYERING_FEATURES -> float values, or None if chain is
        invalid (fewer than 2 hops or fewer than 2 parseable timestamps).
    """
    if len(chain_txns) < 2:
        return None

    amounts    = [float(t.get("amount", 0) or 0)         for t in chain_txns]
    channels   = [str(t.get("channel", "") or "").upper().strip() for t in chain_txns]
    timestamps = [_parse_ts(t.get("ts") or t.get("txn_ts")) for t in chain_txns]

    # Require at least 2 valid timestamps to compute time gaps
    valid_ts = [(i, ts) for i, ts in enumerate(timestamps) if ts is not None]
    if len(valid_ts) < 2:
        return None

    # ── Time gap features ─────────────────────────────────────────────────────
    gaps_minutes: List[float] = []
    for k in range(len(valid_ts) - 1):
        _, ts1 = valid_ts[k]
        _, ts2 = valid_ts[k + 1]
        gap = (ts2 - ts1).total_seconds() / 60.0
        gaps_minutes.append(max(gap, 0.0))

    hop_count     = len(chain_txns)
    mean_gap      = float(np.mean(gaps_minutes))  if gaps_minutes else 0.0
    std_gap       = float(np.std(gaps_minutes))   if gaps_minutes else 0.0
    min_gap       = float(np.min(gaps_minutes))   if gaps_minutes else 0.0
    max_gap       = float(np.max(gaps_minutes))   if gaps_minutes else 0.0
    total_elapsed = float(np.sum(gaps_minutes))

    # ── Amount features ───────────────────────────────────────────────────────
    initial_amount = amounts[0] if amounts else 0.0
    final_amount   = amounts[-1] if amounts else 0.0

    # Decay ratios: amounts[i+1] / amounts[i]
    decay_ratios: List[float] = []
    for k in range(len(amounts) - 1):
        if amounts[k] > 0:
            decay_ratios.append(amounts[k + 1] / amounts[k])

    decay_mean  = float(np.mean(decay_ratios)) if decay_ratios else 1.0
    decay_std   = float(np.std(decay_ratios))  if decay_ratios else 0.0
    amount_cv   = float(np.std(amounts) / max(np.mean(amounts), 1.0))
    final_ratio = final_amount / max(initial_amount, 1.0)

    # ── Channel features ──────────────────────────────────────────────────────
    channel_counts = Counter(channels)
    dominant_ch    = channel_counts.most_common(1)[0][0] if channel_counts else ""
    dominant_ratio = channel_counts[dominant_ch] / hop_count if hop_count > 0 else 0.0

    # ── Velocity features ─────────────────────────────────────────────────────
    rapid_ratio = sum(1 for g in gaps_minutes if g < 30) / max(len(gaps_minutes), 1)
    above_50k   = sum(1 for a in amounts if a >= 50_000)  / hop_count
    above_100k  = sum(1 for a in amounts if a >= 100_000) / hop_count

    return {
        "hop_count":               float(hop_count),
        "mean_gap_minutes":        mean_gap,
        "std_gap_minutes":         std_gap,
        "min_gap_minutes":         min_gap,
        "max_gap_minutes":         max_gap,
        "total_elapsed_minutes":   total_elapsed,
        "log_initial_amount":      float(np.log1p(initial_amount)),
        "amount_decay_ratio_mean": decay_mean,
        "amount_decay_ratio_std":  decay_std,
        "amount_cv":               amount_cv,
        "final_to_initial_ratio":  final_ratio,
        "dominant_channel_ratio":  dominant_ratio,
        "is_imps_dominant":        1.0 if dominant_ch == "IMPS" else 0.0,
        "is_rtgs_dominant":        1.0 if dominant_ch == "RTGS" else 0.0,
        "is_neft_dominant":        1.0 if dominant_ch == "NEFT" else 0.0,
        "rapid_hop_ratio":         rapid_ratio,
        "amount_above_50k_ratio":  above_50k,
        "amount_above_100k_ratio": above_100k,
    }


# ── Training data construction (CSV -> chain samples) ─────────────────────────
def _reconstruct_positive_chains(df_txn: pd.DataFrame) -> List[List[Dict]]:
    """
    Reconstruct layering chains from LAYERING-labeled transactions.

    Strategy:
      1. Build a forward adjacency map: sender -> [outgoing layering txns]
      2. Find chain entry points: senders that never appear as a receiver
      3. Greedy forward traversal: follow the money until the chain ends
    """
    layer = df_txn[df_txn["pattern_type"] == "LAYERING"].copy()
    if layer.empty:
        return []

    layer["txn_ts"] = pd.to_datetime(layer["txn_ts"], errors="coerce")
    layer = layer.dropna(subset=["txn_ts"]).sort_values("txn_ts")

    # Forward adjacency: sender -> sorted list of outgoing hops
    forward: Dict[str, List[Dict]] = {}
    for _, row in layer.iterrows():
        s = str(row["sender_id"])
        if s not in forward:
            forward[s] = []
        forward[s].append({
            "receiver": str(row["receiver_id"]),
            "amount":   float(row["amount"]),
            "ts":       row["txn_ts"],
            "channel":  str(row.get("channel", "IMPS")).upper(),
        })
    # Sort each sender's outgoing edges chronologically
    for s in forward:
        forward[s].sort(key=lambda x: x["ts"])

    all_receivers = set(layer["receiver_id"].astype(str))
    all_senders   = set(layer["sender_id"].astype(str))
    starts        = all_senders - all_receivers      # True chain entry points

    # Fallback: if all senders are also receivers (rare edge case), use all senders
    if not starts:
        starts = all_senders

    chains: List[List[Dict]] = []
    seen_starts: set = set()

    for start in starts:
        if start in seen_starts:
            continue
        seen_starts.add(start)

        txn_chain: List[Dict] = []
        current = start
        visited = {start}

        for _ in range(12):  # Safety cap: max 12 hops
            if current not in forward:
                break
            candidates = [t for t in forward[current] if t["receiver"] not in visited]
            if not candidates:
                break

            if txn_chain:
                last_ts = txn_chain[-1]["ts"]
                # Prefer outgoing txns that happen AFTER the last arrival
                after = [c for c in candidates if c["ts"] >= last_ts]
                nxt = (
                    min(after, key=lambda x: x["ts"])
                    if after
                    else min(candidates, key=lambda x: x["ts"])
                )
            else:
                nxt = min(candidates, key=lambda x: x["ts"])

            txn_chain.append({
                "amount":  nxt["amount"],
                "ts":      nxt["ts"],
                "channel": nxt["channel"],
            })
            visited.add(nxt["receiver"])
            current = nxt["receiver"]

        if len(txn_chain) >= 2:
            chains.append(txn_chain)

    return chains


def _build_negative_chains(
    df_txn: pd.DataFrame,
    n_samples: int = 800,
    rng_seed: int = 42,
) -> List[List[Dict]]:
    """
    Build random multi-hop paths from non-fraud SUCCESS transactions
    as negative (non-layering) training examples.

    Deliberately samples diverse hop counts (2-6), channels, timings,
    and amounts to teach XGBoost what normal multi-hop flows look like.
    """
    normal = df_txn[
        (df_txn["is_fraud"].astype(str).str.lower().isin(["false", "0"])) &
        (df_txn["status"].str.upper() == "SUCCESS")
    ].copy()

    if normal.empty:
        return []

    normal["txn_ts"] = pd.to_datetime(normal["txn_ts"], errors="coerce")
    normal = normal.dropna(subset=["txn_ts"]).sort_values("txn_ts")

    # Forward adjacency (cap per sender to avoid memory blow-up on 400K rows)
    forward: Dict[str, List[Dict]] = {}
    for _, row in normal.iterrows():
        s = str(row["sender_id"])
        if s not in forward:
            forward[s] = []
        if len(forward[s]) < 30:
            forward[s].append({
                "receiver": str(row["receiver_id"]),
                "amount":   float(row["amount"]),
                "ts":       row["txn_ts"],
                "channel":  str(row.get("channel", "UPI")).upper(),
            })

    senders = list(forward.keys())
    if not senders:
        return []

    rng    = np.random.RandomState(rng_seed)
    chains: List[List[Dict]] = []
    attempts = 0

    while len(chains) < n_samples and attempts < n_samples * 15:
        attempts += 1
        start = senders[rng.randint(0, len(senders))]
        target_len = int(rng.randint(2, 7))     # 2-6 hops

        txn_chain: List[Dict] = []
        current = start
        visited = {start}

        for _ in range(target_len):
            if current not in forward:
                break
            candidates = [t for t in forward[current] if t["receiver"] not in visited]
            if not candidates:
                break
            nxt = candidates[int(rng.randint(0, len(candidates)))]
            txn_chain.append({
                "amount":  nxt["amount"],
                "ts":      nxt["ts"],
                "channel": nxt["channel"],
            })
            visited.add(nxt["receiver"])
            current = nxt["receiver"]

        if len(txn_chain) >= 2:
            chains.append(txn_chain)

    return chains


def build_layering_training_dataset(
    df_txn: pd.DataFrame,
    neg_multiplier: int = 10,
    rng_seed: int = 42,
) -> Tuple[pd.DataFrame, np.ndarray]:
    """
    Build the full chain-level training dataset for the layering XGBoost.

    Returns:
        X : pd.DataFrame with columns = LAYERING_FEATURES
        y : np.ndarray of int labels (1 = layering, 0 = normal)
    """
    print("  Reconstructing positive layering chains from CSV...")
    pos_chains = _reconstruct_positive_chains(df_txn)
    print(f"    Found {len(pos_chains)} positive chains")

    n_neg = max(len(pos_chains) * neg_multiplier, 200)
    print(f"  Sampling {n_neg} negative chains...")
    neg_chains = _build_negative_chains(df_txn, n_samples=n_neg, rng_seed=rng_seed)
    print(f"    Sampled {len(neg_chains)} negative chains")

    rows: List[Dict] = []
    labels: List[int] = []

    for chain in pos_chains:
        feats = extract_chain_features(chain)
        if feats is not None:
            rows.append({col: feats.get(col, 0.0) for col in LAYERING_FEATURES})
            labels.append(1)

    for chain in neg_chains:
        feats = extract_chain_features(chain)
        if feats is not None:
            rows.append({col: feats.get(col, 0.0) for col in LAYERING_FEATURES})
            labels.append(0)

    if not rows:
        raise ValueError(
            "No valid chain samples extracted from transactions.csv. "
            "Ensure the file contains LAYERING-labeled rows and non-fraud rows."
        )

    X = pd.DataFrame(rows, columns=LAYERING_FEATURES)
    y = np.array(labels, dtype=np.int64)

    pos_count = int(y.sum())
    neg_count = int((y == 0).sum())
    print(f"  Dataset: {len(X)} samples — {pos_count} positive, {neg_count} negative")
    print(f"  Class ratio: 1:{neg_count // max(pos_count, 1)}")

    return X, y


# ── Round-Trip Feature Extraction ─────────────────────────────────────────────

ROUNDTRIP_FEATURES = [
    "cycle_length",
    "total_cycle_time_hours",
    "avg_hop_time_minutes",
    "return_amount_ratio",
    "amount_cv_across_hops",
    "velocity_score",
]

def extract_roundtrip_features(chain_txns: List[Dict]) -> Optional[Dict]:
    """
    Extract features from a circular transaction chain (A -> B -> ... -> A).
    """
    if not chain_txns or len(chain_txns) < 3:
        return None

    amounts = [float(t["amount"]) for t in chain_txns]
    ts_list = [_parse_ts(t["ts"]) for t in chain_txns]

    if None in ts_list:
        return None

    # Time features
    durations_min = []
    for i in range(len(ts_list) - 1):
        dt = (ts_list[i+1] - ts_list[i]).total_seconds() / 60.0
        durations_min.append(max(0.0, dt))

    total_time_hours = sum(durations_min) / 60.0
    avg_hop_time_minutes = float(np.mean(durations_min)) if durations_min else 0.0

    # Amount features
    initial_amount = amounts[0]
    final_amount = amounts[-1]
    
    return_amount_ratio = (final_amount / initial_amount) if initial_amount > 0 else 0.0
    amount_cv = float(np.std(amounts) / np.mean(amounts)) if np.mean(amounts) > 0 else 0.0

    # Velocity score: shorter total time = higher velocity score
    velocity_score = 1000.0 / (total_time_hours + 1.0)

    return {
        "cycle_length": float(len(chain_txns)),
        "total_cycle_time_hours": float(total_time_hours),
        "avg_hop_time_minutes": float(avg_hop_time_minutes),
        "return_amount_ratio": float(return_amount_ratio),
        "amount_cv_across_hops": float(amount_cv),
        "velocity_score": float(velocity_score),
    }

def _reconstruct_roundtrip_chains(df_txn: pd.DataFrame) -> List[List[Dict]]:
    rt_txns = df_txn[
        (df_txn["pattern_type"].notna()) &
        (df_txn["pattern_type"].str.contains("ROUND_TRIP", na=False))
    ].sort_values("txn_ts")

    if rt_txns.empty:
        return []

    chains = []
    visited = set()
    
    # Simple heuristic to reconstruct loops:
    # Group by amount and date, or just traverse. Since synthetic data is chronological,
    # we can group by pattern index if available, or just build chains based on account links.
    # To keep it simple, we just find any chain of length 3-5 that starts and ends at the same node.
    
    # We will just traverse edges like we did for layering, but looking for a loop.
    txn_list = rt_txns.to_dict("records")
    tx_by_sender = {}
    for tx in txn_list:
        tx_by_sender.setdefault(tx["sender_id"], []).append({
            "sender": tx["sender_id"],
            "receiver": tx["receiver_id"],
            "amount": float(tx["amount"]),
            "ts": tx["txn_ts"],
            "channel": tx["channel"]
        })
        
    def dfs(current, start, path, depth):
        if depth >= 3 and current == start:
            chains.append(list(path))
            return
        if depth >= 5:
            return
        for nxt in tx_by_sender.get(current, []):
            if not path or nxt["ts"] >= path[-1]["ts"]:
                dfs(nxt["receiver"], start, path + [nxt], depth + 1)
                
    # Search from each node
    for start_node in tx_by_sender.keys():
        dfs(start_node, start_node, [], 0)
        
    return chains

def build_roundtrip_training_dataset(
    df_txn: pd.DataFrame,
    neg_multiplier: int = 10,
    rng_seed: int = 42,
) -> Tuple[pd.DataFrame, np.ndarray]:
    
    print("  Reconstructing positive roundtrip chains from CSV...")
    pos_chains = _reconstruct_roundtrip_chains(df_txn)
    # Deduplicate chains
    unique_pos = []
    seen = set()
    for chain in pos_chains:
        sig = tuple((t["sender"], t["receiver"]) for t in chain)
        if sig not in seen:
            seen.add(sig)
            unique_pos.append(chain)
    pos_chains = unique_pos
    print(f"    Found {len(pos_chains)} positive chains")
    
    # For negatives, we can just use the negative chains built for layering, 
    # but append a final hop back to the start to simulate a random loop.
    n_neg = max(len(pos_chains) * neg_multiplier, 200)
    print(f"  Sampling {n_neg} negative chains...")
    neg_chains_base = _build_negative_chains(df_txn, n_samples=n_neg, rng_seed=rng_seed)
    
    # Force them to be loops by faking the last hop back to sender
    neg_chains = []
    for chain in neg_chains_base:
        if len(chain) >= 2:
            fake_hop = dict(chain[-1])
            # Just add 10 minutes to the last hop's time to simulate the loop closing
            from datetime import timedelta
            last_ts = _parse_ts(chain[-1]["ts"])
            if last_ts:
                fake_hop["ts"] = last_ts + timedelta(minutes=10)
            neg_chains.append(chain + [fake_hop])
            
    print(f"    Sampled {len(neg_chains)} negative chains")

    rows = []
    labels = []

    for chain in pos_chains:
        feats = extract_roundtrip_features(chain)
        if feats is not None:
            rows.append(feats)
            labels.append(1)

    for chain in neg_chains:
        feats = extract_roundtrip_features(chain)
        if feats is not None:
            rows.append(feats)
            labels.append(0)

    if not rows:
        raise ValueError("No roundtrip valid chain samples extracted.")

    X = pd.DataFrame(rows, columns=ROUNDTRIP_FEATURES).fillna(0)
    y = np.array(labels, dtype=np.int64)

    return X, y
