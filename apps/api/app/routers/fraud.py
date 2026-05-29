import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

ROOT_DIR = Path(__file__).resolve().parents[4]
AI_ML_DIR = ROOT_DIR / "apps" / "ai-ml"
if str(AI_ML_DIR) not in sys.path:
    sys.path.append(str(AI_ML_DIR))

from app.db.session import get_db
from fraud_detector import (
    build_alert_candidates,
    build_evidence_package,
    detect_layering,
    explain_dormant,
    explain_smurfing,
    get_account_ids,
    refresh_data,
    score_account,
    upsert_account_record,
    upsert_transaction_record,

router = APIRouter(tags=["fraud"])

DATA_DIR = AI_ML_DIR / "data"
def _driver():
    return get_db()


def _append_csv(path: Path, row: Dict[str, Any]) -> None:
    import pandas as pd

    df = pd.DataFrame([row])
    sender_score = score_account(record["sender_id"])
    receiver_score = score_account(record["receiver_id"])

    sender_account["fraud_score"] = sender_score["combined_score"]
    sender_account["is_fraud"] = sender_score["is_flagged"]
    sender_account["last_scored_ts"] = datetime.utcnow().isoformat()
    receiver_account["fraud_score"] = receiver_score["combined_score"]
    receiver_account["is_fraud"] = receiver_score["is_flagged"]
    sender_account = {
        "account_id": record["sender_id"],
        **sender_updates,
    }
    receiver_account = {
        "account_id": record["receiver_id"],
        **receiver_updates,
    }
            """,
    sender_score = score_account(record["sender_id"])
    receiver_score = score_account(record["receiver_id"])
            account_id=account["account_id"],
    sender_account["fraud_score"] = sender_score["combined_score"]
    sender_account["is_fraud"] = sender_score["is_flagged"]
    sender_account["last_scored_ts"] = datetime.utcnow().isoformat()
    receiver_account["fraud_score"] = receiver_score["combined_score"]
    receiver_account["is_fraud"] = receiver_score["is_flagged"]
    receiver_account["last_scored_ts"] = datetime.utcnow().isoformat()
            props=account,
        )


def _upsert_transaction_in_neo4j(transaction: Dict[str, Any]) -> None:
    driver = _driver()
    with driver.session() as session:
        session.run(
            f"""
            MATCH (sender:Account {{account_id: $sender_id}})
            MATCH (receiver:Account {{account_id: $receiver_id}})
            MERGE (t:Transaction {{txn_id: $txn_id}})
            SET t += $props
            MERGE (sender)-[r:{REL_TYPE} {{txn_id: $txn_id}}]->(receiver)
            SET r.amount = $amount,
                r.channel = $channel,
                r.txn_ts = $txn_ts
            """,
            **transaction,
            props=transaction,
        )


@router.get("/score/{account_id}")
def get_score(account_id: str):
    return score_account(account_id)


@router.get("/alerts")
def get_alerts(limit: int = 50):
    candidates = build_alert_candidates()
    alerts: List[Dict[str, Any]] = []
    for account_id in candidates:
        report = score_account(account_id)
        if report["is_flagged"]:
            alerts.append(
                {
                    "account_id": account_id,
                    "risk_level": report["risk_level"],
                    "flagged_for": report["flagged_for"],
                    "score": report["combined_score"],
                    "detections": report["detections"],
                }
            )

    alerts.sort(key=lambda item: item["score"], reverse=True)
    return {"total": len(alerts), "alerts": alerts[:limit]}


@router.get("/trace/{account_id}")
def get_trace(account_id: str):
    return detect_layering(account_id)


@router.get("/report/{account_id}")
def get_report(account_id: str):
    return build_evidence_package(account_id)


@router.get("/explain/dormant/{account_id}")
def get_dormant_explanation(account_id: str):
    return explain_dormant(account_id)


@router.get("/explain/smurfing/{account_id}")
def get_smurfing_explanation(account_id: str):
    return explain_smurfing(account_id)


@router.get("/explain/{account_id}")
def get_full_explanation(account_id: str):
    return {
        "account_id": account_id,
        "dormant": explain_dormant(account_id),
        "smurfing": explain_smurfing(account_id),
    }


@router.post("/accounts")
def create_account(account: Account):
    record = account.model_dump()
    _upsert_account_in_neo4j(record)
    upsert_account_record(record)
    refresh_data(force=True)
    return {"message": "account created", "account": record}


@router.post("/transactions")
def create_transaction(transaction: Transaction):
    record = transaction.model_dump()
    driver = _driver()
    with driver.session() as session:
        sender = session.run(
            "MATCH (a:Account {account_id: $account_id}) RETURN a.account_id AS id",
            account_id=record["sender_id"],
        ).single()
        receiver = session.run(
            "MATCH (a:Account {account_id: $account_id}) RETURN a.account_id AS id",
            account_id=record["receiver_id"],
        ).single()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="sender or receiver account not found")

    _upsert_transaction_in_neo4j(record)
    upsert_transaction_record(record)

    sender_updates = _recompute_account_metrics(record["sender_id"])
    receiver_updates = _recompute_account_metrics(record["receiver_id"])

    sender_score = score_account(record["sender_id"])
    receiver_score = score_account(record["receiver_id"])

    sender_account = {
        "account_id": record["sender_id"],
        **sender_updates,
        "fraud_score": sender_score["combined_score"],
        "is_fraud": sender_score["is_flagged"],
        "last_scored_ts": datetime.utcnow().isoformat(),
    }
    receiver_account = {
        "account_id": record["receiver_id"],
        **receiver_updates,
        "fraud_score": receiver_score["combined_score"],
        "is_fraud": receiver_score["is_flagged"],
        "last_scored_ts": datetime.utcnow().isoformat(),
    }

    # persist refreshed metrics back to CSV + Neo4j
    upsert_account_record(sender_account)
    upsert_account_record(receiver_account)
    _upsert_account_in_neo4j(sender_account)
    _upsert_account_in_neo4j(receiver_account)

    response = {
        "message": "transaction created",
        "transaction": record,
        "impacted_accounts": [
            {"account_id": record["sender_id"], "score": sender_score},
            {"account_id": record["receiver_id"], "score": receiver_score},
        ],
    }
    if sender_score["is_flagged"] or receiver_score["is_flagged"]:
        response["evidence"] = {
            record["sender_id"]: build_evidence_package(record["sender_id"]),
            record["receiver_id"]: build_evidence_package(record["receiver_id"]),
        }
    return response