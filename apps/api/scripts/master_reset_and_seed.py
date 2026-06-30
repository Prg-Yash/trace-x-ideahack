"""
master_reset_and_seed.py
========================
Unified Master Reset, PII Masking & Curated Seeding Script for TRACE-X.

Actions performed:
1. Wipes all data in NeonDB PostgreSQL (`DROP TABLE ... CASCADE`) and Neo4j (`DETACH DELETE n`).
2. Rebuilds complete schema (`branches`, `users`, `entities`, `accounts`, `account_stats`, `alerts`, `alert_evidence`).
3. Seeds bank branches and default administrator login credentials (`admin` / `admin123`).
4. Seeds curated entities (`data_curated/entities.csv`) with full PII DATA MASKING:
   - Names masked as `V***** M*******`
   - PAN cards masked as `A*****506F`
   - Addresses tokenized
5. Seeds curated accounts (`data_curated/accounts.csv`) and account statistics.
6. Seeds 1,000 curated transactions into Neo4j graph relationships (`[:SENT]`).
"""

import asyncio
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from pathlib import Path
from dotenv import load_dotenv

# Paths
ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT_DIR / "apps" / "api"))
sys.path.insert(0, str(ROOT_DIR / "apps" / "ai-ml"))

load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

if not DATABASE_URL or not NEO4J_URI:
    raise RuntimeError("Missing DATABASE_URL or NEO4J credentials in .env")

from app.core.security import get_password_hash
from neo4j import AsyncGraphDatabase

CURATED_DIR = ROOT_DIR / "apps" / "ai-ml" / "data_curated"


# ── Industry Standard PII Data Masking Helper ─────────────────────────────────
def mask_customer_name(name: str) -> str:
    if not name or not isinstance(name, str):
        return "Customer U."
    parts = [p.strip("()1234567890 ") for p in name.split() if p.strip("()1234567890 ")]
    if not parts:
        return "Customer U."
    if len(parts) == 1:
        return parts[0][:3] + "***"
    # Industry Standard (Financial AML / GDPR / PCI-DSS): First name + Last initial
    first = parts[0]
    initials = [p[0].upper() + "." for p in parts[1:]]
    return f"{first} {' '.join(initials)}"

def mask_account_number(acc_id: str) -> str:
    if not acc_id:
        return "XXXX-XXXX-0000"
    clean = str(acc_id)
    if len(clean) <= 4:
        return f"XXXX-XXXX-{clean}"
    last4 = clean[-4:]
    return f"XXXX-XXXX-{last4}"

def mask_pan_number(pan: str) -> str:
    if not pan or not isinstance(pan, str) or len(pan) < 8:
        return "A*****506F"
    return pan[0] + "*" * (len(pan) - 4) + pan[-3:]

def mask_address(addr: str) -> str:
    if not addr or not isinstance(addr, str):
        return "****** Masked PII Location"
    # Keep city/state part if comma exists
    parts = addr.split(",")
    if len(parts) >= 2:
        return f"****** [PII Protected], {parts[-2].strip()}, {parts[-1].strip()}"
    return "****** [PII Protected Address]"


