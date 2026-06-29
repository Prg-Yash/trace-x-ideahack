import sys
sys.path.insert(0, 'apps/ai-ml')
sys.path.insert(0, 'apps/api')
from fraud_detector import DATABASE_URL
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor(cursor_factory=RealDictCursor)

acc_id = "ACC_00001"
cur.execute("""
    SELECT * FROM transactions 
    WHERE sender_id = %s OR receiver_id = %s 
    ORDER BY txn_ts DESC LIMIT 10
""", (acc_id, acc_id))
rows = cur.fetchall()
print(f"Transactions for {acc_id}: {len(rows)}")
for r in rows:
    print(f"  {r['txn_id']} | {r['sender_id']} -> {r['receiver_id']} | Amt: {r['amount']} | Rail: {r['channel']} | TS: {r['txn_ts']}")

conn.close()
