import sys
sys.path.insert(0, 'apps/ai-ml')
sys.path.insert(0, 'apps/api')
from fraud_detector import DATABASE_URL
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor(cursor_factory=RealDictCursor)

acc_id = "ACC_00001"

print("=== ACCOUNTS JOIN ENTITIES ===")
cur.execute("""
    SELECT a.*, e.customer_name, e.pan_number, e.dob, e.address, e.declared_annual_income
    FROM accounts a
    LEFT JOIN entities e ON a.entity_id = e.entity_id
    WHERE a.account_id = %s
""", (acc_id,))
row = cur.fetchone()
if row:
    for k, v in dict(row).items():
        print(f"  {k:30} = {v}")

print("\n=== ACCOUNT ML FEATURES ===")
cur.execute("SELECT * FROM account_ml_features WHERE account_id = %s", (acc_id,))
row = cur.fetchone()
if row:
    for k, v in dict(row).items():
        if v is not None:
            print(f"  {k:30} = {v}")

conn.close()
