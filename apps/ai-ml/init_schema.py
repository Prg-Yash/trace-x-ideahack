import asyncio
from fraud_detector import ASYNC_DRIVER

async def init_schema():
    async with ASYNC_DRIVER.session() as s:
        await s.run('CREATE CONSTRAINT alert_id_idx IF NOT EXISTS FOR (al:Alert) REQUIRE al.alert_id IS UNIQUE')
        await s.run("MATCH (a:Account) WITH a LIMIT 1 MERGE (al:Alert {pattern: 'SCHEMA_INIT', alert_id: 'INIT'}) MERGE (a)-[:FLAGGED_IN]->(al)")
        print('Schema Initialized')

asyncio.run(init_schema())
