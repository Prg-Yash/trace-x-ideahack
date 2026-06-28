import asyncio
from fraud_detector import _run_query

async def main():
    # Find any account that originates a successful cycle
    query = '''
        MATCH path = (a:Account)-[:SENT*3..5]->(a)
        WHERE ALL(r IN relationships(path) WHERE toUpper(r.status) = 'SUCCESS')
          AND ALL(i IN range(0, size(relationships(path))-2) 
                  WHERE (relationships(path)[i+1]).txn_ts > (relationships(path)[i]).txn_ts)
        RETURN a.account_id AS start_account
        LIMIT 1
    '''
    res = await _run_query(query)
    for r in res:
        print(f"FOUND ACCOUNT: {r['start_account']}")

if __name__ == "__main__":
    asyncio.run(main())
