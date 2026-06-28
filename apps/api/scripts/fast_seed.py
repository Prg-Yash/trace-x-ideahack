"""
fast_seed.py — Instant Seeder for ALL 5 Fraud Patterns in Neo4j and PostgreSQL
==============================================================================
Populates rich, realistic Alert nodes for:
  - LAYERING (CRITICAL)
  - ROUND_TRIP (CRITICAL)
  - SMURFING (HIGH)
  - KYC_MISMATCH (HIGH)
  - DORMANT (MEDIUM)
"""
import asyncio
import sys
import random
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT_DIR / "apps" / "api"))
sys.path.insert(0, str(ROOT_DIR / "apps" / "ai-ml"))

import psycopg2
from psycopg2.extras import RealDictCursor
from fraud_detector import _neo4j_session, DATABASE_URL

# ── Account Fetcher ─────────────────────────────────────────────────────────────
def get_fraud_accounts(limit=300):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT a.account_id, COALESCE(s.volume_30d, 150000.0) as vol
                FROM accounts a
                LEFT JOIN account_stats s ON a.account_id = s.account_id
                WHERE a.is_fraud = TRUE
                ORDER BY RANDOM()
                LIMIT %s
            """, (limit,))
            return [(r["account_id"], float(r["vol"] or 150000.0)) for r in cur.fetchall()]

async def seed_all():
    print("=== Starting Fast 5-Pattern Seeder ===")
    accounts = get_fraud_accounts(250)
    if not accounts:
        print("No fraud accounts found in DB!")
        return

    # Split accounts among the 5 patterns
    # We want ~35 Layering, ~25 Round Trip, ~35 Smurfing, ~50 KYC Mismatch, ~30 Dormant
    buckets = {
        "LAYERING": accounts[0:35],
        "ROUND_TRIP": accounts[35:60],
        "SMURFING": accounts[60:95],
        "KYC_MISMATCH": accounts[95:145],
        "DORMANT": accounts[145:175],
    }

    tiers = {
        "LAYERING": "CRITICAL",
        "ROUND_TRIP": "CRITICAL",
        "SMURFING": "HIGH",
        "KYC_MISMATCH": "HIGH",
        "DORMANT": "MEDIUM",
    }

    probs = {
        "LAYERING": (0.91, 0.99),
        "ROUND_TRIP": (0.88, 0.97),
        "SMURFING": (0.75, 0.89),
        "KYC_MISMATCH": (0.70, 0.88),
        "DORMANT": (0.55, 0.74),
    }

    all_acc_ids = [a[0] for a in accounts]

    total_seeded = 0
    async with _neo4j_session() as session:
        for pat, acc_list in buckets.items():
            tier = tiers[pat]
            p_min, p_max = probs[pat]
            seeded_for_pat = 0

            for acc_id, vol in acc_list:
                prob = round(random.uniform(p_min, p_max), 4)
                alert_id = f"ALT-{acc_id}-{pat}"
                created_at = datetime.utcnow().isoformat()

                extra = {}
                if pat == "LAYERING":
                    # Create realistic 3-4 hop chain
                    hops = random.randint(3, 4)
                    chain = [acc_id] + random.sample(all_acc_ids, hops)
                    amounts = [round(vol / hops * random.uniform(0.8, 1.2), 2) for _ in range(hops)]
                    extra = {"chain": chain, "amounts": amounts, "hops": hops}
                elif pat == "ROUND_TRIP":
                    # Create realistic circular loop
                    hops = random.randint(3, 4)
                    mids = random.sample(all_acc_ids, hops - 1)
                    loop = [acc_id] + mids + [acc_id]
                    amounts = [round(vol / hops * random.uniform(0.9, 1.1), 2) for _ in range(hops)]
                    extra = {"loop": loop, "amounts": amounts, "hops": hops}
                elif pat == "DORMANT":
                    extra = {"dormancy_days": random.randint(95, 210)}

                # Cypher query to upsert alert and relationship
                cypher = """
                    MATCH (a:Account {account_id: $account_id})
                    MERGE (al:Alert {alert_id: $alert_id})
                    SET al.pattern = $pattern,
                        al.fraud_prob = $prob,
                        al.tier = $tier,
                        al.total_amount = $vol,
                        al.status = 'OPEN',
                        al.created_at = $created_at
                    SET al += $extra
                    MERGE (a)-[:FLAGGED_IN]->(al)
                """
                try:
                    await session.run(cypher, account_id=acc_id, alert_id=alert_id, pattern=pat, prob=prob, tier=tier, vol=vol, created_at=created_at, extra=extra)
                    
                    # Also write to Postgres alerts table for consistency
                    def pg_insert():
                        with psycopg2.connect(DATABASE_URL) as conn:
                            with conn.cursor() as cur:
                                cur.execute("""
                                    INSERT INTO alerts (alert_id, account_id, pattern_type, fraud_probability, severity, status, created_at)
                                    VALUES (%s, %s, %s, %s, %s, 'OPEN', NOW())
                                    ON CONFLICT (alert_id) DO UPDATE SET
                                        pattern_type = EXCLUDED.pattern_type,
                                        fraud_probability = EXCLUDED.fraud_probability,
                                        severity = EXCLUDED.severity
                                """, (alert_id, acc_id, pat, prob, tier))
                    await asyncio.to_thread(pg_insert)
                    
                    seeded_for_pat += 1
                    total_seeded += 1
                except Exception as e:
                    print(f"Error seeding {acc_id} for {pat}: {e}")

            print(f"  [{pat}] Seeded {seeded_for_pat} alerts.")

    print(f"=== Fast Seeder Complete! Total Seeded: {total_seeded} ===")

if __name__ == "__main__":
    asyncio.run(seed_all())
