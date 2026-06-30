import os
import sys
from pathlib import Path
import psycopg2

ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT_DIR / "apps" / "api"))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

from app.core.security import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL")

def reset_pwd():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        pwd = get_password_hash("admin123")
        cur.execute("""
            UPDATE users 
            SET hashed_password = %s, email = 'yashnimse92@gmail.com', role = 'Admin', two_factor_enabled = FALSE
            WHERE username = 'admin';
        """, (pwd,))
        print("✅ Successfully reset admin password to 'admin123' and email to 'yashnimse92@gmail.com'")
    conn.close()

if __name__ == "__main__":
    reset_pwd()
