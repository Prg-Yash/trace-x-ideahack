import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL") or "postgres://trace_admin:tracex2026@localhost:5432/tracex"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'entities';")
    print("Entities columns:", [row[0] for row in cur.fetchall()])
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts';")
    print("Accounts columns:", [row[0] for row in cur.fetchall()])
    
except Exception as e:
    print(e)
