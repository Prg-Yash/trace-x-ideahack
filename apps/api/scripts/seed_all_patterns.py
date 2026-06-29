"""
seed_all_patterns.py — Seed ALL 5 Fraud Patterns into Neo4j
=============================================================
Runs each detector independently and writes Alert nodes for:
  - kyc_mismatch  (XGBoost)
  - dormant       (Isolation Forest)
  - smurfing      (XGBoost structuring)
  - layering      (graph traversal + XGBoost)
  - round_trip    (cycle detection)

Uses realistic per-pattern account selection from Postgres.
"""
import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT_DIR / "apps" / "api"))
sys.path.insert(0, str(ROOT_DIR / "apps" / "ai-ml"))

import psycopg2
from psycopg2.extras import RealDictCursor
from fraud_detector import (
    detect_smurfing, detect_dormant, detect_kyc_mismatch,
    detect_layering, detect_roundtrip, _neo4j_session, DATABASE_URL
)

# ── Config ──────────────────────────────────────────────────────────────────────
PATTERN_LIMITS = {
    "kyc_mismatch":  60,   # KYC/profile mismatch
    "dormant":       30,   # Dormant activation
    "smurfing":      30,   # Structuring / smurfing
    "layering":      30,   # Rapid layering through chain
    "round_trip":    20,   # Circular fund flow
}

# ── Helpers ──────────────────────────────────────────────────────────────────────
def fetch_candidates(pattern: str, limit: int):
    """Pull candidate account_ids from Postgres for each pattern."""
    base_where = "a.is_fraud = TRUE"

    # Pattern-specific filters for relevant account selection
    # account_stats cols: txn_count_7d, volume_7d, txn_count_30d, volume_30d,
    #   total_count_180d, total_volume_180d, unique_counterparties_30d,
    #   last_active_ts, avg_monthly_count, avg_monthly_volume, dormancy_days
    # account_ml_features has income_utilization_ratio_30d etc.
    extra = {
        "kyc_mismatch": """
            AND f.income_utilization_ratio_30d > 0.5
        """,
        "dormant": """
            AND COALESCE(s.dormancy_days, 0) >= 90
            AND COALESCE(s.txn_count_30d, 0) > 0
        """,
        "smurfing": """
            AND COALESCE(s.txn_count_30d, 0) >= 10
            AND COALESCE(s.volume_30d, 0) / NULLIF(s.txn_count_30d, 0) < 50000
        """,
        "layering":   "",   # rely on graph structure
        "round_trip": "",   # rely on graph cycles
    }

    join = {
        "kyc_mismatch": "LEFT JOIN account_ml_features f ON a.account_id = f.account_id",
    }.get(pattern, "")

    sql = f"""
        SELECT a.account_id
        FROM accounts a
        LEFT JOIN account_stats s ON a.account_id = s.account_id
        {join}
        WHERE {base_where} {extra.get(pattern, '')}
        ORDER BY RANDOM()
        LIMIT {limit * 3}
    """
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql)
            return [row["account_id"] for row in cur.fetchall()]


async def upsert_alert(account_id: str, pattern: str, fraud_prob: float,
                       tier: str, total_amount: float, extra_props: dict = None):
    """Write / update an Alert node in Neo4j and link it to the Account."""
    extra_props = extra_props or {}
    alert_id = f"ALT-{account_id}-{pattern.upper()}"

    cypher = """
        MATCH (a:Account {account_id: $account_id})
        MERGE (al:Alert {alert_id: $alert_id})
        SET al.pattern     = $pattern,
            al.fraud_prob  = $fraud_prob,
            al.tier        = $tier,
            al.total_amount = $total_amount,
            al.status      = 'OPEN',
            al.created_at  = $created_at
        SET al += $extra
        MERGE (a)-[:FLAGGED_IN]->(al)
        RETURN al.alert_id AS id
    """
    async with _neo4j_session() as session:
        result = await session.run(
            cypher,
            account_id=account_id,
            alert_id=alert_id,
            pattern=pattern,
            fraud_prob=round(fraud_prob, 4),
            tier=tier,
            total_amount=float(total_amount),
            created_at=datetime.utcnow().isoformat(),
            extra=extra_props,
        )
        return await result.single()


def get_tier(prob: float) -> str:
    if prob >= 0.85: return "CRITICAL"
    if prob >= 0.65: return "HIGH"
    if prob >= 0.45: return "MEDIUM"
    return "LOW"


# ── Per-Pattern runners ──────────────────────────────────────────────────────────

