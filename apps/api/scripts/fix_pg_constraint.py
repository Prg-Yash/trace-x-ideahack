import psycopg2
from app.core.config import settings

def fix():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;")
        cur.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Investigator', 'Branch Manager'));")
    print("Fixed.")

if __name__ == "__main__":
    fix()
