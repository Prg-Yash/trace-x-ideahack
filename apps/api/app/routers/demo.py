import sys
import random
import asyncio
import json
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any
from contextlib import contextmanager

from fastapi import APIRouter, BackgroundTasks, HTTPException
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

# Path resolution for fraud_detector
ROOT_DIR = Path(__file__).resolve().parents[4]
AI_ML_DIR = ROOT_DIR / "apps" / "ai-ml"
if str(AI_ML_DIR) not in sys.path:
    sys.path.append(str(AI_ML_DIR))

# Fraud detector pipeline imports
from fraud_detector import (
    score_account, 
    _neo4j_session, 
    DATABASE_URL
)
from app.core.websockets import manager

pg_pool = ThreadedConnectionPool(1, 20, dsn=DATABASE_URL)

@contextmanager
def get_pg_connection():
    conn = pg_pool.getconn()
    try:
        yield conn
    finally:
        pg_pool.putconn(conn)

router = APIRouter(prefix="/demo", tags=["demo"])

VALID_PATTERNS = {"LAYERING", "SMURFING", "ROUND_TRIP", "DORMANT", "KYC_MISMATCH"}

def make_serialisable(obj):
    """Recursively convert non-JSON-serialisable types."""
    if isinstance(obj, dict):
        return {k: make_serialisable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serialisable(v) for v in obj]
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if hasattr(obj, 'isoformat'):   # datetime
        return obj.isoformat()
    return obj

def get_clean_account() -> Dict[str, Any]:
    """Queries Postgres for a random clean account to use as counterparty or base."""
    with get_pg_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT a.account_id, a.entity_id, COALESCE(s.volume_30d, 150000.0) as vol
                FROM accounts a
                LEFT JOIN account_stats s ON a.account_id = s.account_id
                WHERE a.is_fraud = false
                ORDER BY RANDOM()
                LIMIT 1
            """)
            row = cur.fetchone()
            if not row:
                raise Exception("No clean accounts found in Postgres!")
            return dict(row)

async def inject_demo_pattern(pattern: str, demo_tag: str) -> List[str]:
    """
    Inserts live transaction topologies directly into Neo4j and Postgres.
    """
    account_ids = []
    
    root_acc = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
    ent_id = f"ENT_DEMO_{random.randint(1000, 9999)}"
    txns = []

    if pattern == "LAYERING":
        hop1 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        hop2 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        hop3 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        account_ids = [root_acc, hop1, hop2, hop3]
        txns = [
            (root_acc, hop1, 100000.0),
            (hop1, hop2, 95000.0),
            (hop2, hop3, 90000.0)
        ]
    elif pattern == "SMURFING":
        smurf1 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        smurf2 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        smurf3 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        account_ids = [root_acc, smurf1, smurf2, smurf3]
        txns = [
            (smurf1, root_acc, 9500.0),
            (smurf2, root_acc, 9800.0),
            (smurf3, root_acc, 9200.0)
        ]
    elif pattern == "ROUND_TRIP":
        hop1 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        hop2 = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        account_ids = [root_acc, hop1, hop2]
        txns = [
            (root_acc, hop1, 50000.0),
            (hop1, hop2, 49000.0),
            (hop2, root_acc, 48000.0)
        ]
    elif pattern == "DORMANT":
        account_ids = [root_acc]
        sender = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        account_ids.append(sender)
        txns = [(sender, root_acc, 500000.0)]
    elif pattern == "KYC_MISMATCH":
        account_ids = [root_acc]
        sender = f"ACC_DEMO_{pattern}_{random.randint(100000, 999999)}"
        account_ids.append(sender)
        txns = [(sender, root_acc, 1500000.0)]
    else:
        raise NotImplementedError(f"Pattern {pattern} demo injection not yet implemented.")

    # Postgres Insert (Accounts)
    def pg_insert():
        with get_pg_connection() as conn:
            with conn.cursor() as cur:
                for acc in account_ids:
                    cur.execute("""
                        INSERT INTO accounts (account_id, entity_id, kyc_tier, status, risk_category, is_fraud, pattern_type)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (acc, ent_id, 3, 'ACTIVE', 'HIGH', True, pattern))
                    
                    cur.execute("""
                        INSERT INTO account_stats (account_id, volume_30d, txn_count_30d, avg_txn_amount)
                        VALUES (%s, 250000.0, 45, 5555.55)
                    """, (acc,))
                    
                for i, (sender, receiver, amount) in enumerate(txns):
                    txn_id = f"TXN_DEMO_{demo_tag}_{i}"
                    cur.execute("""
                        INSERT INTO transactions (txn_id, sender_id, receiver_id, amount, channel, txn_ts, status, narration)
                        VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s)
                    """, (txn_id, sender, receiver, amount, 'NEFT', 'SUCCESS', f'Demo {pattern} Transfer'))
                    
                conn.commit()
    
    await asyncio.to_thread(pg_insert)
    
    # Neo4j Insert (Accounts and Transactions)
    async with _neo4j_session() as session:
        for acc in account_ids:
            await session.run("""
                MERGE (a:Account {account_id: $acc})
                SET a.is_demo = true,
                    a.demo_tag = $tag,
                    a.is_fraud = true,
                    a.pattern_type = $pattern
            """, acc=acc, tag=demo_tag, pattern=pattern)
            
        for i, (sender, receiver, amount) in enumerate(txns):
            await session.run("""
                MATCH (s:Account {account_id: $sender})
                MATCH (r:Account {account_id: $receiver})
                CREATE (s)-[t:SENT {
                    txn_id: $txn_id,
                    amount: toFloat($amount),
                    txn_ts: datetime(),
                    is_demo: true,
                    demo_tag: $tag
                }]->(r)
            """, sender=sender, receiver=receiver, amount=amount, txn_id=f"TXN_DEMO_{demo_tag}_{i}", tag=demo_tag)

        
    return account_ids

