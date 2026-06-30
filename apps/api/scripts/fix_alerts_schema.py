import os
import sys
from pathlib import Path
import psycopg2

ROOT_DIR = Path(__file__).resolve().parents[3]
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing")

def fix_alerts_and_audit():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Adding missing columns to alerts table...")
        cols = [
            ("assigned_to", "VARCHAR(50)"),
            ("str_drafted_at", "VARCHAR(50)"),
            ("str_filed_at", "VARCHAR(50)")
        ]
        for col, col_type in cols:
            try:
                cur.execute(f"ALTER TABLE alerts ADD COLUMN IF NOT EXISTS {col} {col_type};")
                print(f"  Added {col} to alerts.")
            except Exception as e:
                print(f"  Error adding {col}: {e}")

        print("Creating audit_log table if not exists...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(50) REFERENCES alerts(alert_id) ON DELETE CASCADE,
                user_id VARCHAR(50),
                action VARCHAR(100),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  Created audit_log table successfully.")
    conn.close()

if __name__ == "__main__":
    fix_alerts_and_audit()
