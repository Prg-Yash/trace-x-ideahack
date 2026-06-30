import argparse
import os
import random
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

import numpy as np
import pandas as pd
from faker import Faker

DATA_DIR = Path(__file__).resolve().parent
LABELS_DIR = DATA_DIR / "labels"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic TRACE-X data for Production ML Training.")
    parser.add_argument("--accounts", type=int, default=20000, help="Total accounts to create")
    parser.add_argument("--normal-txns", type=int, default=400000, help="Normal transactions to create")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    
    # Auto-calculated if 0
    parser.add_argument("--layering-chains", type=int, default=0)
    parser.add_argument("--round-trips", type=int, default=0)
    parser.add_argument("--smurf-clusters", type=int, default=0)
    parser.add_argument("--dormant-activations", type=int, default=0)
    parser.add_argument("--profile-mismatches", type=int, default=0)

    parser.add_argument("--neo4j-accounts", type=int, default=5000)
    parser.add_argument("--neo4j-transactions", type=int, default=100000)
    parser.add_argument("--neo4j-dir", type=str, default="neo4j")
    parser.add_argument("--no-neo4j-sample", action="store_true")

    return parser.parse_args()


def next_txn_id(counter: Dict[str, int], width: int) -> str:
    counter["value"] += 1
    return f"TXN_{counter['value']:0{width}d}"


def make_txn(counter, width, sender_id, receiver_id, amount, channel, txn_ts, status, narration, is_fraud=False, pattern_type="NONE"):
    return {
        "txn_id": next_txn_id(counter, width),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "amount": round(float(amount), 2),
        "channel": channel,
        "txn_ts": txn_ts,
        "status": status,
        "narration": narration,
        "is_fraud": is_fraud,
        "pattern_type": pattern_type,
    }


