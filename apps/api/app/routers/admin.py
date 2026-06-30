from fastapi import APIRouter, Depends
from psycopg2.extras import RealDictCursor
from app.core.deps import require_roles
from app.db.session import get_pg_conn
from typing import List

router = APIRouter(tags=["admin"])

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100, 
    skip: int = 0,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, timestamp, actor_id, actor_name, action_type, target_id, status, description, ip_address, user_agent
            FROM system_audit_logs
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        """, (limit, skip))
        logs = cur.fetchall()
        
    for log in logs:
        if log.get("id"):
            log["id"] = str(log["id"])
        if log.get("actor_id"):
            log["actor_id"] = str(log["actor_id"])
        if log.get("timestamp"):
            log["timestamp"] = str(log["timestamp"])
            
    return {"audit_logs": logs}
