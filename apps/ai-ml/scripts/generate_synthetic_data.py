#!/usr/bin/env python3
"""
TRACE-X Synthetic Data Generator
Generates entities.csv, accounts.csv, transactions.csv, and account_stats.csv
Requires NO external dependencies (no pandas, no faker). Uses standard library only.
"""

import csv
import random
import uuid
import math
from datetime import datetime, timedelta
import os

# Configuration
NUM_ENTITIES = 500
ACCOUNTS_PER_ENTITY_RANGE = (1, 3)
BASE_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 6, 24)

# File paths
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ENTITIES_FILE = os.path.join(OUTPUT_DIR, "entities.csv")
ACCOUNTS_FILE = os.path.join(OUTPUT_DIR, "accounts.csv")
TRANSACTIONS_FILE = os.path.join(OUTPUT_DIR, "transactions.csv")
STATS_FILE = os.path.join(OUTPUT_DIR, "account_stats.csv")

random.seed(42)

def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def generate_entities():
    print(f"Generating {NUM_ENTITIES} entities...")
    entities = []
    for i in range(NUM_ENTITIES):
        entity_type = random.choices(["INDIVIDUAL", "BUSINESS", "TRUST"], weights=[0.85, 0.14, 0.01])[0]
        entities.append({
            "entity_id": f"ENT_{i:05d}",
            "entity_type": entity_type,
            "entity_name": f"{entity_type}_{i}",
            "pan_number": f"PAN{random.randint(10000, 99999)}",
            "registration_date": random_date(BASE_DATE - timedelta(days=3650), BASE_DATE).strftime("%Y-%m-%d"),
            "kyc_status": random.choices(["VERIFIED", "PENDING", "REJECTED"], weights=[0.9, 0.08, 0.02])[0],
            "pin_code": f"4000{random.randint(10, 99)}"
        })
    return entities

