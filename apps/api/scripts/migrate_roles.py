import psycopg2
from app.core.config import settings

def migrate_roles():
    print("Migrating roles...")
    with psycopg2.connect(settings.DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET role = 'Admin' WHERE role = 'Principal Officer'")
            print(f"Updated {cur.rowcount} users from Principal Officer to Admin")
        conn.commit()
    print("Done")

if __name__ == "__main__":
    migrate_roles()
