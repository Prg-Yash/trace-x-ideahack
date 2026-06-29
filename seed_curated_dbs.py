import os
import sys
import json
import uuid
from datetime import datetime
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
from neo4j import GraphDatabase
from pathlib import Path

NEO4J_URI = "neo4j+s://04872712.databases.neo4j.io"
NEO4J_USER = "04872712"
NEO4J_PASSWORD = "9I9jK8AdYyPLIvtA7Qvkd5oeCs3_fHLphlp3i7P-tDY"
DATABASE_URL = "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

CURATED_DIR = Path("apps/ai-ml/data_curated")

def df_to_pg(conn, df, table_name):
    # Clean df columns and types
    df = df.where(pd.notnull(df), None)
    cols = list(df.columns)
    
    col_defs = []
    for col in cols:
        dtype = df[col].dtype
        if "int" in str(dtype):
            sql_type = "BIGINT"
        elif "float" in str(dtype):
            sql_type = "NUMERIC"
        elif "bool" in str(dtype):
            sql_type = "BOOLEAN"
        else:
            sql_type = "TEXT"
        col_defs.append(f'"{col}" {sql_type}')
        
    create_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(col_defs)});'
    
    with conn.cursor() as cur:
        cur.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE;')
        cur.execute(create_sql)
        
        if len(df) > 0:
            quoted_cols = ", ".join([f'"{c}"' for c in cols])
            insert_sql = f'INSERT INTO "{table_name}" ({quoted_cols}) VALUES %s;'
            tuples = [tuple(x) for x in df.to_numpy()]
            execute_values(cur, insert_sql, tuples, page_size=1000)
    conn.commit()

