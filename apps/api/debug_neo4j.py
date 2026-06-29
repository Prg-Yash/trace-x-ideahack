import asyncio
import os
import sys
from neo4j import AsyncGraphDatabase

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

async def main():
    driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
    async with driver.session() as session:
        # Check what's already in Alert chain properties
        r = await session.run("""
            MATCH (al:Alert)
            RETURN al.alert_id AS id, al.pattern_type AS pat,
                   al.chain AS chain, al.amounts AS amounts,
                   al.ml_confidence AS conf
            LIMIT 10
        """)
        records = await r.data()
        print("Sample Alert data:")
        for row in records:
            print(f"  {row['id']} [{row['pat']}] chain={row['chain']} amounts={row['amounts']} conf={row['conf']}")

        # How many have valid chains already?
        r2 = await session.run("""
            MATCH (al:Alert)
            RETURN 
                count(al) AS total,
                count(CASE WHEN al.chain IS NOT NULL AND size(al.chain) >= 2 THEN 1 END) AS has_chain,
                count(CASE WHEN al.chain IS NULL OR size(al.chain) < 2 THEN 1 END) AS no_chain
        """)
        d2 = await r2.data()
        print("\nAlert chain status:", d2)

        # Check total unique transaction hops across entire graph
        r3 = await session.run("""
            MATCH ()-[r:SENT]->()
            RETURN count(r) AS total_rels
        """)
        d3 = await r3.data()
        print("Total SENT rels:", d3)

        # Show the longest paths in the graph
        r4 = await session.run("""
            MATCH path=(a:Account)-[:SENT*2..5]->(b:Account)
            WHERE a <> b
            WITH [n IN nodes(path) | n.account_id] AS chain,
                 [rel IN relationships(path) | toFloat(rel.amount)] AS amounts,
                 [rel IN relationships(path) | rel.txn_ts] AS timestamps
            RETURN chain, amounts, timestamps
            ORDER BY size(chain) DESC
            LIMIT 3
        """)
        d4 = await r4.data()
        print("\nLongest paths in graph:")
        for row in d4:
            print(f"  chain={row['chain']} amounts={row['amounts']}")

    await driver.close()

if __name__ == "__main__":
    asyncio.run(main())