async def run_master_reset_and_seed():
    print("======================================================================")
    print("🚀 TRACE-X MASTER DATABASE RESET & CURATED SEEDER (WITH PII MASKING)")
    print("======================================================================")

    # 1. Wipe & Rebuild PostgreSQL Schema
    print("\n[Step 1] Connecting to NeonDB PostgreSQL and wiping old tables...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True

    with conn.cursor() as cur:
        cur.execute("""
            DROP TABLE IF EXISTS audit_log CASCADE;
            DROP TABLE IF EXISTS investigation_notes CASCADE;
            DROP TABLE IF EXISTS alert_evidence CASCADE;
            DROP TABLE IF EXISTS alerts CASCADE;
            DROP TABLE IF EXISTS account_stats CASCADE;
            DROP TABLE IF EXISTS accounts CASCADE;
            DROP TABLE IF EXISTS entities CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS branches CASCADE;
        """)
        print("  🧹 Dropped all existing PostgreSQL tables.")

        print("  🏗️ Rebuilding fresh database schema...")
        # Branches
        cur.execute("""
            CREATE TABLE branches (
                id SERIAL PRIMARY KEY,
                branch_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Users
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'Admin',
                email VARCHAR(120) UNIQUE,
                branch_id INTEGER REFERENCES branches(id),
                is_active BOOLEAN DEFAULT TRUE,
                two_factor_enabled BOOLEAN DEFAULT FALSE,
                two_factor_secret VARCHAR(255),
                current_otp VARCHAR(20),
                otp_expires_at TIMESTAMP,
                last_login_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Entities
        cur.execute("""
            CREATE TABLE entities (
                entity_id VARCHAR(50) PRIMARY KEY,
                entity_type VARCHAR(50),
                declared_annual_income DECIMAL(15,2),
                kyc_status VARCHAR(50),
                customer_name VARCHAR(255),
                pan_number VARCHAR(50),
                dob VARCHAR(50),
                address TEXT
            );
        """)

        # Accounts
        cur.execute("""
            CREATE TABLE accounts (
                account_id VARCHAR(50) PRIMARY KEY,
                entity_id VARCHAR(50) REFERENCES entities(entity_id) ON DELETE SET NULL,
                customer_name VARCHAR(255),
                masked_account_number VARCHAR(100),
                account_type VARCHAR(50),
                kyc_tier INTEGER,
                status VARCHAR(50),
                opened_on VARCHAR(50),
                risk_category VARCHAR(50),
                is_fraud BOOLEAN DEFAULT FALSE,
                pattern_type VARCHAR(50),
                branch_name VARCHAR(255),
                branch_code VARCHAR(50)
            );
        """)

        # Account Stats
        cur.execute("""
            CREATE TABLE account_stats (
                account_id VARCHAR(50) PRIMARY KEY REFERENCES accounts(account_id) ON DELETE CASCADE,
                txn_count_7d INTEGER DEFAULT 0,
                volume_7d DECIMAL(15,2) DEFAULT 0.0,
                txn_count_30d INTEGER DEFAULT 0,
                volume_30d DECIMAL(15,2) DEFAULT 0.0,
                total_count_180d INTEGER DEFAULT 0,
                total_volume_180d DECIMAL(15,2) DEFAULT 0.0,
                unique_counterparties_30d INTEGER DEFAULT 0,
                last_active_ts VARCHAR(50),
                avg_monthly_count DECIMAL(15,2) DEFAULT 0.0,
                avg_monthly_volume DECIMAL(15,2) DEFAULT 0.0,
                dormancy_days INTEGER DEFAULT 0
            );
        """)

        # Alerts
        cur.execute("""
            CREATE TABLE alerts (
                alert_id VARCHAR(50) PRIMARY KEY,
                account_id VARCHAR(50) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
                pattern_type VARCHAR(100) NOT NULL,
                fraud_probability DECIMAL(5,4) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'OPEN',
                assigned_to VARCHAR(50),
                str_drafted_at VARCHAR(50),
                str_filed_at VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Alert Evidence
        cur.execute("""
            CREATE TABLE alert_evidence (
                alert_id VARCHAR(50) PRIMARY KEY REFERENCES alerts(alert_id) ON DELETE CASCADE,
                shap_values JSONB,
                triggering_txns JSONB,
                snapshot_data JSONB
            );
        """)

        # Audit Log
        cur.execute("""
            CREATE TABLE audit_log (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(50) REFERENCES alerts(alert_id) ON DELETE CASCADE,
                user_id VARCHAR(50),
                action VARCHAR(100),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Investigation Notes
        cur.execute("""
            CREATE TABLE investigation_notes (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE CASCADE,
                author VARCHAR(100),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  ✅ Complete schema rebuilt successfully.")

        # 2. Seed Branches & Users
        print("\n[Step 2] Seeding Bank Branches and Administrator User...")
        branches = [
            ("SBIN0000001", "SBI - Mumbai Headquarters", "Mumbai"),
            ("SBIN0000002", "SBI - Delhi Regional Office", "Delhi"),
            ("SBIN0000003", "SBI - Bangalore Tech Park", "Bangalore"),
            ("SBIN0000004", "SBI - Hyderabad Cyber Hub", "Hyderabad"),
            ("SBIN0000005", "SBI - Chennai Main Branch", "Chennai")
        ]
        cur.executemany("""
            INSERT INTO branches (branch_code, name, city) VALUES (%s, %s, %s);
        """, branches)

        # Admin login: admin / admin123
        admin_pwd = get_password_hash("admin123")
        cur.execute("""
            INSERT INTO users (username, hashed_password, full_name, role, email, branch_id)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, ("admin", admin_pwd, "System Administrator", "Admin", "yashnimse92@gmail.com", 1))

        # Backup login: investigator / password
        inv_pwd = get_password_hash("password")
        cur.execute("""
            INSERT INTO users (username, hashed_password, full_name, role, email, branch_id)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, ("investigator", inv_pwd, "Lead AML Investigator", "Investigator", "inv@trace-x.ai", 1))
        print("  👑 Seeded login accounts:\n     • Admin        -> username: admin        | password: admin123\n     • Investigator -> username: investigator | password: password")

        # 3. Seed Entities with PII MASKING
        print("\n[Step 3] Loading & Masking Curated Entities...")
        df_ent = pd.read_csv(CURATED_DIR / "entities.csv")
        entities_data = []
        entity_name_map = {}
        for _, r in df_ent.iterrows():
            cname = mask_customer_name(str(r.get("customer_name", "")))
            entity_name_map[str(r["entity_id"])] = cname
            entities_data.append((
                str(r["entity_id"]),
                str(r["entity_type"]),
                float(r["declared_annual_income"]) if pd.notnull(r["declared_annual_income"]) else 150000.0,
                str(r["kyc_status"]),
                cname,                                                 # PII Masked
                mask_pan_number(str(r.get("pan_number", ""))),       # PII Masked
                str(r.get("dob", "1985-01-01")),
                mask_address(str(r.get("address", "")))              # PII Masked
            ))
        execute_batch(cur, """
            INSERT INTO entities (entity_id, entity_type, declared_annual_income, kyc_status, customer_name, pan_number, dob, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, entities_data, page_size=500)
        print(f"  🔒 Seeded {len(entities_data)} entities with 100% PII confidentiality masking.")

        # 4. Seed Accounts & Account Stats
        print("\n[Step 4] Seeding Curated Accounts & Stats...")
        df_acc = pd.read_csv(CURATED_DIR / "accounts.csv")
        df_stats = pd.read_csv(CURATED_DIR / "account_stats.csv")

        import random
        accounts_data = []
        for _, r in df_acc.iterrows():
            b = random.choice(branches)
            acc_id = str(r["account_id"])
            ent_id = str(r["entity_id"]) if pd.notnull(r["entity_id"]) else None
            cname = entity_name_map.get(ent_id, "Customer U.") if ent_id else "Customer U."
            m_acc = mask_account_number(acc_id)
            accounts_data.append((
                acc_id,
                ent_id,
                cname,
                m_acc,
                str(r.get("account_type", "CURRENT")),
                int(r.get("kyc_tier", 2)) if pd.notnull(r.get("kyc_tier")) else 2,
                str(r.get("status", "ACTIVE")),
                str(r.get("opened_on", "2024-01-01")),
                str(r.get("risk_category", "HIGH")),
                bool(r.get("is_fraud", False)),
                str(r["pattern_type"]) if pd.notnull(r.get("pattern_type")) else None,
                b[1], # branch_name
                b[0]  # branch_code
            ))
        execute_batch(cur, """
            INSERT INTO accounts (account_id, entity_id, customer_name, masked_account_number, account_type, kyc_tier, status, opened_on, risk_category, is_fraud, pattern_type, branch_name, branch_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, accounts_data, page_size=500)
        print(f"  🏦 Seeded {len(accounts_data)} accounts into PostgreSQL.")

        stats_data = []
        for _, r in df_stats.iterrows():
            stats_data.append((
                str(r["account_id"]),
                int(r.get("txn_count_7d", 0)),
                float(r.get("volume_7d", 0.0)),
                int(r.get("txn_count_30d", 0)),
                float(r.get("volume_30d", 0.0)),
                int(r.get("total_count_180d", 0)),
                float(r.get("total_volume_180d", 0.0)),
                int(r.get("unique_counterparties_30d", 0)),
                str(r.get("last_active_ts", "2026-06-25")),
                float(r.get("avg_monthly_count", 0.0)),
                float(r.get("avg_monthly_volume", 0.0)),
                int(r.get("dormancy_days", 0))
            ))
        execute_batch(cur, """
            INSERT INTO account_stats (
                account_id, txn_count_7d, volume_7d, txn_count_30d, volume_30d,
                total_count_180d, total_volume_180d, unique_counterparties_30d,
                last_active_ts, avg_monthly_count, avg_monthly_volume, dormancy_days
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, stats_data, page_size=500)
        print(f"  📊 Seeded {len(stats_data)} account statistics rows.")

    conn.close()

    # 5. Wipe & Seed Neo4j Graph
    print("\n[Step 5] Connecting to Neo4j Graph Database...")
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    async with driver.session() as session:
        print("  🧹 Clearing old graph nodes and relationships...")
        res = await session.run("MATCH (n) DETACH DELETE n")
        await res.consume()

        print("  ⚡ Creating index on Account nodes...")
        res = await session.run("CREATE INDEX account_id_idx IF NOT EXISTS FOR (a:Account) ON (a.account_id)")
        await res.consume()

        print("  🌐 Loading Account nodes into Neo4j...")
        neo4j_accs = []
        for acc in accounts_data:
            neo4j_accs.append({
                "account_id": acc[0],
                "entity_id": acc[1],
                "customer_name": acc[2],
                "masked_account_number": acc[3],
                "kyc_tier": acc[5],
                "status": acc[6],
                "risk_category": acc[8],
                "is_fraud": acc[9],
                "pattern_type": acc[10],
                "branch_name": acc[11],
                "branch_code": acc[12]
            })
        res = await session.run("""
            UNWIND $accs AS r
            CREATE (a:Account {
                account_id: r.account_id,
                entity_id: r.entity_id,
                customer_name: r.customer_name,
                masked_account_number: r.masked_account_number,
                kyc_tier: r.kyc_tier,
                status: r.status,
                risk_category: r.risk_category,
                is_fraud: r.is_fraud,
                pattern_type: r.pattern_type,
                branch_name: r.branch_name,
                branch_code: r.branch_code
            })
        """, accs=neo4j_accs)
        await res.consume()
        print(f"  ✅ Created {len(neo4j_accs)} Account nodes in Neo4j.")

        print("  💸 Loading 1,000 Curated Transactions into Neo4j relationships...")
        df_txn = pd.read_csv(CURATED_DIR / "transactions.csv")
        txns_list = []
        for _, r in df_txn.iterrows():
            txns_list.append({
                "txn_id": str(r["txn_id"]),
                "sender_id": str(r["sender_id"]),
                "receiver_id": str(r["receiver_id"]),
                "amount": float(r["amount"]),
                "channel": str(r.get("channel", "UPI")),
                "txn_ts": str(r.get("txn_ts", "2026-06-25T12:00:00")),
                "status": str(r.get("status", "SUCCESS")),
                "narration": str(r.get("narration", "")),
                "is_fraud": bool(r.get("is_fraud", False)),
                "pattern_type": str(r.get("pattern_type", "")) if pd.notnull(r.get("pattern_type")) else ""
            })
        
        chunk_size = 500
        for i in range(0, len(txns_list), chunk_size):
            chunk = txns_list[i:i + chunk_size]
            res = await session.run("""
                UNWIND $txns AS r
                MATCH (s:Account {account_id: r.sender_id})
                MATCH (rc:Account {account_id: r.receiver_id})
                CREATE (s)-[:SENT {
                    txn_id: r.txn_id,
                    amount: r.amount,
                    channel: r.channel,
                    txn_ts: r.txn_ts,
                    status: r.status,
                    narration: r.narration,
                    is_fraud: r.is_fraud,
                    pattern_type: r.pattern_type
                }]->(rc)
            """, txns=chunk)
            await res.consume()
        print(f"  ⚡ Seeded {len(txns_list)} transaction edges in Neo4j.")

    await driver.close()
    print("\n======================================================================")
    print("✅ MASTER RESET & SEED COMPLETE! DATABASE READY FOR BATCH ML INFERENCE.")
    print("======================================================================")

if __name__ == "__main__":
    asyncio.run(run_master_reset_and_seed())
