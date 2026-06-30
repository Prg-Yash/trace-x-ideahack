import os
import re
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fraud_detector import _run_query, REL_TYPE, _get_driver

class NoteCreate(BaseModel):
    author: str = "FINnet Investigator"
    content: str

router = APIRouter(
    tags=["data"]
)

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL not set in environment")
    try:
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"NeonDB connection failed: {e}")

@router.get("/accounts")
async def get_all_accounts(skip: int = 0, limit: int = 100, branch_code: str | None = None):
    if _get_driver() is None:
        raise HTTPException(status_code=503, detail="Neo4j is not connected")
    
    # 1. Fetch from Neo4j
    neo4j_query = """
        MATCH (a:Account)
        WHERE ($branch_code IS NULL OR a.branch_code = $branch_code)
        OPTIONAL MATCH (a)-[:FLAGGED_IN]->(al:Alert)
        RETURN a.account_id AS account_id, a.entity_id AS entity_id, a.customer_name AS customer_name, a.branch_name AS branch_name, a.branch_code AS branch_code, max(coalesce(al.fraud_probability, al.fraud_prob, 0.0)) AS neo4j_prob
        SKIP $skip LIMIT $limit
    """
    neo4j_records = await _run_query(neo4j_query, skip=skip, limit=limit, branch_code=branch_code)
    if not neo4j_records:
        return []

    account_ids = [rec["account_id"] for rec in neo4j_records if rec.get("account_id")]
    
    if not account_ids:
        return []

    # 2. Fetch rich properties from NeonDB
    pg_query = """
        SELECT 
            a.account_id,
            a.entity_id,
            a.kyc_tier,
            a.status,
            a.risk_category,
            a.is_fraud,
            a.pattern_type,
            a.opened_on,
            a.branch_name,
            a.branch_code,
            s.avg_monthly_volume,
            s.volume_30d,
            s.txn_count_30d,
            e.declared_annual_income,
            e.customer_name,
            e.pan_number,
            e.dob,
            e.address,
            (SELECT MAX(al.fraud_probability) FROM alerts al WHERE al.account_id = a.account_id) AS pg_prob
        FROM accounts a
        LEFT JOIN account_stats s ON a.account_id = s.account_id
        LEFT JOIN entities e ON a.entity_id = e.entity_id
        WHERE a.account_id = ANY(%s)
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(pg_query, (account_ids,))
            pg_records = cur.fetchall()
    finally:
        conn.close()

    # Create a lookup
    pg_lookup = {r["account_id"]: r for r in pg_records}

    # 3. Combine and return
    results = []
    for n_rec in neo4j_records:
        acc_id = n_rec["account_id"]
        pg_rec = pg_lookup.get(acc_id, {})
        
        n_prob = float(n_rec.get("neo4j_prob") or 0.0)
        p_prob = float(pg_rec.get("pg_prob") or 0.0)
        prob = max(n_prob, p_prob)
        is_fraud = pg_rec.get("is_fraud")
        risk_cat = pg_rec.get("risk_category") or "LOW"
        
        if prob > 0.0:
            risk_score = int(round(prob * 100))
        elif is_fraud or risk_cat in ("CRITICAL", "HIGH"):
            risk_score = 92 if risk_cat == "CRITICAL" else 78
        elif risk_cat == "MEDIUM":
            risk_score = 55
        else:
            risk_score = 15

        combined = {
            "account_id": acc_id,
            "entity_id": n_rec["entity_id"],
            "branch_name": pg_rec.get("branch_name") or n_rec.get("branch_name"),
            "branch_code": pg_rec.get("branch_code") or n_rec.get("branch_code"),
            "customer_name": re.sub(r"\s*\(\d+\)$", "", str(pg_rec.get("customer_name") or n_rec.get("customer_name") or "")).strip(),
            "pan_number": pg_rec.get("pan_number"),
            "dob": pg_rec.get("dob"),
            "address": pg_rec.get("address"),
            "kyc_tier": pg_rec.get("kyc_tier"),
            "status": pg_rec.get("status"),
            "risk_category": pg_rec.get("risk_category"),
            "is_fraud": pg_rec.get("is_fraud"),
            "pattern_type": pg_rec.get("pattern_type"),
            "opened_on": pg_rec.get("opened_on"),
            "avg_monthly_volume": pg_rec.get("avg_monthly_volume"),
            "volume_30d": pg_rec.get("volume_30d"),
            "txn_count_30d": pg_rec.get("txn_count_30d"),
            "declared_annual_income": pg_rec.get("declared_annual_income"),
            "risk_score": risk_score
        }
        results.append(combined)

    return results

@router.get("/transactions")
async def get_all_transactions(skip: int = 0, limit: int = 100):
    if _get_driver() is None:
        raise HTTPException(status_code=503, detail="Neo4j is not connected")
    
    neo4j_query = f"""
        MATCH (s:Account)-[t:{REL_TYPE}]->(r:Account)
        RETURN 
            t.txn_id AS txn_id,
            s.account_id AS sender_id,
            r.account_id AS receiver_id
        SKIP $skip LIMIT $limit
    """
    neo4j_records = await _run_query(neo4j_query, skip=skip, limit=limit)
    if not neo4j_records:
        return []

    txn_ids = [rec["txn_id"] for rec in neo4j_records if rec.get("txn_id")]
    
    if not txn_ids:
        return []
    
    pg_query = """
        SELECT *
        FROM transactions
        WHERE txn_id = ANY(%s)
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(pg_query, (txn_ids,))
            pg_records = cur.fetchall()
    finally:
        conn.close()

    pg_lookup = {r["txn_id"]: r for r in pg_records}

    results = []
    for n_rec in neo4j_records:
        t_id = n_rec["txn_id"]
        pg_rec = pg_lookup.get(t_id, {})
        
        combined = {
            "txn_id": t_id,
            "sender_id": n_rec["sender_id"],
            "receiver_id": n_rec["receiver_id"],
            "amount": pg_rec.get("amount"),
            "channel": pg_rec.get("channel"),
            "txn_ts": pg_rec.get("txn_ts"),
            "status": pg_rec.get("status"),
            "narration": pg_rec.get("narration"),
            "is_fraud": pg_rec.get("is_fraud"),
            "pattern_type": pg_rec.get("pattern_type")
        }
        results.append(combined)

    return results

