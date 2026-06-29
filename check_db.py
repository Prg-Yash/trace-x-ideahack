import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor(cursor_factory=RealDictCursor)

tables = ['accounts', 'alerts', 'transactions']
for table in tables:
    cur.execute(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position",
        (table,)
    )
    rows = cur.fetchall()
    print(f"\n=== {table.upper()} TABLE ({len(rows)} columns) ===")
    for r in rows:
        print(f"  {r['column_name']:40} {r['data_type']}")

# Sample one full row from accounts
print("\n=== SAMPLE ACCOUNT ROW ===")
cur.execute("SELECT * FROM accounts LIMIT 1")
row = cur.fetchone()
if row:
    for k, v in dict(row).items():
        print(f"  {k:40} = {repr(v)}")

# Sample one full row from alerts
print("\n=== SAMPLE ALERT ROW ===")
cur.execute("SELECT * FROM alerts LIMIT 1")
row = cur.fetchone()
if row:
    for k, v in dict(row).items():
        print(f"  {k:40} = {repr(v)}")

# Sample one full row from transactions
print("\n=== SAMPLE TRANSACTION ROW ===")
cur.execute("SELECT * FROM transactions LIMIT 1")
row = cur.fetchone()
if row:
    for k, v in dict(row).items():
        print(f"  {k:40} = {repr(v)}")

# Count rows in each table
print("\n=== ROW COUNTS ===")
for table in tables:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    print(f"  {table}: {cur.fetchone()['count']} rows")

conn.close()
