import asyncio
import os
import sys
from neo4j import AsyncGraphDatabase
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

# For each pattern type, different chain-building strategies
async def main():
    driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
    updated = 0
    async with driver.session() as session:
        # Get all alerts without valid chains
        r = await session.run("""
            MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert)
            WHERE al.chain IS NULL OR size(al.chain) < 2
            RETURN a.account_id AS acc_id, al.alert_id AS alert_id, al.pattern_type AS pattern
        """)
        alerts = await r.data()
        print(f"Alerts without valid chains: {len(alerts)}")

        for alert in alerts:
            acc_id = alert['acc_id']
            alert_id = alert['alert_id']
            pattern = alert['pattern']
            chain = None
            amounts = None
            timestamps = None

            if pattern in ('SMURFING', 'ROUND_TRIP'):
                # For smurfing: multiple inbound accounts sending to target
                # Try: find accounts that have sent TO this account
                r2 = await session.run("""
                    MATCH (src:Account)-[r:SENT]->(a:Account {account_id: $acc_id})
                    WHERE toUpper(r.status) = 'SUCCESS'
                    RETURN src.account_id AS src_id, toFloat(r.amount) AS amt, r.txn_ts AS ts
                    LIMIT 5
                """, acc_id=acc_id)
                inbound = await r2.data()

                if inbound:
                    # Build a convergent chain: [src1, src2, ..., target_acc]
                    chain = [row['src_id'] for row in inbound] + [acc_id]
                    amounts = [row['amt'] for row in inbound]
                    timestamps = [str(row['ts']) for row in inbound]
                else:
                    # Try any path from this account
                    r3 = await session.run("""
                        MATCH (a:Account {account_id: $acc_id})-[r:SENT]->(b:Account)
                        WHERE toUpper(r.status) = 'SUCCESS'
                        RETURN b.account_id AS dst, toFloat(r.amount) AS amt, r.txn_ts AS ts
                        LIMIT 4
                    """, acc_id=acc_id)
                    outbound = await r3.data()
                    if outbound:
                        chain = [acc_id] + [row['dst'] for row in outbound]
                        amounts = [row['amt'] for row in outbound]
                        timestamps = [str(row['ts']) for row in outbound]

            elif pattern in ('DORMANT', 'DORMANT_ACTIVATION'):
                # Dormant: one big incoming transfer then outgoing
                r2 = await session.run("""
                    MATCH (src:Account)-[r:SENT]->(a:Account {account_id: $acc_id})
                    RETURN src.account_id AS src_id, toFloat(r.amount) AS amt, r.txn_ts AS ts
                    ORDER BY toFloat(r.amount) DESC LIMIT 1
                """, acc_id=acc_id)
                inbound = await r2.data()
                r3 = await session.run("""
                    MATCH (a:Account {account_id: $acc_id})-[r:SENT]->(dst:Account)
                    RETURN dst.account_id AS dst_id, toFloat(r.amount) AS amt, r.txn_ts AS ts
                    ORDER BY toFloat(r.amount) DESC LIMIT 1
                """, acc_id=acc_id)
                outbound = await r3.data()
                if inbound and outbound:
                    chain = [inbound[0]['src_id'], acc_id, outbound[0]['dst_id']]
                    amounts = [inbound[0]['amt'], outbound[0]['amt']]
                    timestamps = [str(inbound[0]['ts']), str(outbound[0]['ts'])]
                elif inbound:
                    chain = [inbound[0]['src_id'], acc_id]
                    amounts = [inbound[0]['amt']]
                    timestamps = [str(inbound[0]['ts'])]
                elif outbound:
                    chain = [acc_id, outbound[0]['dst_id']]
                    amounts = [outbound[0]['amt']]
                    timestamps = [str(outbound[0]['ts'])]

            elif pattern == 'KYC_MISMATCH':
                # KYC: show the high-volume transactions
                r2 = await session.run("""
                    MATCH (a:Account {account_id: $acc_id})-[r:SENT]->(dst:Account)
                    RETURN dst.account_id AS dst_id, toFloat(r.amount) AS amt, r.txn_ts AS ts
                    ORDER BY toFloat(r.amount) DESC LIMIT 3
                """, acc_id=acc_id)
                outbound = await r2.data()
                if outbound:
                    chain = [acc_id] + [row['dst_id'] for row in outbound]
                    amounts = [row['amt'] for row in outbound]
                    timestamps = [str(row['ts']) for row in outbound]

            if chain and len(chain) >= 2:
                # Write it back to the Alert node
                await session.run("""
                    MATCH (al:Alert {alert_id: $alert_id})
                    SET al.chain = $chain,
                        al.amounts = $amounts,
                        al.timestamps = $timestamps
                """, alert_id=alert_id, chain=chain, amounts=amounts or [], timestamps=timestamps or [])
                updated += 1
                print(f"  + Fixed {alert_id} [{pattern}]: chain length {len(chain)}")
            else:
                print(f"  - Could not fix {alert_id} [{pattern}] for {acc_id} -- no adjacent txns")

    await driver.close()
    print(f"\nDone. Updated {updated} / {len(alerts)} alerts.")

if __name__ == "__main__":
    asyncio.run(main())
