import sys
from pathlib import Path

# Add the apps/api directory to the python path so 'app' can be imported
sys.path.append(str(Path(__file__).resolve().parent.parent))

import psycopg2
from app.core.config import settings

def migrate():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            # 1. Add lock columns to users table
            print("Adding failed_otp_attempts and is_locked to users table...")
            try:
                cur.execute("ALTER TABLE users ADD COLUMN failed_otp_attempts INTEGER DEFAULT 0")
            except psycopg2.errors.DuplicateColumn:
                print("failed_otp_attempts already exists.")
                
            try:
                cur.execute("ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT FALSE")
            except psycopg2.errors.DuplicateColumn:
                print("is_locked already exists.")

            # 2. Create webauthn_credentials table
            print("Creating webauthn_credentials table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS webauthn_credentials (
                    id SERIAL PRIMARY KEY,
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    credential_id TEXT UNIQUE NOT NULL,
                    public_key TEXT NOT NULL,
                    sign_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            print("Migration successful.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
