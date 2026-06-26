import asyncio
from fraud_detector import _run_query

async def main():
    res = await _run_query('MATCH (a:Account) WHERE NOT EXISTS((a)-[:FLAGGED_IN]->(:Alert)) RETURN a.account_id LIMIT 10')
    print([r['a.account_id'] for r in res])

asyncio.run(main())
