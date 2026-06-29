import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def check_pg():
    print("Checking Postgres Tables...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            tables = ['accounts', 'transactions', 'alerts', 'alert_evidence', 'investigation_notes', 'entities', 'account_stats']
            for t in tables:
                try:
                    cur.execute(f"SELECT COUNT(*) FROM {t};")
                    count = cur.fetchone()["count"]
                    print(f"Table '{t}' count: {count}")
                except Exception as e:
                    print(f"Table '{t}' error: {e}")
                    conn.rollback()
        conn.close()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_pg()