async def run_injection_pipeline(pattern: str, demo_tag: str):
    try:
        # Stage 1: Ingest Live Topology
        await manager.broadcast("STAGE_UPDATE", {"stage": 1, "message": f"Writing {pattern} topology to graph databases..."})
        account_ids = await inject_demo_pattern(pattern, demo_tag)
        root_account_id = account_ids[0]

        await asyncio.sleep(1.5) # Fake delay for effect

        # Stage 2: ML Inference
        await manager.broadcast("STAGE_UPDATE", {"stage": 2, "message": f"Running ML inference on root account {root_account_id}..."})
        result = await score_account(root_account_id, deep_scan=True)
        
        await asyncio.sleep(1.5)

        # Stage 3: XAI & Narratives
        await manager.broadcast("STAGE_UPDATE", {"stage": 3, "message": "Generating SHAP explanation and STR narrative..."})
        
        # Persist the alert to Postgres and Neo4j, simulating the backend process
        alert_id = result.get('alert_id', f"ALT-{root_account_id}-{pattern}")
        
        def pg_alert_insert():
             with get_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO alerts (alert_id, account_id, pattern_type, fraud_probability, severity, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, 'OPEN', NOW())
                        ON CONFLICT (alert_id) DO NOTHING
                    """, (alert_id, root_account_id, pattern, result['fraud_probability'], result['severity']))
                conn.commit()
        await asyncio.to_thread(pg_alert_insert)
        
        async with _neo4j_session() as session:
            await session.run("""
                MATCH (a:Account {account_id: $acc})
                MERGE (al:Alert {alert_id: $alert_id})
                SET al.pattern = $pattern,
                    al.fraud_prob = toFloat($prob),
                    al.tier = $severity,
                    al.status = 'OPEN',
                    al.created_at = datetime().toString(),
                    al.is_demo = true,
                    al.demo_tag = $tag
                MERGE (a)-[:FLAGGED_IN]->(al)
            """, acc=root_account_id, alert_id=alert_id, pattern=pattern, prob=result['fraud_probability'], severity=result['severity'], tag=demo_tag)

        await asyncio.sleep(1.5)

        # Stage 4: Broadcast Final Alert
        await manager.broadcast("NEW_ALERT", make_serialisable({
            **result,
            "alert_id": alert_id,
            "demo_tag": demo_tag,
            "is_live": True,
            "account_ids": account_ids
        }))

    except Exception as e:
        import traceback
        traceback.print_exc()
        await manager.broadcast("INJECTION_ERROR", {
            "demo_tag": demo_tag,
            "message": f"Pipeline failed: {str(e)}",
            "stage": "unknown"
        })

@router.post("/inject")
async def inject_demo(payload: dict, background_tasks: BackgroundTasks):
    pattern = payload.get("pattern", "").upper()
    if pattern not in VALID_PATTERNS:
        raise HTTPException(status_code=422, detail=f"Invalid pattern. Must be one of {VALID_PATTERNS}")
        
    demo_tag = f"DEMO-{pattern}-{datetime.now(timezone.utc).strftime('%H%M%S')}-{random.randint(100, 999)}"
    
    background_tasks.add_task(run_injection_pipeline, pattern, demo_tag)
    
    return {"status": "started", "demo_tag": demo_tag}

@router.delete("/cleanup")
async def cleanup_demo():
    # 1. Neo4j cleanup
    try:
        async with _neo4j_session() as session:
            # Delete demo Alert nodes and Account nodes (and their relationships via DETACH DELETE)
            await session.run("MATCH (n) WHERE n.is_demo = true DETACH DELETE n")
            
        # 2. Postgres cleanup
        def pg_cleanup():
            with get_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM transactions WHERE txn_id LIKE 'TXN_DEMO_%'")
                    cur.execute("DELETE FROM alerts WHERE account_id LIKE 'ACC_DEMO_%'")
                    cur.execute("DELETE FROM account_stats WHERE account_id LIKE 'ACC_DEMO_%'")
                    cur.execute("DELETE FROM accounts WHERE account_id LIKE 'ACC_DEMO_%'")
                conn.commit()
        await asyncio.to_thread(pg_cleanup)
        
        await manager.broadcast("DEMO_RESET", {})
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