def seed():
    print("=== Starting Curated Database Seeding Pipeline (psycopg2 engine) ===")
    
    # 1. Connect to NeonDB
    print("Connecting to NeonDB PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    
    csvs = {
        "entities": CURATED_DIR / "entities.csv",
        "accounts": CURATED_DIR / "accounts.csv",
        "account_stats": CURATED_DIR / "account_stats.csv",
        "transactions": CURATED_DIR / "transactions.csv"
    }
    
    for table, path in csvs.items():
        print(f"  Loading {path} into SQL table '{table}'...")
        df = pd.read_csv(path)
        df_to_pg(conn, df, table)
        
    print("Generating ML features for curated accounts...")
    sys.path.append(os.path.abspath('apps/ai-ml'))
    from scripts.feature_engineering import build_training_features
    X_train, _ = build_training_features(CURATED_DIR)
    
    df_ent = pd.read_csv(CURATED_DIR / "entities.csv")
    df_acc = pd.read_csv(CURATED_DIR / "accounts.csv")
    df_stats = pd.read_csv(CURATED_DIR / "account_stats.csv")
    X_orig = df_stats.merge(df_acc, on="account_id").merge(df_ent, on="entity_id")
    X_train['account_id'] = X_orig['account_id']
    
    print("  Saving ML features to 'account_ml_features'...")
    df_to_pg(conn, X_train, "account_ml_features")
    
    print("Creating case management & notes tables...")
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS alerts CASCADE;")
        cur.execute("DROP TABLE IF EXISTS alert_evidence CASCADE;")
        cur.execute("DROP TABLE IF EXISTS investigation_notes CASCADE;")
        
        cur.execute("""
            CREATE TABLE alerts (
                alert_id VARCHAR(50) PRIMARY KEY,
                account_id VARCHAR(50) NOT NULL,
                pattern_type VARCHAR(50) NOT NULL,
                fraud_probability DECIMAL(5,4) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP NOT NULL
            );
        """)
        cur.execute("""
            CREATE TABLE alert_evidence (
                alert_id VARCHAR(50) PRIMARY KEY,
                shap_values JSONB,
                triggering_txns JSONB,
                snapshot_data JSONB
            );
        """)
        cur.execute("""
            CREATE TABLE investigation_notes (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(50) NOT NULL,
                author VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL
            );
        """)
    conn.commit()
        
    print("Populating alerts & audit notes for curated fraud accounts...")
    alerts_data = []
    notes_data = []
    
    # 1..75 are our fraud accounts
    for i in range(1, 76):
        acc_id = f"ACC_{i:05d}"
        alert_id = f"ALT_{datetime.now().strftime('%Y%m')}_{i:03d}"
        
        if i <= 15:
            pat = "LAYERING"
            prob = 0.9850
            sev = "CRITICAL"
            note = "Automated AI Detection: High velocity multi-hop transfer detected moving funds across SWIFT and Crypto rails to off-ramp accounts."
        elif i <= 30:
            pat = "SMURFING"
            prob = 0.8920
            sev = "HIGH"
            note = "Automated AI Detection: 8 rapid structuring deposits received via UPI/IMPS intentionally kept below INR 50k statutory reporting threshold."
        elif i <= 45:
            pat = "ROUND_TRIP"
            prob = 0.9640
            sev = "CRITICAL"
            note = "Automated AI Detection: Circular transaction loop identified returning funds to originator account minus intermediary transaction fees."
        elif i <= 60:
            pat = "KYC_MISMATCH"
            prob = 0.8410
            sev = "HIGH"
            note = "Automated AI Detection: Annual transfer volume exceeds entity's declared annual tax income by over 20x."
        else:
            pat = "DORMANT"
            prob = 0.7850
            sev = "MEDIUM"
            note = "Automated AI Detection: Sudden high-value liquidation transfer initiated via SWIFT after 180 days of complete account dormancy."
            
        alerts_data.append({
            "alert_id": alert_id,
            "account_id": acc_id,
            "pattern_type": pat,
            "fraud_probability": prob,
            "severity": sev,
            "status": "OPEN",
            "created_at": datetime.now()
        })
        
        notes_data.append({
            "account_id": acc_id,
            "author": "FINnet AI Engine",
            "content": note,
            "created_at": datetime.now()
        })
        
    df_alerts = pd.DataFrame(alerts_data)
    df_notes = pd.DataFrame(notes_data)
    df_to_pg(conn, df_alerts, "alerts")
    df_to_pg(conn, df_notes, "investigation_notes")
    conn.close()
    
    # 2. Neo4j Seeding
    print("Connecting to Neo4j Graph Database...")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    with driver.session() as session:
        print("  Wiping old Neo4j graph data...")
        session.run("MATCH (n) DETACH DELETE n")
        session.run("CREATE INDEX IF NOT EXISTS FOR (a:Account) ON (a.account_id)")
        session.run("CREATE INDEX IF NOT EXISTS FOR (al:Alert) ON (al.alert_id)")
        
        print("  Loading curated Account nodes into Neo4j...")
        df_acc = pd.read_csv(CURATED_DIR / "accounts.csv")
        df_stats = pd.read_csv(CURATED_DIR / "account_stats.csv")
        df_ent = pd.read_csv(CURATED_DIR / "entities.csv")
        
        df_full = df_acc.merge(df_stats, on="account_id", how="left").merge(df_ent, on="entity_id", how="left")
        df_full = df_full.where(pd.notnull(df_full), None)
        records = df_full.to_dict("records")
        
        session.run("""
            UNWIND $records AS row
            CREATE (a:Account {
                account_id: row.account_id,
                entity_id: row.entity_id,
                customer_name: row.customer_name,
                branch_name: row.branch_name,
                branch_code: row.branch_code,
                kyc_tier: toInteger(row.kyc_tier),
                status: row.status,
                risk_category: row.risk_category,
                is_fraud: toBoolean(row.is_fraud),
                pattern_type: row.pattern_type
            })
        """, records=records)
        
        print("  Loading curated Transactions (SENT relationships)...")
        df_txn = pd.read_csv(CURATED_DIR / "transactions.csv")
        records_txn = df_txn.to_dict("records")
        chunk_size = 500
        for i in range(0, len(records_txn), chunk_size):
            chunk = records_txn[i:i+chunk_size]
            session.run("""
                UNWIND $chunk AS row
                MATCH (s:Account {account_id: row.sender_id})
                MATCH (r:Account {account_id: row.receiver_id})
                CREATE (s)-[t:SENT {
                    txn_id: row.txn_id,
                    amount: toFloat(row.amount),
                    channel: row.channel,
                    txn_ts: row.txn_ts,
                    status: row.status,
                    narration: row.narration,
                    is_fraud: toBoolean(row.is_fraud),
                    pattern_type: row.pattern_type
                }]->(r)
            """, chunk=chunk)
            
        print("  Creating Alert nodes & linking in Neo4j...")
        alert_records = df_alerts.to_dict("records")
        for row in alert_records:
            if isinstance(row["created_at"], datetime):
                row["created_at"] = row["created_at"].isoformat()
            elif not isinstance(row["created_at"], str):
                row["created_at"] = str(row["created_at"])
            
        session.run("""
            UNWIND $records AS row
            MATCH (a:Account {account_id: row.account_id})
            CREATE (al:Alert {
                alert_id: row.alert_id,
                pattern_type: row.pattern_type,
                fraud_probability: toFloat(row.fraud_probability),
                severity: row.severity,
                status: row.status,
                created_at: row.created_at
            })
            CREATE (a)-[:FLAGGED_IN]->(al)
        """, records=alert_records)
        
    print("=== Curated Seeding Completed Successfully! ===")

if __name__ == "__main__":
    seed()