def compute_auto_counts(total_accounts: int) -> Dict[str, int]:
    return {
        "layering_chains": max(80, total_accounts // 150),
        "round_trips": max(50, total_accounts // 200),
        "smurf_clusters": max(200, total_accounts // 50),
        "dormant_activations": max(60, total_accounts // 150),
        "profile_mismatches": max(50, total_accounts // 200),
    }


def build_neo4j_sample(
    df_acc: pd.DataFrame,
    df_txn: pd.DataFrame,
    fraud_accounts: Set[str],
    target_accounts: int,
    target_txns: int,
    seed: int,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    rng = random.Random(seed)
    acc_ids = df_acc["account_id"].tolist()

    if target_accounts <= 0 or target_txns <= 0:
        return pd.DataFrame(), pd.DataFrame()

    target_accounts = min(target_accounts, len(acc_ids))
    fraud_list = list(fraud_accounts)
    target_fraud = min(len(fraud_list), max(100, target_accounts // 10))
    selected = set(rng.sample(fraud_list, target_fraud)) if fraud_list else set()

    remaining = target_accounts - len(selected)
    if remaining > 0:
        non_fraud = [a for a in acc_ids if a not in selected]
        selected.update(rng.sample(non_fraud, min(remaining, len(non_fraud))))

    filtered = df_txn[df_txn["sender_id"].isin(selected) & df_txn["receiver_id"].isin(selected)]

    while len(filtered) < target_txns and len(selected) < len(acc_ids):
        add_count = min(500, len(acc_ids) - len(selected))
        candidates = [a for a in acc_ids if a not in selected]
        selected.update(rng.sample(candidates, add_count))
        filtered = df_txn[df_txn["sender_id"].isin(selected) & df_txn["receiver_id"].isin(selected)]

    if len(filtered) > target_txns:
        filtered = filtered.sample(n=target_txns, random_state=seed).reset_index(drop=True)

    active_ids = set(filtered["sender_id"]).union(set(filtered["receiver_id"]))
    df_acc_sample = df_acc[df_acc["account_id"].isin(active_ids)].copy()

    return df_acc_sample, filtered.reset_index(drop=True)


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    np.random.seed(args.seed)
    fake = Faker("en_IN")
    Faker.seed(args.seed)

    os.makedirs(DATA_DIR, exist_ok=True)
    LABELS_DIR.mkdir(parents=True, exist_ok=True)

    auto_counts = compute_auto_counts(args.accounts)
    layering_chains = args.layering_chains or auto_counts["layering_chains"]
    round_trips = args.round_trips or auto_counts["round_trips"]
    smurf_clusters = args.smurf_clusters or auto_counts["smurf_clusters"]
    dormant_activations = args.dormant_activations or auto_counts["dormant_activations"]
    profile_mismatches = args.profile_mismatches or auto_counts["profile_mismatches"]

    acc_width = max(4, len(str(args.accounts)))
    txn_width = max(7, len(str(args.normal_txns + 100000)))

    print("Generating entities and accounts...")
    
    num_entities = int(args.accounts * 0.7)
    entities = []
    
    for i in range(num_entities):
        ent_type = random.choices(["INDIVIDUAL", "BUSINESS", "TRUST"], weights=[80, 15, 5])[0]
        kyc_tier = random.choices([0, 1, 2, 3], weights=[10, 40, 40, 10])[0]
        if ent_type != "INDIVIDUAL":
            kyc_tier = random.choice([2, 3])
            
        income = 0
        if kyc_tier == 1: income = random.randint(3, 15) * 100000
        elif kyc_tier == 2: income = random.randint(10, 100) * 100000
        elif kyc_tier == 3: income = random.randint(100, 1000) * 100000
        
        entities.append({
            "entity_id": f"ENT_{i:0{acc_width}d}",
            "entity_type": ent_type,
            "kyc_tier": kyc_tier,
            "declared_annual_income": income,
            "kyc_status": "VERIFIED",
            "age": random.randint(18, 65) if ent_type == "INDIVIDUAL" else None,
            "geography_tier": random.choices(["metro", "tier2", "rural"], weights=[50, 30, 20])[0]
        })

    df_ent = pd.DataFrame(entities)
    
    accounts = []
    for i in range(args.accounts):
        ent = random.choice(entities)
        accounts.append({
            "account_id": f"ACC_{i:0{acc_width}d}",
            "entity_id": ent["entity_id"],
            "account_type": "CURRENT" if ent["entity_type"] != "INDIVIDUAL" else random.choice(["SAVINGS", "SALARY"]),
            "kyc_tier": ent["kyc_tier"],
            "status": "ACTIVE",
            "opened_on": fake.date_between(start_date="-5y", end_date="today").isoformat(),
            "risk_category": random.choices(["LOW", "MEDIUM", "HIGH"], weights=[70, 20, 10])[0],
            "is_fraud": False,
            "pattern_type": "NONE"
        })

    df_acc = pd.DataFrame(accounts)
    acc_ids = df_acc["account_id"].tolist()

    # Make sure dormant accounts are actually marked dormant
    dormant_candidates = set(random.sample(acc_ids, int(args.accounts * 0.08)))
    df_acc.loc[df_acc['account_id'].isin(dormant_candidates), 'status'] = 'DORMANT'

    print("Generating normal transactions...")

    account_balances = {acc["account_id"]: random.uniform(50000, 500000) for acc in accounts}
    account_opened = {acc["account_id"]: datetime.fromisoformat(acc["opened_on"]) for acc in accounts}

    transactions: List[Dict] = []
    fraud_accounts: Set[str] = set()
    counter = {"value": 0}

    active_accounts = [acc for acc in acc_ids if acc not in dormant_candidates]

    for _ in range(args.normal_txns):
        sender = random.choice(active_accounts)
        receiver = random.choice(active_accounts)
        while receiver == sender:
            receiver = random.choice(active_accounts)

        amount = min(np.random.lognormal(mean=9.5, sigma=1.8), 2000000)
        
        if amount >= 200000:
            channel = random.choices(["RTGS", "NEFT", "IMPS"], weights=[60, 30, 10])[0]
        else:
            channel = random.choices(["UPI", "IMPS", "NEFT"], weights=[60, 25, 15])[0]
            if channel == "UPI":
                amount = min(amount, 100000)

        if account_balances[sender] < amount:
            account_balances[sender] += random.uniform(50000, 200000)

        account_balances[sender] -= amount
        account_balances[receiver] += amount

        start_date = max(account_opened[sender], account_opened[receiver])
        if start_date > datetime.now(): start_date = datetime.now() - timedelta(days=1)
        min_date = datetime.now() - timedelta(days=120)
        if start_date < min_date: start_date = min_date
            
        txn_ts = fake.date_time_between(start_date, "now")
        status = random.choices(["SUCCESS", "FAILED", "PENDING"], weights=[92, 4, 4])[0]

        if channel in ["UPI", "IMPS"] and amount < 10000:
            narration = random.choice(["grocery shopping", "cab fare", "mobile recharge", "restaurant payment"])
        else:
            narration = random.choice(["salary credit", "rent payment", "investment transfer", "business settlement"])

        transactions.append(
            make_txn(counter, txn_width, sender, receiver, amount, channel, txn_ts, status, narration)
        )

    print("Planting distinct behavioral fraud patterns...")

    pattern_labels = defaultdict(set)

    def generate_legitimate_chain(base_amount_range=None, is_roundtrip=False):
        length = random.randint(6, 10) if not is_roundtrip else random.randint(3, 6)
        chain_accs = random.sample(acc_ids, length)
        if is_roundtrip:
            chain_accs.append(chain_accs[0])
            
        base_time = datetime.now() - timedelta(days=random.randint(1, 60))
        max_opened = max([account_opened[a] for a in chain_accs])
        if base_time < max_opened: base_time = max_opened + timedelta(days=1)
        if base_time > datetime.now(): base_time = datetime.now() - timedelta(hours=72)
        
        profile_type = random.choice(["RETAIL", "SME_PAYMENT", "CORP_TREASURY", "HFT_EXPRESS"])
        if profile_type == "HFT_EXPRESS":
            base_amount = random.uniform(10000, 75000)
            decay_range = (0.99, 1.01)
            time_gap_hours = random.uniform(0.001, 0.03) 
        elif profile_type == "CORP_TREASURY":
            base_amount = random.uniform(500000, 2500000) 
            decay_range = (0.95, 1.01) 
            time_gap_hours = random.uniform(0.5, 4.0) 
        elif profile_type == "SME_PAYMENT":
            base_amount = random.uniform(60000, 300000)
            decay_range = (0.90, 1.05)
            time_gap_hours = random.uniform(2.0, 12.0)
        else:
            base_amount = random.uniform(1000, 20000)
            decay_range = (0.50, 0.95)
            time_gap_hours = random.uniform(12.0, 72.0)
            
        amount = base_amount
        account_balances[chain_accs[0]] += amount
        
        running_amount = amount
        for i in range(len(chain_accs) - 1):
            decay = random.uniform(*decay_range)
            running_amount = round(running_amount * decay, 2)
            account_balances[chain_accs[i]] -= running_amount
            account_balances[chain_accs[i + 1]] += running_amount
            
            hop_delay = time_gap_hours + random.gauss(0, time_gap_hours * 0.1)
            hop_delay = max(0.1, hop_delay)
            base_time += timedelta(hours=hop_delay)
            
            transactions.append(
                make_txn(
                    counter, txn_width, chain_accs[i], chain_accs[i + 1], running_amount,
                    random.choice(["NEFT", "RTGS", "IMPS"]), 
                    base_time,
                    "SUCCESS", "transfer", False, "LEGITIMATE_ROUNDTRIP" if is_roundtrip else "LEGITIMATE_CHAIN"
                )
            )

    # Pattern 1: Rapid Layering
    for _ in range(layering_chains):
        chain = random.sample(acc_ids, random.randint(6, 10))
        base_time = datetime.now() - timedelta(days=random.randint(1, 60))
        max_opened = max([account_opened[a] for a in chain])
        if base_time < max_opened: base_time = max_opened + timedelta(days=1)
        if base_time > datetime.now(): base_time = datetime.now() - timedelta(minutes=60)
        
        amount = random.uniform(100000, 400000) # Keep under 5L to realistically use IMPS
        account_balances[chain[0]] += amount
        
        running_amount = amount
        for i in range(len(chain) - 1):
            decay = random.uniform(0.92, 0.99)  # Random jitter to prevent data leakage
            running_amount *= decay
            account_balances[chain[i]] -= running_amount
            account_balances[chain[i + 1]] += running_amount
            fraud_accounts.update([chain[i], chain[i + 1]])
            pattern_labels[chain[i]].add("LAYERING")
            pattern_labels[chain[i + 1]].add("LAYERING") # Fix Receiver Blindspot
            time_jitter = random.randint(2, 12)  # Variable hop timing
            transactions.append(
                make_txn(
                    counter, txn_width, chain[i], chain[i + 1], running_amount,
                    random.choice(["IMPS", "NEFT", "RTGS"]),  # Vary channels
                    base_time + timedelta(minutes=i * time_jitter + random.randint(0, 5)),
                    "SUCCESS", "transfer", True, "LAYERING"
                )
            )
            
        # Add 3 legitimate chains for every 1 fraud chain
        generate_legitimate_chain((5000, 50000))
        generate_legitimate_chain((50000, 500000))
        generate_legitimate_chain((100000, 2000000))

    # Pattern 2: Round-Tripping
    for _ in range(round_trips):
        ring = random.sample(acc_ids, random.randint(3, 6))
        ring.append(ring[0])
        base_time = datetime.now() - timedelta(days=random.randint(1, 45))
        max_opened = max([account_opened[a] for a in ring])
        if base_time < max_opened: base_time = max_opened + timedelta(days=1)
        if base_time > datetime.now(): base_time = datetime.now() - timedelta(minutes=60)
        
        amount = random.uniform(500000, 5000000)
        account_balances[ring[0]] += amount
        
        running_amount = amount
        for i in range(len(ring) - 1):
            decay = random.uniform(0.93, 0.99)  # Random jitter to prevent data leakage
            running_amount *= decay
            account_balances[ring[i]] -= running_amount
            account_balances[ring[i + 1]] += running_amount
            fraud_accounts.update([ring[i], ring[i + 1]])
            pattern_labels[ring[i]].add("ROUND_TRIP")
            pattern_labels[ring[i + 1]].add("ROUND_TRIP") # Fix Receiver Blindspot
            time_jitter = random.uniform(1.0, 4.0)  # Variable hop timing in hours
            transactions.append(
                make_txn(
                    counter, txn_width, ring[i], ring[i + 1], running_amount,
                    random.choice(["RTGS", "NEFT"]),  # Vary channels
                    base_time + timedelta(hours=i * time_jitter + random.uniform(0, 1)),
                    "SUCCESS", "settlement", True, "ROUND_TRIP"
                )
            )

        # Add 3 legitimate round-trips for every 1 fraud roundtrip
        generate_legitimate_chain((5000, 50000), True)
        generate_legitimate_chain((50000, 500000), True)
        generate_legitimate_chain((100000, 2000000), True)

    # Pattern 3: Multi-Tier Smurfing
    # Smurfing = behavioral pattern (burst + recipient diversity), NOT specific amounts.
    # Real criminals structure transactions at MULTIPLE threshold levels.
    # Each tier avoids a different financial reporting/monitoring threshold.
    SMURF_TIERS = [
        # (tier_label, amount_mean, amount_std, amount_min, amount_max,
        #  channels, n_recv_min, n_recv_max, time_window_hours, narrations)
        (
            "MICRO",          # Avoids ₹10,000 cash reporting / UPI informal threshold
            5000, 1500, 2000, 8999,
            ["IMPS", "UPI"],
            50, 120,
            48,
            ["personal transfer", "family support", "daily allowance", "misc payment"]
        ),
        (
            "SMALL",          # Mid-tier structuring, avoids ₹25k NEFT attention
            16000, 4000, 8000, 24999,
            ["IMPS", "NEFT", "UPI"],
            25, 70,
            48,
            ["vendor payment", "freelance fee", "part payment", "service charge"]
        ),
        (
            "UPI_THRESHOLD",  # Classic UPI threshold avoidance (below ₹1L)
            83000, 9000, 65000, 99000,
            ["UPI"],
            15, 30,
            24,
            ["split transfer", "goods payment", "settlement", "trade payment"]
        ),
        (
            "RTGS_THRESHOLD", # Avoids ₹5L RTGS / large-value reporting threshold
            340000, 80000, 180000, 490000,
            ["RTGS", "NEFT", "WIRE"],
            5, 14,
            72,
            ["business settlement", "bulk payment", "project advance", "inter-firm transfer"]
        ),
    ]

    # Distribute smurf_clusters across all 4 tiers proportionally
    # More clusters for lower tiers (harder to detect = more common in practice)
    tier_weights = [0.30, 0.30, 0.25, 0.15]
    tier_counts = [max(1, int(smurf_clusters * w)) for w in tier_weights]
    # Correct rounding so total = smurf_clusters
    tier_counts[-1] = smurf_clusters - sum(tier_counts[:-1])

    for (tier_label, amt_mean, amt_std, amt_min, amt_max,
         channels, n_recv_min, n_recv_max, window_hours, narrations), n_clusters \
            in zip(SMURF_TIERS, tier_counts):

        for _ in range(n_clusters):
            master = random.choice(acc_ids)
            n_receivers = random.randint(n_recv_min, n_recv_max)
            receivers = random.sample([a for a in acc_ids if a != master], n_receivers)

            # Spread transactions over the window — NOT all at the same minute
            base_time = datetime.now() - timedelta(days=random.randint(1, 25))
            all_accs = [master] + receivers
            max_opened = max(account_opened[a] for a in all_accs)
            if base_time < max_opened:
                base_time = max_opened + timedelta(days=1)
            if base_time > datetime.now():
                base_time = datetime.now() - timedelta(hours=window_hours + 1)

            fraud_accounts.add(master)
            pattern_labels[master].add("SMURFING")

            for recv in receivers:
                fraud_accounts.add(recv)
                pattern_labels[recv].add("SMURFING")

                # Amount: Gaussian around mean, clipped to [min, max]
                smurf_amount = random.gauss(amt_mean, amt_std)
                smurf_amount = max(amt_min, min(smurf_amount, amt_max))
                account_balances[master] = max(account_balances.get(master, 0), 0) + smurf_amount

                # Channel: pick randomly from tier's allowed channels
                channel = random.choice(channels)

                # Timestamp: random spread within the window
                # Add slight clustering (real smurfs burst in sub-windows)
                minutes_offset = random.uniform(1, window_hours * 60)
                txn_time = base_time + timedelta(minutes=minutes_offset)

                transactions.append(
                    make_txn(
                        counter, txn_width, master, recv,
                        round(smurf_amount, 2),
                        channel,
                        txn_time,
                        "SUCCESS",
                        random.choice(narrations),
                        True, "SMURFING"
                    )
                )

    # Pattern 4: Dormant Activation
    dormant_targets = list(dormant_candidates)[:dormant_activations]
    for acc in dormant_targets:
        spike_time = datetime.now() - timedelta(hours=random.randint(2, 48))
        amount = np.random.lognormal(mean=14.5, sigma=1.0) # Blur the Lines: overlaps with legitimate high salary territory
        
        interacting_acc = random.choice(acc_ids)
        max_opened = max(account_opened[acc], account_opened[interacting_acc])
        if spike_time < max_opened: spike_time = max_opened + timedelta(minutes=30)
        if spike_time > datetime.now(): spike_time = datetime.now() - timedelta(minutes=60)
        account_balances[interacting_acc] += amount
        
        fraud_accounts.update([acc, interacting_acc])
        pattern_labels[acc].add("DORMANT_ACTIVATION")
        pattern_labels[interacting_acc].add("DORMANT_ACTIVATION") # Fix Receiver Blindspot

        transactions.append(
            make_txn(
                counter, txn_width, interacting_acc, acc, amount, "RTGS", spike_time, "SUCCESS", "urgent credit", True, "DORMANT_ACTIVATION"
            )
        )
        
        interacting_acc2 = random.choice(acc_ids)
        fraud_accounts.update([interacting_acc2])
        pattern_labels[interacting_acc2].add("DORMANT_ACTIVATION")
        
        transactions.append(
            make_txn(
                counter, txn_width, acc, interacting_acc2, amount * 0.99, "RTGS", spike_time + timedelta(hours=random.randint(1, 6)), "SUCCESS", "urgent payout", True, "DORMANT_ACTIVATION"
            )
        )

    # Pattern 5: Profile Mismatch (Students receiving corporate wires)
    student_accs = df_acc[df_acc['kyc_tier'] == 0]['account_id'].tolist()
    corp_accs = df_acc[df_acc['kyc_tier'] >= 2]['account_id'].tolist()
    if student_accs and corp_accs:
        for _ in range(profile_mismatches):
            student = random.choice(student_accs)
            fraud_accounts.add(student)
            pattern_labels[student].add("PROFILE_MISMATCH")
            
            for _ in range(random.randint(3, 8)):
                corp = random.choice(corp_accs)
                fraud_accounts.add(corp)
                pattern_labels[corp].add("PROFILE_MISMATCH") # Fix Asymmetric label
                amount = np.random.lognormal(mean=14.2, sigma=1.2) # Blur the Lines: overlap with normal business transfers
                t = datetime.now() - timedelta(days=random.randint(1, 30))
                max_opened = max(account_opened[student], account_opened[corp])
                if t < max_opened: t = max_opened + timedelta(days=1)
                if t > datetime.now(): t = datetime.now() - timedelta(minutes=60)
                account_balances[corp] += amount
                
                transactions.append(
                    make_txn(
                        counter, txn_width, corp, student, amount, "RTGS", t, "SUCCESS", "corporate settlement", True, "PROFILE_MISMATCH"
                    )
                )

    # Finalize labels without overwriting
    def get_pattern(acc_id):
        if acc_id in pattern_labels:
            return "|".join(sorted(list(pattern_labels[acc_id])))
        return "NONE"

    df_acc['is_fraud'] = df_acc['account_id'].isin(fraud_accounts)
    df_acc['pattern_type'] = df_acc['account_id'].apply(get_pattern)

    df_txn = pd.DataFrame(transactions).sample(frac=1, random_state=args.seed).reset_index(drop=True)
    df_txn["txn_ts"] = pd.to_datetime(df_txn["txn_ts"])

    # --- Generate Account Stats (Feature Store / Aggregations) ---
    print("Aggregating historical features into account_stats.csv...")
    # --- Fix Point-In-Time Lookahead Bias ---
    now = datetime.now()
    fraud_txns = df_txn[df_txn["is_fraud"] == True]
    first_fraud = pd.concat([
        fraud_txns.groupby("sender_id")["txn_ts"].min(),
        fraud_txns.groupby("receiver_id")["txn_ts"].min()
    ]).groupby(level=0).min().to_dict()
    
    cutoff_series = pd.Series(df_acc["account_id"].apply(lambda x: first_fraud.get(x, now)).values, index=df_acc["account_id"])

    ledger = pd.concat(
        [
            df_txn[["sender_id", "receiver_id", "amount", "txn_ts", "pattern_type"]].rename(
                columns={"sender_id": "account_id", "receiver_id": "counterparty_id"}
            ),
            df_txn[["receiver_id", "sender_id", "amount", "txn_ts", "pattern_type"]].rename(
                columns={"receiver_id": "account_id", "sender_id": "counterparty_id"}
            ),
        ],
        ignore_index=True,
    )

    # Filter ledger to STRICTLY before cutoff time for each account
    ledger["cutoff_time"] = ledger["account_id"].map(cutoff_series)
    ledger = ledger[ledger["txn_ts"] < ledger["cutoff_time"]]

    def window_stats(days):
        window = ledger[ledger["txn_ts"] >= (ledger["cutoff_time"] - timedelta(days=days))]
        return window.groupby("account_id").agg(**{f"txn_count_{days}d": ("amount", "size"), f"volume_{days}d": ("amount", "sum")})

    stats_7d = window_stats(7)
    stats_30d = window_stats(30)
    
    window_180 = ledger[ledger["txn_ts"] >= (ledger["cutoff_time"] - timedelta(days=180))]
    stats_180 = window_180.groupby("account_id").agg(total_count_180d=("amount", "size"), total_volume_180d=("amount", "sum"))
    
    unique_30d = ledger[ledger["txn_ts"] >= (ledger["cutoff_time"] - timedelta(days=30))].groupby("account_id")["counterparty_id"].nunique().rename("unique_counterparties_30d")
    last_active = ledger[ledger["pattern_type"] != "DORMANT_ACTIVATION"].groupby("account_id")["txn_ts"].max().rename("last_active_ts")

    df_stats = pd.DataFrame(index=df_acc["account_id"]).join(stats_7d).join(stats_30d).join(stats_180).join(unique_30d).join(last_active)
    
    df_stats["txn_count_7d"] = df_stats["txn_count_7d"].fillna(0).astype(int)
    df_stats["txn_count_30d"] = df_stats["txn_count_30d"].fillna(0).astype(int)
    df_stats["volume_7d"] = df_stats["volume_7d"].fillna(0.0)
    df_stats["volume_30d"] = df_stats["volume_30d"].fillna(0.0)
    df_stats["total_count_180d"] = df_stats["total_count_180d"].fillna(0).astype(int)
    df_stats["total_volume_180d"] = df_stats["total_volume_180d"].fillna(0.0)
    df_stats["unique_counterparties_30d"] = df_stats["unique_counterparties_30d"].fillna(0).astype(int)
    df_stats["avg_monthly_count"] = (df_stats["total_count_180d"] / 6).round(2)
    df_stats["avg_monthly_volume"] = (df_stats["total_volume_180d"] / 6).round(2)
    
    # Calculate dormancy accurately based on point-in-time
    df_acc_dates = df_acc.set_index("account_id")[["opened_on"]]
    df_stats = df_stats.join(df_acc_dates)
    df_stats["cutoff_time"] = cutoff_series
    
    df_stats["dormancy_days"] = df_stats.apply(
        lambda row: int((row["cutoff_time"] - row["last_active_ts"]).days if pd.notna(row["last_active_ts"]) else (row["cutoff_time"].date() - pd.to_datetime(row["opened_on"]).date()).days),
        axis=1,
    )
    df_stats = df_stats.drop(columns=["opened_on", "cutoff_time"])
    df_stats = df_stats.reset_index()
    df_stats["last_active_ts"] = df_stats["last_active_ts"].apply(lambda v: v.isoformat() if pd.notna(v) else None)

    # --- Format Outputs ---
    df_txn["txn_ts"] = df_txn["txn_ts"].apply(lambda value: value.isoformat())
    df_ent = df_ent[["entity_id", "entity_type", "declared_annual_income", "kyc_status", "age", "geography_tier"]]
    
    # NO FRAUD SCORE LEAKAGE! The ML model must learn from the account stats and graph topology!
    df_acc = df_acc[["account_id", "entity_id", "account_type", "kyc_tier", "status", "opened_on", "risk_category", "is_fraud", "pattern_type"]]
    
    print("Writing files to Polyglot schema architecture...")
    df_ent.to_csv(DATA_DIR / "entities.csv", index=False)
    df_acc.to_csv(DATA_DIR / "accounts.csv", index=False)
    df_stats.to_csv(DATA_DIR / "account_stats.csv", index=False)
    df_txn.to_csv(DATA_DIR / "transactions.csv", index=False)

    print("\nDone.")
    print(f"Entities:     {len(df_ent)}")
    print(f"Accounts:     {len(df_acc)}")
    print(f"Transactions: {len(df_txn)}")
    print(f"Fraud accounts: {df_acc['is_fraud'].sum()} ({df_acc['is_fraud'].mean()*100:.1f}%)")

    # --- Neo4j Sample Update ---
    if not args.no_neo4j_sample:
        neo4j_dir = DATA_DIR / args.neo4j_dir
        neo4j_dir.mkdir(parents=True, exist_ok=True)

        df_acc_sample, df_txn_sample = build_neo4j_sample(
            df_acc, df_txn, fraud_accounts, args.neo4j_accounts, args.neo4j_transactions, args.seed
        )

        if not df_acc_sample.empty and not df_txn_sample.empty:
            # We must only load topological data into Neo4j
            df_neo4j_acc = df_acc_sample[["account_id", "entity_id"]] # Strict Polyglot Persistence!
            df_neo4j_acc.to_csv(neo4j_dir / "accounts.csv", index=False)
            df_txn_sample.to_csv(neo4j_dir / "transactions.csv", index=False)
            print("\nNeo4j sample written (Strict Topology Format):")
            print(f"  Accounts: {len(df_neo4j_acc)}")
            print(f"  Transactions: {len(df_txn_sample)}")


if __name__ == "__main__":
    main()
