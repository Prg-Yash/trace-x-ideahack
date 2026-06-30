import asyncio
import os
from dotenv import load_dotenv
from neo4j import AsyncGraphDatabase

load_dotenv(".env")

async def test():
    driver = AsyncGraphDatabase.driver(
        os.getenv("NEO4J_URI"),
        auth=(os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))
    )
    async with driver.session() as s:
        r = await s.run("MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert) WHERE a.branch_code = 'SBIN0000001' RETURN a.account_id LIMIT 10")
        records = await r.data()
        print("Records found:", len(records))
    await driver.close()

asyncio.run(test())
