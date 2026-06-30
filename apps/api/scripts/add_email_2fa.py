import psycopg2
import os
import sys

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            # Check if columns exist
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email'")
            if not cur.fetchone():
                print("Adding email columns to users table...")
                cur.execute("ALTER TABLE users ADD COLUMN email VARCHAR(255)")
                cur.execute("ALTER TABLE users ADD COLUMN current_otp VARCHAR(10)")
                cur.execute("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP")
            
            # Set default mock emails
            cur.execute("UPDATE users SET email = username || '@trace-x.com' WHERE email IS NULL")
            
            # Update specific admin email
            cur.execute("UPDATE users SET email = 'nirmaldarekar90@gmail.com' WHERE role = 'Admin'")
            
            print("Migration successful.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
