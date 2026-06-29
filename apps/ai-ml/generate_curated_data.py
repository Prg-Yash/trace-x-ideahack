import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

# Set random seeds for reproducibility
random.seed(42)
np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "data_curated"
NEO4J_DIR = OUTPUT_DIR / "neo4j"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
NEO4J_DIR.mkdir(parents=True, exist_ok=True)

BRANCHES = [
    ("Mumbai Main Branch", "MH001"),
    ("Kalyan East Branch", "MH042"),
    ("Connaught Place Delhi", "DL011"),
    ("MG Road Bengaluru", "KA005"),
    ("Cyber City Gurugram", "HR022"),
    ("BKC Corporate Tower", "MH099"),
    ("Salt Lake Kolkata", "WB014"),
    ("Banjara Hills Hyderabad", "TS008"),
    ("Anna Salai Chennai", "TN019"),
    ("Shivaji Nagar Pune", "MH033"),
]

INDIVIDUAL_NAMES = [
    "Ravi Sharma", "Aarav Mehta", "Priya Nair", "Vikram Malhotra", "Ananya Deshmukh",
    "Siddharth Rao", "Neha Gupta", "Karan Singhania", "Pooja Verma", "Rahul Khanna",
    "Aditya Joshi", "Sneha Patil", "Rohan Iyer", "Divya Agarwal", "Manish Tiwari",
    "Swati Saxena", "Amitabh Choudhury", "Kavita Reddy", "Nikhil Dubey", "Shreya Mishra"
]

COMPANY_NAMES = [
    "Nexus Capital Partners", "TechVantage Solutions Ltd", "Global Exports Corp",
    "Apex Trading Co", "BlueHorizon Holdings", "Vanguard Logistics", "Silverline Enterprises",
    "Quantum Dynamics LLC", "Skyline Infra Pvt Ltd", "Zenith Ventures"
]

ADDRESSES = [
    "Flat 402, Palm Heights, Mumbai, MH - 400050",
    "Sector 29, Cyber Hub, Gurugram, HR - 122001",
    "12/B, MG Road, Indiranagar, Bengaluru, KA - 560038",
    "Connaught Place, Outer Circle, New Delhi, DL - 110001",
    "Plot 88, Banjara Hills, Hyderabad, TS - 500034",
    "Anna Salai, Teynampet, Chennai, TN - 600018",
    "Salt Lake Sector V, Kolkata, WB - 700091",
    "FC Road, Shivaji Nagar, Pune, MH - 411005",
]

