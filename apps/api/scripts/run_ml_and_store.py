"""
run_ml_and_store.py
===================
Batch ML processing pipeline:
1. Fetch all fraud accounts from Postgres
2. Run detect_layering + detect_roundtrip on each  
3. Store ML results (chain, amounts, confidence, model, timestamps) back into Neo4j Alert nodes
4. Also update Postgres alerts table with fraud_probability

Run this ONCE after seeding, and again after any new data ingestion.
This is the "pre-compute" step so the frontend always reads from DB, never from hardcoded values.
"""

import asyncio
import sys
import json
from pathlib import Path
from datetime import datetime

# Path setup
SCRIPTS_DIR = Path(__file__).resolve().parent
API_DIR     = SCRIPTS_DIR.parent
ROOT        = API_DIR.parent.parent
AI_ML       = ROOT / "apps" / "ai-ml"
sys.path.insert(0, str(AI_ML))
sys.path.insert(0, str(API_DIR))

from fraud_detector import (
    detect_layering,
    detect_roundtrip,
    detect_smurfing,
    detect_kyc_mismatch,
    detect_dormant,
    score_account,
    DATABASE_URL,
    _neo4j_session,
    _coerce,
)

import psycopg2
from psycopg2.extras import RealDictCursor


# ─────────────────────────────────────────────────────────────────────────────
# Fetch fraud accounts from Postgres
# ─────────────────────────────────────────────────────────────────────────────
def get_fraud_accounts():
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT a.account_id, a.pattern_type
                FROM accounts a
                WHERE a.is_fraud = TRUE
                ORDER BY a.account_id
            """)
            return cur.fetchall()


# ─────────────────────────────────────────────────────────────────────────────
# Update Postgres alerts table with real ML probability
# ─────────────────────────────────────────────────────────────────────────────
def update_postgres_alert(account_id: str, fraud_probability: float, pattern_type: str):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE alerts
                SET fraud_probability = %s
                WHERE account_id = %s AND pattern_type = %s
            """, (round(fraud_probability, 6), account_id, pattern_type.upper()))
            conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Store ML result back into Neo4j Alert node
# ─────────────────────────────────────────────────────────────────────────────
async def store_ml_result_in_neo4j(account_id: str, result: dict, pattern_type: str):
    """
    Upserts the ML detection result onto the existing Alert node.
    Adds: chain, amounts, timestamps, confidence, ml_model, ml_processed_at
    """
    chain      = result.get("chain", [])
    amounts    = result.get("amounts", [])
    timestamps = result.get("timestamps", [])
    confidence = result.get("confidence", 0.0)
    ml_model   = result.get("model", "unknown")

    query = """
        MATCH (a:Account {account_id: $acc_id})-[:FLAGGED_IN]->(al:Alert)
        WHERE toUpper(coalesce(al.pattern_type, al.pattern, '')) = toUpper($pattern)
        SET al.chain            = $chain,
            al.amounts          = $amounts,
            al.timestamps       = $timestamps,
            al.fraud_probability = $confidence,
            al.fraud_prob        = $confidence,
            al.ml_model         = $ml_model,
            al.ml_processed_at  = $processed_at,
            al.ml_confidence    = $confidence
        RETURN al.alert_id AS alert_id
    """
    try:
        async with _neo4j_session() as session:
            result_cursor = await session.run(
                query,
                acc_id      = account_id,
                pattern     = pattern_type.upper(),
                chain       = chain,
                amounts     = [float(a) for a in amounts],
                timestamps  = [str(t) for t in timestamps],
                confidence  = float(confidence),
                ml_model    = ml_model,
                processed_at = datetime.utcnow().isoformat(),
            )
            rec = await result_cursor.single()
            return rec["alert_id"] if rec else None
    except Exception as e:
        print(f"  [ERROR] Neo4j store failed for {account_id}: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Process a single account
# ─────────────────────────────────────────────────────────────────────────────
async def process_account(account_id: str, pattern_type: str, idx: int, total: int):
    pattern_upper = pattern_type.upper()
    print(f"[{idx}/{total}] {account_id} | {pattern_upper}")

    result = None

    if pattern_upper == "LAYERING":
        result = await detect_layering(account_id, recompute=True)
    elif pattern_upper in ("ROUND_TRIP", "ROUNDTRIP", "ROUND-TRIP"):
        result = await detect_roundtrip(account_id, recompute=True)
    elif pattern_upper in ("SMURFING", "STRUCTURING"):
        result = await detect_smurfing(account_id)
    elif pattern_upper in ("KYC_MISMATCH", "KYC"):
        result = await detect_kyc_mismatch(account_id)
    elif pattern_upper in ("DORMANT", "DORMANT_ACTIVATION"):
        result = await detect_dormant(account_id)
    else:
        # For unknown patterns, try layering first then roundtrip
        result = await detect_layering(account_id, recompute=True)
        if not result.get("detected"):
            result = await detect_roundtrip(account_id, recompute=True)

    if result and result.get("detected"):
        confidence = result.get("confidence", 0.0)
        ml_model   = result.get("model", "unknown")
        print(f"  [OK] DETECTED | conf={confidence:.4f} | model={ml_model}")

        # Store into Neo4j
        alert_id = await store_ml_result_in_neo4j(account_id, result, pattern_upper)
        print(f"  [OK] Stored in Neo4j: alert_id={alert_id}")

        # Update Postgres
        try:
            update_postgres_alert(account_id, confidence, pattern_upper)
            print(f"  [OK] Updated Postgres fraud_probability={confidence:.4f}")
        except Exception as e:
            print(f"  [WARN] Postgres update failed: {e}")

        return {"account_id": account_id, "status": "detected", "confidence": confidence, "model": ml_model}
    else:
        error = result.get("error", "") if result else "no result"
        print(f"  [X] Not detected | {error}")
        return {"account_id": account_id, "status": "not_detected", "confidence": 0.0}


# ─────────────────────────────────────────────────────────────────────────────
# Main batch runner
# ─────────────────────────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("TRACE-X ML Batch Processor")
    print("Processing all fraud accounts and storing results in DB")
    print("=" * 60)

    # Warm up Neo4j driver connection so ASYNC_DRIVER is populated
    try:
        async with _neo4j_session() as session:
            await session.run("RETURN 1")
        print("[OK] Neo4j connection initialized")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Neo4j: {e}")
        return

    accounts = get_fraud_accounts()
    total    = len(accounts)
    print(f"\nFound {total} fraud accounts to process\n")

    results  = []
    detected = 0

    for idx, row in enumerate(accounts, 1):
        acc_id   = row["account_id"]
        pattern  = row["pattern_type"] or "LAYERING"
        try:
            res = await process_account(acc_id, pattern, idx, total)
            results.append(res)
            if res["status"] == "detected":
                detected += 1
        except Exception as e:
            print(f"  [ERROR] {acc_id}: {e}")
            results.append({"account_id": acc_id, "status": "error", "error": str(e)})

    print("\n" + "=" * 60)
    print(f"DONE: {detected}/{total} accounts detected and stored")
    print("=" * 60)

    # Save summary
    summary_path = Path(__file__).parent / "ml_batch_results.json"
    with open(summary_path, "w") as f:
        json.dump({
            "run_at": datetime.utcnow().isoformat(),
            "total": total,
            "detected": detected,
            "results": results,
        }, f, indent=2)
    print(f"\nSummary saved to: {summary_path}")


if __name__ == "__main__":
    asyncio.run(main())
