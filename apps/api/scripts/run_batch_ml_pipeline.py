import asyncio
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Setup path so imports work
ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT_DIR / "apps" / "api"))
sys.path.append(str(ROOT_DIR / "apps" / "ai-ml"))

DATABASE_URL = "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
from fraud_detector import score_account, _neo4j_session

async def persist_alert(account_id: str, score_result: dict, total_amount: float = 0.0):
    """
    Persist an alert based on ML inference into Neo4j and Postgres.
    """
    if not score_result.get("is_flagged"):
        return False

    alert_id = f"ALT-{account_id}"
    pattern_type = ",".join(score_result.get("flagged_for", ["UNKNOWN"]))
    fraud_prob = score_result.get("combined_score", 0.0)
    severity = score_result.get("risk_level", "HIGH")
    status = "OPEN"
    created_at = datetime.utcnow()

    # 1. Persist to Postgres
    try:
        def pg_upsert():
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO alerts (alert_id, account_id, pattern_type, fraud_probability, severity, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (alert_id) DO UPDATE SET
                            pattern_type = EXCLUDED.pattern_type,
                            fraud_probability = EXCLUDED.fraud_probability,
                            severity = EXCLUDED.severity,
                            status = EXCLUDED.status,
                            created_at = EXCLUDED.created_at
                    """, (alert_id, account_id, pattern_type, fraud_prob, severity, status, created_at))
        await asyncio.to_thread(pg_upsert)
    except Exception as e:
        print(f"Error persisting to Postgres for {account_id}: {e}")

    # 2. Persist to Neo4j
    neo4j_query = """
        MATCH (a:Account {account_id: $account_id})
        MERGE (al:Alert {alert_id: $alert_id})
        SET al.pattern = $pattern_type,
            al.fraud_prob = $fraud_prob,
            al.tier = $severity,
            al.total_amount = $total_amount,
            al.status = $status,
            al.created_at = $created_at
        MERGE (a)-[:FLAGGED_IN]->(al)
    """
    try:
        async with _neo4j_session() as session:
            await session.run(
                neo4j_query,
                account_id=account_id,
                alert_id=alert_id,
                pattern_type=pattern_type,
                fraud_prob=fraud_prob,
                severity=severity,
                total_amount=total_amount,
                status=status,
                created_at=created_at.isoformat()
            )
    except Exception as e:
        print(f"Error persisting to Neo4j for {account_id}: {e}")

    return True


async def run_batch_pipeline():
    print("=== Starting Batch ML Inference Pipeline ===")
    
    # 1. Fetch Candidates from Postgres
    print("Fetching candidate accounts from Postgres...")
    candidates = []
    try:
        def fetch_candidates():
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Select 250 high-risk accounts that don't have alerts yet
                    # Order randomly to get a good mix of fraud patterns
                    cur.execute("""
                        SELECT a.account_id, COALESCE(SUM(s.volume_30d), 50000.0) as total_amount
                        FROM accounts a
                        LEFT JOIN account_stats s ON a.account_id = s.account_id
                        WHERE a.is_fraud = TRUE
                          AND NOT EXISTS (
                              SELECT 1 FROM alerts al WHERE al.account_id = a.account_id
                          )
                        GROUP BY a.account_id
                        ORDER BY RANDOM()
                        LIMIT 250
                    """)
                    return cur.fetchall()
        candidates = await asyncio.to_thread(fetch_candidates)
    except Exception as e:
        print(f"Failed to fetch candidates: {e}")
        return

    print(f"Found {len(candidates)} candidate accounts. Starting ML scoring...")
    
    # 2. Run Inference & Persist in Batches
    batch_size = 20
    alerts_generated = 0
    
    for i in range(0, len(candidates), batch_size):
        batch = candidates[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1}/{(len(candidates) + batch_size - 1)//batch_size}...")
        
        # Concurrently score the batch
        score_tasks = [score_account(c['account_id']) for c in batch]
        score_results = await asyncio.gather(*score_tasks, return_exceptions=True)
        
        # Persist results
        persist_tasks = []
        for c, result in zip(batch, score_results):
            if isinstance(result, Exception):
                print(f"Scoring failed for {c['account_id']}: {result}")
                continue
                
            persist_tasks.append(persist_alert(c['account_id'], result, float(c['total_amount'])))
            
        if persist_tasks:
            persist_results = await asyncio.gather(*persist_tasks, return_exceptions=True)
            for res in persist_results:
                if res is True:
                    alerts_generated += 1
                    
    print(f"=== Pipeline Complete! Generated {alerts_generated} new alerts. ===")


if __name__ == "__main__":
    asyncio.run(run_batch_pipeline())
