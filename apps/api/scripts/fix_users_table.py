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

def fix_users():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Adding missing columns to users table...")
        columns = [
            ("last_login_at", "TIMESTAMP"),
            ("two_factor_enabled", "BOOLEAN DEFAULT FALSE"),
            ("two_factor_secret", "VARCHAR(255)"),
            ("current_otp", "VARCHAR(20)"),
            ("otp_expires_at", "TIMESTAMP")
        ]
        for col, col_type in columns:
            try:
                cur.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type};")
                print(f"  Added {col}")
            except Exception as e:
                print(f"  Error adding {col}: {e}")
                
        print("Updating admin user email and role...")
        cur.execute("""
            UPDATE users 
            SET email = 'yashnimse92@gmail.com', role = 'Admin', two_factor_enabled = FALSE
            WHERE username = 'admin';
        """)
        print("Updated successfully!")
    conn.close()

if __name__ == "__main__":
    fix_users()
