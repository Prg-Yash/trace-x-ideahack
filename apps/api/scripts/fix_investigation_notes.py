import os
import sys
from pathlib import Path
import psycopg2

ROOT_DIR = Path(__file__).resolve().parents[3]
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_notes():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS investigation_notes (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE CASCADE,
                author VARCHAR(100),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Created investigation_notes table with id SERIAL PRIMARY KEY")
    conn.close()

if __name__ == "__main__":
    fix_notes()
