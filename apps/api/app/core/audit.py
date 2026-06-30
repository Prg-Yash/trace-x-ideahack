import psycopg2
import os
from fastapi import Request
from typing import Optional

DATABASE_URL = os.getenv("DATABASE_URL")

def log_system_event(
    action_type: str,
    status: str,
    description: str,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    target_id: Optional[str] = None,
    request: Optional[Request] = None,
    conn=None
):
    """
    Logs an event to the system_audit_logs table.
    
    If `conn` is provided, it uses the existing connection (useful for wrapping in transactions).
    Otherwise, it opens a new connection.
    """
    ip_address = None
    user_agent = None
    if request:
        if request.client:
            ip_address = request.client.host
        user_agent = request.headers.get("user-agent")

    own_conn = False
    if not conn:
        own_conn = True
        conn = psycopg2.connect(DATABASE_URL)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO system_audit_logs 
                (actor_id, actor_name, action_type, target_id, status, description, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (actor_id, actor_name, action_type, target_id, status, description, ip_address, user_agent))
        conn.commit()
    except Exception as e:
        print(f"Failed to write audit log: {e}")
        conn.rollback()
    finally:
        if own_conn:
            conn.close()
