import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def create_system_audit_logs_table():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                
                CREATE TABLE IF NOT EXISTS system_audit_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    actor_id UUID,
                    actor_name VARCHAR(255),
                    action_type VARCHAR(50) NOT NULL,
                    target_id VARCHAR(255),
                    status VARCHAR(20) NOT NULL,
                    description TEXT,
                    ip_address VARCHAR(50),
                    user_agent TEXT
                );
                
                CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON system_audit_logs(timestamp);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON system_audit_logs(action_type);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON system_audit_logs(actor_id);
            """)
        conn.commit()
        print("Successfully created system_audit_logs table and indexes.")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_system_audit_logs_table()