def generate_accounts(entities):
    print("Generating accounts...")
    accounts = []
    acc_id_counter = 1
    for ent in entities:
        num_accs = random.randint(*ACCOUNTS_PER_ENTITY_RANGE)
        for _ in range(num_accs):
            acc_type = random.choice(["SAVINGS", "CURRENT", "SALARY"])
            kyc_tier = random.randint(0, 3)
            
            # 0=Student, 1=Salaried, 2=Business, 3=HNI
            if ent["entity_type"] == "BUSINESS":
                kyc_tier = random.choice([2, 3])
                acc_type = "CURRENT"
            elif ent["entity_type"] == "TRUST":
                kyc_tier = 3
                acc_type = "CURRENT"
            
            declared_income = 0
            if kyc_tier == 1: declared_income = random.randint(3, 15) * 100000
            elif kyc_tier == 2: declared_income = random.randint(10, 100) * 100000
            elif kyc_tier == 3: declared_income = random.randint(100, 1000) * 100000
            
            accounts.append({
                "account_id": f"ACC_{acc_id_counter:05d}",
                "entity_id": ent["entity_id"],
                "account_type": acc_type,
                "kyc_tier": kyc_tier,
                "status": "ACTIVE",
                "opened_on": random_date(BASE_DATE, END_DATE - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S"),
                "declared_income": declared_income,
                "branch_code": "UBIN0001",
                "current_balance": round(random.uniform(1000, 5000000), 2),
                "is_fraud": False,
                "pattern_type": "NONE"
            })
            acc_id_counter += 1
    return accounts

def create_transaction(sender, receiver, amount, txn_ts, channel="NEFT", is_fraud=False, pattern_type="NONE"):
    return {
        "txn_id": f"TXN_{uuid.uuid4().hex[:12]}",
        "sender_id": sender,
        "receiver_id": receiver,
        "amount": round(amount, 2),
        "channel": channel,
        "txn_ts": txn_ts.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "SUCCESS",
        "narration": "Transfer",
        "is_fraud": is_fraud,
        "pattern_type": pattern_type
    }

def generate_base_transactions(accounts):
    print("Generating base (normal) transactions...")
    txns = []
    # Just generate some random noise
    num_normal_txns = len(accounts) * 10
    for _ in range(num_normal_txns):
        sender = random.choice(accounts)
        receiver = random.choice(accounts)
        while receiver["account_id"] == sender["account_id"]:
            receiver = random.choice(accounts)
        
        amount = random.uniform(500, 50000)
        txn_ts = random_date(BASE_DATE, END_DATE)
        channel = random.choice(["UPI", "NEFT", "IMPS"])
        txns.append(create_transaction(sender["account_id"], receiver["account_id"], amount, txn_ts, channel))
    return txns

def inject_layering(accounts, txns):
    print("Injecting Pattern 1: Rapid Layering...")
    # A -> B -> C -> D in < 120 mins
    for _ in range(20):
        chain = random.sample(accounts, 4)
        for acc in chain:
            acc["is_fraud"] = True
            acc["pattern_type"] = "LAYERING"
        
        start_time = random_date(BASE_DATE, END_DATE - timedelta(days=1))
        initial_amount = random.uniform(500000, 5000000)
        
        current_time = start_time
        current_amount = initial_amount
        for i in range(3):
            txns.append(create_transaction(chain[i]["account_id"], chain[i+1]["account_id"], current_amount, current_time, "RTGS", True, "LAYERING"))
            current_time += timedelta(minutes=random.randint(2, 30))
            current_amount = current_amount * random.uniform(0.95, 0.99) # Preservation

def inject_round_tripping(accounts, txns):
    print("Injecting Pattern 2: Round-Tripping...")
    # A -> B -> C -> A where start and end entity are same
    for _ in range(20):
        # find two accounts with same entity
        entities_with_mult_accs = {}
        for acc in accounts:
            entities_with_mult_accs.setdefault(acc["entity_id"], []).append(acc)
        
        valid_entities = [e for e, accs in entities_with_mult_accs.items() if len(accs) >= 2]
        if not valid_entities: continue
        
        ent = random.choice(valid_entities)
        acc_A = entities_with_mult_accs[ent][0]
        acc_A_return = entities_with_mult_accs[ent][1] # Can be same or different account of same entity
        acc_B, acc_C = random.sample([a for a in accounts if a["entity_id"] != ent], 2)
        
        for acc in [acc_A, acc_B, acc_C, acc_A_return]:
            acc["is_fraud"] = True
            acc["pattern_type"] = "ROUND_TRIP"
            
        start_time = random_date(BASE_DATE, END_DATE - timedelta(days=2))
        amount = random.uniform(1000000, 8000000)
        
        t1 = start_time
        t2 = t1 + timedelta(hours=random.randint(1, 10))
        t3 = t2 + timedelta(hours=random.randint(1, 10))
        
        txns.append(create_transaction(acc_A["account_id"], acc_B["account_id"], amount, t1, "RTGS", True, "ROUND_TRIP"))
        txns.append(create_transaction(acc_B["account_id"], acc_C["account_id"], amount * 0.98, t2, "RTGS", True, "ROUND_TRIP"))
        txns.append(create_transaction(acc_C["account_id"], acc_A_return["account_id"], amount * 0.95, t3, "RTGS", True, "ROUND_TRIP"))

def inject_smurfing(accounts, txns):
    print("Injecting Pattern 3: Smurfing...")
    # Multiple transfers just below 10L
    for _ in range(20):
        receiver = random.choice(accounts)
        senders = random.sample(accounts, random.randint(3, 7))
        receiver["is_fraud"] = True
        receiver["pattern_type"] = "SMURFING"
        for s in senders:
            s["is_fraud"] = True
            s["pattern_type"] = "SMURFING"
            
        base_time = random_date(BASE_DATE, END_DATE - timedelta(days=1))
        
        for s in senders:
            amount = random.uniform(850000, 990000) # Below 10L
            t = base_time + timedelta(hours=random.randint(0, 23))
            txns.append(create_transaction(s["account_id"], receiver["account_id"], amount, t, "NEFT", True, "SMURFING"))

def inject_dormancy(accounts, txns):
    print("Injecting Pattern 4: Dormant Activation...")
    for _ in range(15):
        mule = random.choice(accounts)
        if mule["is_fraud"]: continue
        
        mule["is_fraud"] = True
        mule["pattern_type"] = "DORMANT_ACTIVATION"
        
        # Make the account look dormant
        mule["opened_on"] = (END_DATE - timedelta(days=400)).strftime("%Y-%m-%d %H:%M:%S")
        # Ensure no transactions for a long time (handled in stats later)
        
        activation_time = END_DATE - timedelta(days=2)
        sender = random.choice(accounts)
        receiver = random.choice(accounts)
        
        # Massive inflow
        amount = random.uniform(2000000, 10000000)
        txns.append(create_transaction(sender["account_id"], mule["account_id"], amount, activation_time, "RTGS", True, "DORMANT_ACTIVATION"))
        
        # Immediate outflow
        txns.append(create_transaction(mule["account_id"], receiver["account_id"], amount * 0.99, activation_time + timedelta(minutes=15), "RTGS", True, "DORMANT_ACTIVATION"))

def inject_profile_mismatch(accounts, txns):
    print("Injecting Pattern 5: Profile Mismatch...")
    # Student receiving massive corporate wires
    students = [a for a in accounts if a["kyc_tier"] == 0 and not a["is_fraud"]]
    for _ in range(min(15, len(students))):
        student = random.choice(students)
        student["is_fraud"] = True
        student["pattern_type"] = "PROFILE_MISMATCH"
        
        corporates = [a for a in accounts if a["kyc_tier"] >= 2]
        if not corporates: break
        
        for _ in range(random.randint(2, 5)):
            corp = random.choice(corporates)
            amount = random.uniform(1500000, 5000000)
            t = random_date(END_DATE - timedelta(days=30), END_DATE)
            txns.append(create_transaction(corp["account_id"], student["account_id"], amount, t, "RTGS", True, "PROFILE_MISMATCH"))

def write_csv(filename, data):
    if not data: return
    keys = data[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"Wrote {len(data)} rows to {filename}")

def generate_stats(accounts, txns):
    print("Calculating account stats...")
    stats = []
    # simple mock stats for now
    for acc in accounts:
        acc_txns_out = [t for t in txns if t["sender_id"] == acc["account_id"]]
        vol_7d = sum(t["amount"] for t in acc_txns_out)
        stats.append({
            "account_id": acc["account_id"],
            "txn_count_7d": len(acc_txns_out),
            "volume_7d": round(vol_7d, 2),
            "avg_monthly_volume": round(vol_7d * 4, 2),
            "unique_recipients": len(set(t["receiver_id"] for t in acc_txns_out)),
            "last_active_ts": END_DATE.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": END_DATE.strftime("%Y-%m-%d %H:%M:%S")
        })
    return stats

if __name__ == "__main__":
    entities = generate_entities()
    accounts = generate_accounts(entities)
    txns = generate_base_transactions(accounts)
    
    inject_layering(accounts, txns)
    inject_round_tripping(accounts, txns)
    inject_smurfing(accounts, txns)
    inject_dormancy(accounts, txns)
    inject_profile_mismatch(accounts, txns)
    
    # Sort transactions by time
    txns.sort(key=lambda x: x["txn_ts"])
    
    stats = generate_stats(accounts, txns)
    
    write_csv(ENTITIES_FILE, entities)
    write_csv(ACCOUNTS_FILE, accounts)
    write_csv(TRANSACTIONS_FILE, txns)
    write_csv(STATS_FILE, stats)
    
    print("Done! Data generation complete.")
