import asyncio
from fraud_detector import _neo4j_session

async def test():
    async with _neo4j_session() as s:
        res = await s.run('MATCH (n:Account {account_id: "ACC_DEMO_DORMANT_185803"})-[r]-(m) RETURN labels(n), n.account_id, type(r), labels(m), properties(m)')
        records = await res.data()
        for r in records:
            print(r)
            
asyncio.run(test())
