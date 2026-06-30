import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_migration():
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("DATABASE_URL is missing in .env")
        return

    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    
    try:
        with conn.cursor() as cur:
            # 1. Create Branches table
            print("Creating branches table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS branches (
                    id SERIAL PRIMARY KEY,
                    branch_code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    city VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 2. Add columns to Users table
            print("Adding columns to users table (if they don't exist)...")
            
            # We must use separate ALTERS with exception handling for idempotency
            columns_to_add = [
                ("branch_id", "INTEGER REFERENCES branches(id)"),
                ("last_login_at", "TIMESTAMP"),
                ("two_factor_secret", "VARCHAR(255)"),
                ("two_factor_enabled", "BOOLEAN DEFAULT FALSE"),
                ("is_active", "BOOLEAN DEFAULT TRUE"),
                ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
                    print(f"  Added column: {col_name}")
                except psycopg2.errors.DuplicateColumn:
                    print(f"  Column {col_name} already exists.")
                    # Rollback the failed transaction block but connection is autocommit so it's fine
            
            # 3. Ensure accounts has branch_code
            print("Checking accounts table for branch_code...")
            try:
                cur.execute("ALTER TABLE accounts ADD COLUMN branch_code VARCHAR(50);")
                print("  Added branch_code to accounts.")
            except psycopg2.errors.DuplicateColumn:
                print("  branch_code already exists on accounts.")
                
            # 4. Seed initial branch
            cur.execute("SELECT id FROM branches WHERE branch_code = 'MUM_HQ_01'")
            if not cur.fetchone():
                print("Seeding MUM_HQ_01 branch...")
                cur.execute("""
                    INSERT INTO branches (branch_code, name, city) 
                    VALUES ('MUM_HQ_01', 'Mumbai Headquarters', 'Mumbai')
                """)
            
            print("Migration complete!")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