def generate():
    print("Generating curated dataset of 300 accounts & ~1000 transactions...")
    
    num_accounts = 300
    num_entities = 180
    
    # 1. Generate Entities
    entities = []
    for i in range(1, num_entities + 1):
        ent_id = f"ENT_{i:05d}"
        is_comp = i % 4 == 0
        ent_type = "COMPANY" if is_comp else "INDIVIDUAL"
        
        if is_comp:
            name = random.choice(COMPANY_NAMES) + f" #{i}"
            income = random.choice([5000000, 15000000, 50000000, 100000000])
            pan = f"AAAC{random.randint(1000,9999)}C"
            dob = f"{random.randint(2010, 2020)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        else:
            name = random.choice(INDIVIDUAL_NAMES) + f" ({i})"
            income = random.choice([300000, 600000, 1200000, 2500000])
            pan = f"ABCP{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1000,9999)}F"
            dob = f"{random.randint(1975, 1998)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            
        addr = random.choice(ADDRESSES)
        entities.append({
            "entity_id": ent_id,
            "entity_type": ent_type,
            "declared_annual_income": income,
            "kyc_status": "VERIFIED",
            "customer_name": name,
            "pan_number": pan,
            "dob": dob,
            "address": addr
        })
    df_entities = pd.DataFrame(entities)
    
    # Assign specific patterns to accounts
    # 1..15: LAYERING
    # 16..30: SMURFING
    # 31..45: ROUND_TRIP
    # 46..60: KYC_MISMATCH
    # 61..75: DORMANT
    # 76..300: NONE
    
    accounts = []
    for i in range(1, num_accounts + 1):
        acc_id = f"ACC_{i:05d}"
        ent_id = f"ENT_{(i % num_entities) + 1:05d}"
        branch_name, branch_code = BRANCHES[i % len(BRANCHES)]
        
        if i <= 15:
            pattern = "LAYERING"
            risk = "CRITICAL"
            is_fraud = True
            status = "ACTIVE"
            acc_type = "CURRENT"
            kyc_tier = 2
        elif i <= 30:
            pattern = "SMURFING"
            risk = "HIGH"
            is_fraud = True
            status = "ACTIVE"
            acc_type = "SAVINGS"
            kyc_tier = 1
        elif i <= 45:
            pattern = "ROUND_TRIP"
            risk = "CRITICAL"
            is_fraud = True
            status = "ACTIVE"
            acc_type = "CURRENT"
            kyc_tier = 3
        elif i <= 60:
            pattern = "KYC_MISMATCH"
            risk = "HIGH"
            is_fraud = True
            status = "ACTIVE"
            acc_type = "SAVINGS"
            kyc_tier = 1
        elif i <= 75:
            pattern = "DORMANT"
            risk = "MEDIUM"
            is_fraud = True
            status = "DORMANT"
            acc_type = "SAVINGS"
            kyc_tier = 2
        else:
            pattern = "NONE"
            risk = "LOW"
            is_fraud = False
            status = "ACTIVE"
            acc_type = random.choice(["SAVINGS", "CURRENT", "SALARY"])
            kyc_tier = random.choice([2, 3])
            
        opened_on = f"{random.randint(2021, 2024)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        
        accounts.append({
            "account_id": acc_id,
            "entity_id": ent_id,
            "account_type": acc_type,
            "kyc_tier": kyc_tier,
            "status": status,
            "opened_on": opened_on,
            "risk_category": risk,
            "is_fraud": is_fraud,
            "pattern_type": pattern,
            "branch_name": branch_name,
            "branch_code": branch_code
        })
    df_accounts = pd.DataFrame(accounts)
    
    # Generate Transactions & Stats
    txns = []
    txn_counter = 100000
    base_time = datetime.now() - timedelta(days=30)
    
    # 1. Layering chains (SWIFT / Crypto / Wire)
    for chain_idx in range(1, 16, 3):
        s1 = f"ACC_{chain_idx:05d}"
        s2 = f"ACC_{chain_idx+1:05d}"
        s3 = f"ACC_{chain_idx+2:05d}"
        end_acc = f"ACC_{random.randint(76, 150):05d}"
        amt = round(random.uniform(450000, 850000), 2)
        
        t1 = base_time + timedelta(days=random.randint(1, 10))
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": s1, "receiver_id": s2, "amount": amt, "channel": "SWIFT", "txn_ts": t1.isoformat(), "status": "SUCCESS", "narration": "Cross border settlement", "is_fraud": True, "pattern_type": "LAYERING"})
        txn_counter += 1
        
        t2 = t1 + timedelta(minutes=random.randint(15, 120))
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": s2, "receiver_id": s3, "amount": round(amt * 0.98, 2), "channel": "Crypto Rail", "txn_ts": t2.isoformat(), "status": "SUCCESS", "narration": "Digital asset escrow", "is_fraud": True, "pattern_type": "LAYERING"})
        txn_counter += 1
        
        t3 = t2 + timedelta(minutes=random.randint(10, 60))
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": s3, "receiver_id": end_acc, "amount": round(amt * 0.95, 2), "channel": "Wire Transfer", "txn_ts": t3.isoformat(), "status": "SUCCESS", "narration": "Final vendor payout", "is_fraud": True, "pattern_type": "LAYERING"})
        txn_counter += 1

    # 2. Smurfing (many small deposits via UPI / IMPS below 50k threshold)
    for smurf_idx in range(16, 31):
        target = f"ACC_{smurf_idx:05d}"
        for _ in range(8):
            src = f"ACC_{random.randint(151, 300):05d}"
            amt = round(random.uniform(42000, 49500), 2)
            ts = base_time + timedelta(days=random.randint(5, 25), hours=random.randint(1, 20))
            txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": src, "receiver_id": target, "amount": amt, "channel": random.choice(["UPI", "IMPS"]), "txn_ts": ts.isoformat(), "status": "SUCCESS", "narration": "Personal assistance transfer", "is_fraud": True, "pattern_type": "SMURFING"})
            txn_counter += 1

    # 3. Round-Trip circular chains
    for rt_idx in range(31, 44, 3):
        a1 = f"ACC_{rt_idx:05d}"
        a2 = f"ACC_{rt_idx+1:05d}"
        a3 = f"ACC_{rt_idx+2:05d}"
        amt = round(random.uniform(300000, 600000), 2)
        t1 = base_time + timedelta(days=random.randint(12, 18))
        
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": a1, "receiver_id": a2, "amount": amt, "channel": "RTGS", "txn_ts": t1.isoformat(), "status": "SUCCESS", "narration": "Project advance", "is_fraud": True, "pattern_type": "ROUND_TRIP"})
        txn_counter += 1
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": a2, "receiver_id": a3, "amount": round(amt * 0.99, 2), "channel": "NEFT", "txn_ts": (t1 + timedelta(hours=4)).isoformat(), "status": "SUCCESS", "narration": "Subcontractor fee", "is_fraud": True, "pattern_type": "ROUND_TRIP"})
        txn_counter += 1
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": a3, "receiver_id": a1, "amount": round(amt * 0.97, 2), "channel": "RTGS", "txn_ts": (t1 + timedelta(hours=24)).isoformat(), "status": "SUCCESS", "narration": "Consulting rebate return", "is_fraud": True, "pattern_type": "ROUND_TRIP"})
        txn_counter += 1

    # 4. KYC Mismatch (Low declared income entity doing massive transfers)
    for kyc_idx in range(46, 61):
        acc = f"ACC_{kyc_idx:05d}"
        for _ in range(4):
            counterparty = f"ACC_{random.randint(100, 300):05d}"
            amt = round(random.uniform(250000, 750000), 2)
            ts = base_time + timedelta(days=random.randint(1, 28))
            txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": counterparty, "receiver_id": acc, "amount": amt, "channel": "RTGS", "txn_ts": ts.isoformat(), "status": "SUCCESS", "narration": "Investment inflow", "is_fraud": True, "pattern_type": "KYC_MISMATCH"})
            txn_counter += 1

    # 5. Dormant sudden activation
    for dorm_idx in range(61, 76):
        acc = f"ACC_{dorm_idx:05d}"
        dest = f"ACC_{random.randint(100, 300):05d}"
        amt = round(random.uniform(900000, 1800000), 2)
        ts = datetime.now() - timedelta(hours=random.randint(2, 48))
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": acc, "receiver_id": dest, "amount": amt, "channel": "SWIFT", "txn_ts": ts.isoformat(), "status": "SUCCESS", "narration": "High value account liquidation", "is_fraud": True, "pattern_type": "DORMANT"})
        txn_counter += 1

    # 6. Normal legitimate background transactions
    while len(txns) < 1000:
        s = f"ACC_{random.randint(76, 300):05d}"
        r = f"ACC_{random.randint(76, 300):05d}"
        if s == r: continue
        amt = round(random.uniform(500, 35000), 2)
        ts = base_time + timedelta(days=random.randint(0, 29), hours=random.randint(0, 23))
        ch = random.choice(["UPI", "NEFT", "IMPS"])
        txns.append({"txn_id": f"TXN_{txn_counter}", "sender_id": s, "receiver_id": r, "amount": amt, "channel": ch, "txn_ts": ts.isoformat(), "status": "SUCCESS", "narration": random.choice(["Grocery", "Rent payment", "Invoice settlement", "Utility bill", "Peer transfer"]), "is_fraud": False, "pattern_type": "NONE"})
        txn_counter += 1

    df_txns = pd.DataFrame(txns)
    
    # Calculate account_stats
    stats = []
    for acc_id in df_accounts["account_id"]:
        acc_txns = df_txns[(df_txns["sender_id"] == acc_id) | (df_txns["receiver_id"] == acc_id)]
        c_30d = len(acc_txns)
        v_30d = round(acc_txns["amount"].sum(), 2)
        dormancy = 180 if int(acc_id.split("_")[1]) in range(61, 76) else random.randint(1, 10)
        last_ts = acc_txns["txn_ts"].max() if c_30d > 0 else (datetime.now() - timedelta(days=dormancy)).isoformat()
        
        stats.append({
            "account_id": acc_id,
            "txn_count_7d": max(1, int(c_30d / 4)),
            "volume_7d": round(v_30d / 4, 2),
            "txn_count_30d": c_30d,
            "volume_30d": v_30d,
            "total_count_180d": c_30d * 6,
            "total_volume_180d": round(v_30d * 6, 2),
            "unique_counterparties_30d": min(c_30d, max(1, int(c_30d * 0.7))),
            "last_active_ts": last_ts,
            "avg_monthly_count": max(1, c_30d),
            "avg_monthly_volume": max(1000.0, v_30d),
            "dormancy_days": dormancy
        })
    df_stats = pd.DataFrame(stats)

    # Save CSVs
    print(f"Saving to {OUTPUT_DIR}...")
    df_entities.to_csv(OUTPUT_DIR / "entities.csv", index=False)
    df_accounts.to_csv(OUTPUT_DIR / "accounts.csv", index=False)
    df_stats.to_csv(OUTPUT_DIR / "account_stats.csv", index=False)
    df_txns.to_csv(OUTPUT_DIR / "transactions.csv", index=False)
    
    # Also save for Neo4j
    df_accounts.to_csv(NEO4J_DIR / "accounts.csv", index=False)
    df_txns.to_csv(NEO4J_DIR / "transactions.csv", index=False)
    
    print(f"Done! Generated {len(df_accounts)} accounts, {len(df_entities)} entities, and {len(df_txns)} transactions.")

if __name__ == "__main__":
    generate()
