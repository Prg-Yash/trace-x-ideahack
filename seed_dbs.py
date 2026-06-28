import os
import pandas as pd
from sqlalchemy import create_engine
from neo4j import GraphDatabase

NEO4J_URI="neo4j+s://04872712.databases.neo4j.io"
NEO4J_USER="04872712"
NEO4J_PASSWORD="9I9jK8AdYyPLIvtA7Qvkd5oeCs3_fHLphlp3i7P-tDY"
DATABASE_URL="postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 1. NeonDB
print("Connecting to NeonDB...")
engine = create_engine(DATABASE_URL)

csvs = {
    "accounts": "apps/ai-ml/data/accounts.csv",
    "account_stats": "apps/ai-ml/data/account_stats.csv",
    "entities": "apps/ai-ml/data/entities.csv",
    "transactions": "apps/ai-ml/data/neo4j/transactions.csv"
}

from sqlalchemy import text
for table, path in csvs.items():
    print(f"Loading {path} into {table}...")
    df = pd.read_csv(path)
    with engine.connect() as conn:
        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        conn.commit()
    if 'txn_ts' in df.columns:
        df['txn_ts'] = pd.to_datetime(df['txn_ts'], format='mixed')
    df.to_sql(table, engine, if_exists="replace", index=False)

# Generate ML features and store in Postgres (Polyglot approach)
print("Generating ML features and storing in Postgres...")
import sys
sys.path.append(os.path.abspath('apps/ai-ml'))
from scripts.feature_engineering import build_training_features, DATA_DIR

X_train, _ = build_training_features(DATA_DIR)
df_ent = pd.read_csv(f"{DATA_DIR}/entities.csv")
df_acc = pd.read_csv(f"{DATA_DIR}/accounts.csv")
df_stats = pd.read_csv(f"{DATA_DIR}/account_stats.csv")
X_orig = df_stats.merge(df_acc, on="account_id").merge(df_ent, on="entity_id")
X_train['account_id'] = X_orig['account_id']

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS account_ml_features CASCADE"))
    conn.commit()
X_train.to_sql("account_ml_features", engine, if_exists="replace", index=False)

# Create missing Case Management tables (alerts, alert_evidence)
print("Creating Case Management tables...")
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS alerts CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS alert_evidence CASCADE"))
    conn.execute(text("""
        CREATE TABLE alerts (
            alert_id VARCHAR(50) PRIMARY KEY,
            account_id VARCHAR(50) NOT NULL,
            pattern_type VARCHAR(50) NOT NULL,
            fraud_probability DECIMAL(5,4) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP NOT NULL
        )
    """))
    conn.execute(text("""
        CREATE TABLE alert_evidence (
            alert_id VARCHAR(50) PRIMARY KEY,
            shap_values JSONB,
            triggering_txns JSONB,
            snapshot_data JSONB
        )
    """))
    conn.commit()

# 2. Neo4j
print("Connecting to Neo4j...")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def load_neo4j():
    with driver.session() as session:
        print("Clearing Neo4j...")
        session.run("MATCH (n) DETACH DELETE n")
        
        print("Creating Indexes...")
        session.run("CREATE INDEX IF NOT EXISTS FOR (a:Account) ON (a.account_id)")
        
        print("Loading Neo4j Accounts...")
        df_acc = pd.read_csv("apps/ai-ml/data/accounts.csv")
        df_stats = pd.read_csv("apps/ai-ml/data/account_stats.csv")
        df_acc = df_acc.merge(df_stats, on="account_id", how="left")
        df_acc = df_acc.where(pd.notnull(df_acc), None)
        records = df_acc.to_dict("records")
        
        chunk_size = 5000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i+chunk_size]
            session.run("""
                UNWIND $chunk AS row
                CREATE (a:Account {
                    account_id: row.account_id,
                    entity_id: row.entity_id,
                    kyc_tier: toInteger(row.kyc_tier),
                    status: row.status,
                    risk_category: row.risk_category,
                    is_fraud: toBoolean(row.is_fraud),
                    pattern_type: row.pattern_type
                })
            """, chunk=chunk)
        
        print("Loading Neo4j Transactions...")
        df_txn = pd.read_csv("apps/ai-ml/data/neo4j/transactions.csv")
        records_txn = df_txn.to_dict("records")
        
        for i in range(0, len(records_txn), chunk_size):
            print(f"  Chunk {i}/{len(records_txn)}")
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

load_neo4j()
print("Done!")
