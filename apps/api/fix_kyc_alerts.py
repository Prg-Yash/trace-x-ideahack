import asyncio
import os
import sys
from neo4j import AsyncGraphDatabase
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

async def main():
    driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
    updated = 0
    async with driver.session() as session:
        # Get KYC_MISMATCH alerts still without chains
        r = await session.run("""
            MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert)
            WHERE (al.chain IS NULL OR size(al.chain) < 2)
              AND toUpper(al.pattern_type) = 'KYC_MISMATCH'
            RETURN a.account_id AS acc_id, al.alert_id AS alert_id
        """)
        alerts = await r.data()
        print(f"KYC_MISMATCH alerts needing synthetic chains: {len(alerts)}")

        # Get some non-flagged accounts to use as counterparties
        r2 = await session.run("""
            MATCH (a:Account)
            WHERE NOT (a)-[:FLAGGED_IN]->(:Alert)
            RETURN a.account_id AS acc_id
            LIMIT 30
        """)
        normal_accounts = [row['acc_id'] for row in await r2.data()]
        
        if not normal_accounts:
            # fallback: use any accounts
            r3 = await session.run("MATCH (a:Account) RETURN a.account_id AS acc_id LIMIT 30")
            normal_accounts = [row['acc_id'] for row in await r3.data()]

        base_date = datetime(2026, 5, 15, 10, 0, 0)
        
        for i, alert in enumerate(alerts):
            acc_id = alert['acc_id']
            alert_id = alert['alert_id']
            
            # Pick 2-4 random counterparties
            counterparties = random.sample(normal_accounts, min(3, len(normal_accounts)))
            
            # Declare income mismatch: simulate multiple high-value receipts
            # KYC mismatch means: lots of income flowing IN from many sources
            chain = counterparties + [acc_id]
            base_amount = random.uniform(450000, 1200000)
            amounts = [round(base_amount * random.uniform(0.8, 1.2), 2) for _ in counterparties]
            timestamps = [(base_date + timedelta(days=i*2, hours=j*3)).isoformat() for j in range(len(counterparties))]
            
            # Write synthetic chain to Alert node (no actual SENT edges needed - just for trace display)
            await session.run("""
                MATCH (al:Alert {alert_id: $alert_id})
                SET al.chain = $chain,
                    al.amounts = $amounts,
                    al.timestamps = $timestamps,
                    al.chain_type = 'SYNTHETIC_KYC'
            """, alert_id=alert_id, chain=chain, amounts=amounts, timestamps=timestamps)
            
            updated += 1
            print(f"  + Fixed {alert_id} [KYC_MISMATCH] for {acc_id}: chain={chain}")

    await driver.close()
    print(f"\nDone. Added synthetic chains to {updated} KYC_MISMATCH alerts.")

if __name__ == "__main__":
    asyncio.run(main())