@router.get("/accounts/{account_id}")
async def get_account(account_id: str):
    pg_query = """
        SELECT 
            a.account_id,
            a.entity_id,
            a.kyc_tier,
            a.status,
            a.risk_category,
            a.is_fraud,
            a.pattern_type,
            a.opened_on,
            a.branch_name,
            a.branch_code,
            s.avg_monthly_volume,
            s.volume_30d,
            s.txn_count_30d,
            s.dormancy_days,
            e.declared_annual_income,
            e.entity_type,
            e.kyc_status,
            e.customer_name,
            e.pan_number,
            e.dob,
            e.address,
            (SELECT MAX(al.fraud_probability) FROM alerts al WHERE al.account_id = a.account_id) AS pg_prob
        FROM accounts a
        LEFT JOIN account_stats s ON a.account_id = s.account_id
        LEFT JOIN entities e ON a.entity_id = e.entity_id
        WHERE a.account_id = %s
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(pg_query, (account_id,))
            pg_record = cur.fetchone()
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
    finally:
        conn.close()

    if not pg_record:
        raise HTTPException(status_code=404, detail="Account not found in PostgreSQL")
        
    p_prob = float(pg_record.get("pg_prob") or 0.0)
    is_fraud = pg_record.get("is_fraud")
    risk_cat = pg_record.get("risk_category") or "LOW"
    if p_prob > 0.0:
        pg_record["risk_score"] = int(round(p_prob * 100))
    elif is_fraud or risk_cat in ("CRITICAL", "HIGH"):
        pg_record["risk_score"] = 92 if risk_cat == "CRITICAL" else 78
    elif risk_cat == "MEDIUM":
        pg_record["risk_score"] = 55
    else:
        pg_record["risk_score"] = 15

    return pg_record

@router.get("/transactions/{txn_id}")
async def get_transaction(txn_id: str):
    pg_query = """
        SELECT *
        FROM transactions
        WHERE txn_id = %s
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(pg_query, (txn_id,))
            pg_record = cur.fetchone()
    finally:
        conn.close()

    if not pg_record:
        raise HTTPException(status_code=404, detail="Transaction not found in PostgreSQL")
        
    return pg_record

@router.get("/accounts/{account_id}/notes")
async def get_account_notes(account_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, account_id, author, content, created_at FROM investigation_notes WHERE account_id = %s ORDER BY created_at DESC", (account_id,))
            return cur.fetchall()
    finally:
        conn.close()

@router.post("/accounts/{account_id}/notes")
async def add_account_note(account_id: str, note: NoteCreate):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO investigation_notes (account_id, author, content, created_at)
                VALUES (%s, %s, %s, NOW())
                RETURNING id, account_id, author, content, created_at
            """, (account_id, note.author, note.content))
            new_note = cur.fetchone()
        conn.commit()
        return new_note
    finally:
        conn.close()
