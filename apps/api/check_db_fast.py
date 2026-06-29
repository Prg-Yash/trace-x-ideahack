import asyncio
import os
import sys
from neo4j import AsyncGraphDatabase
import psycopg2
from psycopg2.extras import RealDictCursor

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

async def main():
    print("Checking Postgres...")
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) FROM accounts;")
            acc_count = cur.fetchone()["count"]
            print(f"Postgres Accounts: {acc_count}")
            
            cur.execute("SELECT COUNT(*) FROM transactions;")
            txn_count = cur.fetchone()["count"]
            print(f"Postgres Transactions: {txn_count}")
            
            cur.execute("SELECT COUNT(*) FROM alerts;")
            alert_count = cur.fetchone()["count"]
            print(f"Postgres Alerts: {alert_count}")
            
        conn.close()
    except Exception as e:
        print(f"Postgres Error: {e}")
        
    print("\nChecking Neo4j...")
    try:
        driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
        async with driver.session() as session:
            res = await session.run("MATCH (a:Account) RETURN count(a) AS c")
            rec = await res.single()
            print(f"Neo4j Accounts: {rec['c']}")
            
            res = await session.run("MATCH ()-[r]->() RETURN count(r) AS c")
            rec = await res.single()
            print(f"Neo4j Transactions: {rec['c']}")
            
            res = await session.run("MATCH (al:Alert) RETURN count(al) AS c")
            rec = await res.single()
            print(f"Neo4j Alerts: {rec['c']}")
            
        await driver.close()
    except Exception as e:
        print(f"Neo4j Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
