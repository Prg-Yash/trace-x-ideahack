import os
import psycopg2
from passlib.context import CryptContext

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_auth():
    print("Connecting to NeonDB PostgreSQL for Auth Seeding...")
    conn = psycopg2.connect(DATABASE_URL)
    
    with conn.cursor() as cur:
        # Create users table
        print("Creating users table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'investigator',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Check if admin user exists
        cur.execute("SELECT id FROM users WHERE username = 'admin'")
        admin = cur.fetchone()
        
        if not admin:
            print("Seeding default admin user...")
            hashed_pwd = get_password_hash("password")
            cur.execute("""
                INSERT INTO users (username, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
            """, ("admin", "admin@trace-x.com", hashed_pwd, "admin"))
        else:
            print("Admin user already exists. Skipping.")
            
    conn.commit()
    conn.close()
    print("Auth Seeding Completed Successfully!")

if __name__ == "__main__":
    seed_auth()
