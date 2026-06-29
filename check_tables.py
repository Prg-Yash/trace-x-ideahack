import sys
sys.path.insert(0, 'apps/ai-ml')
sys.path.insert(0, 'apps/api')
from fraud_detector import DATABASE_URL
import psycopg2

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r[0] for r in cur.fetchall()]
print("Tables in public schema:", tables)

for t in tables:
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{t}'")
    cols = [f"{r[0]} ({r[1]})" for r in cur.fetchall()]
    print(f"\nTable: {t}")
    for c in cols:
        print("  -", c)

conn.close()