async def run_kyc_mismatch(candidates: list, target: int) -> int:
    count = 0
    for acc in candidates:
        if count >= target: break
        try:
            result = await detect_kyc_mismatch(acc)
            if result.get("detected"):
                prob = float(result.get("confidence", 0.7))
                await upsert_alert(acc, "kyc_mismatch", prob, get_tier(prob),
                                   float(result.get("actual_monthly", 0) * 12))
                count += 1
                print(f"  [KYC] {acc} → {prob:.3f}")
        except Exception as e:
            print(f"  [KYC] {acc} ERROR: {e}")
    return count


async def run_dormant(candidates: list, target: int) -> int:
    count = 0
    for acc in candidates:
        if count >= target: break
        try:
            result = await detect_dormant(acc)
            if result.get("detected"):
                prob = float(result.get("confidence", 0.85))
                await upsert_alert(acc, "dormant", prob, get_tier(prob), 0.0,
                                   {"dormancy_days": result.get("dormancy_days", 90)})
                count += 1
                print(f"  [DORMANT] {acc} → {prob:.3f}")
        except Exception as e:
            print(f"  [DORMANT] {acc} ERROR: {e}")
    return count


async def run_smurfing(candidates: list, target: int) -> int:
    count = 0
    for acc in candidates:
        if count >= target: break
        try:
            result = await detect_smurfing(acc)
            prob = float(result.get("confidence", 0.0))
            # Lower threshold for seeding — smurfing model is conservative
            if prob >= 0.30 or result.get("detected"):
                prob = max(prob, 0.72)  # ensure it shows as significant
                await upsert_alert(acc, "smurfing", prob, get_tier(prob), 0.0)
                count += 1
                print(f"  [SMURFING] {acc} → {prob:.3f}")
        except Exception as e:
            print(f"  [SMURFING] {acc} ERROR: {e}")
    return count


async def run_layering(candidates: list, target: int) -> int:
    count = 0
    for acc in candidates:
        if count >= target: break
        try:
            result = await detect_layering(acc)
            if result.get("detected"):
                prob = float(result.get("confidence", 0.92))
                chain = result.get("chain", [])
                amounts = result.get("amounts", [])
                total = sum(amounts) if amounts else 0.0
                extra = {
                    "chain": chain,
                    "amounts": amounts,
                    "hops": len(chain) - 1,
                }
                await upsert_alert(acc, "layering", prob, get_tier(prob), total, extra)
                count += 1
                print(f"  [LAYERING] {acc} → {prob:.3f}, hops={len(chain)-1}, chain={chain}")
        except Exception as e:
            print(f"  [LAYERING] {acc} ERROR: {e}")
    return count


async def run_roundtrip(candidates: list, target: int) -> int:
    count = 0
    for acc in candidates:
        if count >= target: break
        try:
            result = await detect_roundtrip(acc)
            if result.get("detected"):
                prob = float(result.get("confidence", 0.89))
                chain = result.get("chain", [])
                amounts = result.get("amounts", [])
                total = sum(amounts) if amounts else 0.0
                extra = {
                    "loop": chain,
                    "amounts": amounts,
                    "hops": len(chain) - 1,
                }
                await upsert_alert(acc, "round_trip", prob, get_tier(prob), total, extra)
                count += 1
                print(f"  [ROUND_TRIP] {acc} → {prob:.3f}, hops={len(chain)-1}")
        except Exception as e:
            print(f"  [ROUND_TRIP] {acc} ERROR: {e}")
    return count


# ── Main ─────────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 60)
    print("  TRACE-X: Full 5-Pattern Alert Seeder")
    print("=" * 60)

    results = {}

    for pattern, limit in PATTERN_LIMITS.items():
        print(f"\n>>> Pattern: {pattern.upper()} (target: {limit})")
        candidates = await asyncio.to_thread(fetch_candidates, pattern, limit)
        print(f"    Candidates fetched: {len(candidates)}")

        if pattern == "kyc_mismatch":
            n = await run_kyc_mismatch(candidates, limit)
        elif pattern == "dormant":
            n = await run_dormant(candidates, limit)
        elif pattern == "smurfing":
            n = await run_smurfing(candidates, limit)
        elif pattern == "layering":
            n = await run_layering(candidates, limit)
        elif pattern == "round_trip":
            n = await run_roundtrip(candidates, limit)
        else:
            n = 0

        results[pattern] = n
        print(f"    Seeded: {n} alerts")

    print("\n" + "=" * 60)
    print("  Summary:")
    total = 0
    for pat, n in results.items():
        print(f"    {pat:<20} {n:>4} alerts")
        total += n
    print(f"    {'TOTAL':<20} {total:>4} alerts")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
