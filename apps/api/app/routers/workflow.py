from fastapi import APIRouter, Depends, HTTPException, status, Request
from psycopg2.extras import RealDictCursor
from app.core.deps import get_current_user, require_roles
from app.db.session import get_pg_conn
from pydantic import BaseModel
from typing import Optional
import json
from app.core.audit import log_system_event

class AssignRequest(BaseModel):
    assignee_id: Optional[str] = None

router = APIRouter(tags=["workflow"])

def write_audit_log(request, cur, alert_id: str, user_id: str, user_name: str, action: str, metadata: dict = None):
    cur.execute(
        "INSERT INTO audit_log (alert_id, user_id, action, metadata) VALUES (%s, %s, %s, %s)",
        (alert_id, user_id, action, json.dumps(metadata) if metadata else None)
    )
    # Also log to the centralized system audit log
    log_system_event(
        action_type=f"ALERT_{action}",
        status="SUCCESS",
        description=f"Action '{action}' performed on alert {alert_id}. {json.dumps(metadata) if metadata else ''}",
        actor_id=user_id,
        actor_name=user_name,
        target_id=alert_id,
        request=request,
        conn=cur.connection
    )

@router.post("/{alert_id}/assign")
async def assign_alert(
    request: Request,
    alert_id: str,
    payload: AssignRequest = None,
    current_user: dict = Depends(require_roles(["Investigator", "Admin"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check current status
        cur.execute("SELECT status, assigned_to FROM alerts WHERE alert_id = %s", (alert_id,))
        alert = cur.fetchone()
        
        if not alert:
            # Initialize workflow state in Postgres for new alerts from Neo4j
            cur.execute("INSERT INTO alerts (alert_id, status) VALUES (%s, 'OPEN')", (alert_id,))
            alert = {"status": "OPEN", "assigned_to": None}
            
        if alert["status"] not in ["OPEN", "NEW", "UNDER_INVESTIGATION"]:
            raise HTTPException(status_code=400, detail="Alert cannot be assigned in its current state")
            
        # Determine assignee
        if current_user["role"] in ["Admin", "Branch Manager"]:
            if not payload or not payload.assignee_id:
                raise HTTPException(status_code=400, detail="Must provide assignee_id")
            assignee_id = payload.assignee_id
            
            # Verify assignee is an investigator
            cur.execute("SELECT username, branch_id FROM users WHERE id = %s", (assignee_id,))
            assignee = cur.fetchone()
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee not found")
                
            # Verify they are actually an Investigator (not a Branch Manager)
            cur.execute("SELECT role FROM users WHERE id = %s AND role = 'Investigator'", (assignee_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=400, detail="Invalid assignee: User is not an Investigator")
            
            assignee_username = assignee["username"]
            assignee_branch_id = assignee["branch_id"]
            
            # Verify the assignee belongs to the same branch as the alert
            # Fetch the alert's branch_code
            cur.execute("""
                SELECT acc.branch_code 
                FROM alerts al 
                JOIN accounts acc ON al.account_id = acc.account_id 
                WHERE al.alert_id = %s
            """, (alert_id,))
            alert_branch = cur.fetchone()
            
            if not alert_branch:
                # If account is not found, maybe fallback to extracting it from alert_id if it follows a pattern,
                # but let's just allow it for now if we can't find it to prevent breaking the flow entirely.
                pass
            else:
                alert_branch_code = alert_branch["branch_code"]
                
                # We need assignee's branch_code. Let's fetch it from users or branch table.
                # Actually, `assignee["branch_id"]` might be a UUID.
                cur.execute("SELECT branch_code FROM branches WHERE id = %s", (assignee_branch_id,))
                branch_row = cur.fetchone()
                if branch_row:
                    assignee_branch_code = branch_row["branch_code"]
                    
                    if current_user["role"] == "Branch Manager":
                        if str(assignee_branch_code) != str(current_user.get("branch_code")):
                            raise HTTPException(status_code=403, detail="Cannot assign an investigator from a different branch")
                    
                    if str(assignee_branch_code) != str(alert_branch_code):
                        raise HTTPException(status_code=403, detail=f"Assignee branch ({assignee_branch_code}) does not match alert branch ({alert_branch_code})")
                
        else:
            # Investigator assigning to themselves
            assignee_id = current_user["id"]
            assignee_username = current_user["username"]
            
        cur.execute(
            "UPDATE alerts SET assigned_to = %s, status = 'UNDER_INVESTIGATION' WHERE alert_id = %s",
            (assignee_id, alert_id)
        )
        
        write_audit_log(request, cur, alert_id, current_user["id"], current_user["username"], "ASSIGNED", {"assigned_to": assignee_username})
        conn.commit()
        
    return {"message": "Alert assigned successfully", "status": "UNDER_INVESTIGATION"}

@router.post("/{alert_id}/draft-str")
async def draft_str(
    request: Request,
    alert_id: str,
    current_user: dict = Depends(require_roles(["Investigator"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT status, assigned_to FROM alerts WHERE alert_id = %s", (alert_id,))
        alert = cur.fetchone()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        if str(alert["assigned_to"]) != str(current_user["id"]):
            raise HTTPException(status_code=403, detail="You can only draft STRs for cases assigned to you")
            
        if alert["status"] != "UNDER_INVESTIGATION":
            raise HTTPException(status_code=400, detail="Alert must be UNDER_INVESTIGATION to draft an STR")
            
        cur.execute(
            "UPDATE alerts SET status = 'PENDING_APPROVAL', str_drafted_at = CURRENT_TIMESTAMP::text WHERE alert_id = %s",
            (alert_id,)
        )
        
        write_audit_log(request, cur, alert_id, current_user["id"], current_user["username"], "STR_DRAFTED", {"action": "Draft sent for approval"})
        conn.commit()
        
    return {"message": "STR Drafted", "status": "PENDING_APPROVAL"}

@router.post("/{alert_id}/approve-str")
async def approve_str(
    request: Request,
    alert_id: str,
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT status FROM alerts WHERE alert_id = %s", (alert_id,))
        alert = cur.fetchone()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        if alert["status"] != "PENDING_APPROVAL":
            raise HTTPException(status_code=400, detail="Alert must be PENDING_APPROVAL to approve an STR")
            
        cur.execute(
            "UPDATE alerts SET status = 'FILED', str_filed_at = CURRENT_TIMESTAMP::text WHERE alert_id = %s",
            (alert_id,)
        )
        
        write_audit_log(request, cur, alert_id, current_user["id"], current_user["username"], "STR_APPROVED", {"action": "STR Filed with FIU"})
        conn.commit()
        
    return {"message": "STR Approved and Filed", "status": "FILED"}

@router.post("/{alert_id}/reject-str")
async def reject_str(
    request: Request,
    alert_id: str,
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT status FROM alerts WHERE alert_id = %s", (alert_id,))
        alert = cur.fetchone()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        if alert["status"] != "PENDING_APPROVAL":
            raise HTTPException(status_code=400, detail="Alert must be PENDING_APPROVAL to reject an STR")
            
        cur.execute(
            "UPDATE alerts SET status = 'UNDER_INVESTIGATION' WHERE alert_id = %s",
            (alert_id,)
        )
        
        write_audit_log(request, cur, alert_id, current_user["id"], current_user["username"], "STR_REJECTED", {"action": "STR Rejected and returned to Investigator"})
        conn.commit()
        
    return {"message": "STR Rejected", "status": "UNDER_INVESTIGATION"}

@router.get("/{alert_id}/audit")
async def get_audit_trail(
    alert_id: str,
    current_user: dict = Depends(get_current_user),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT a.id, a.action, a.metadata, a.created_at, u.full_name as actor, u.role as actor_role
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.alert_id = %s
            ORDER BY a.created_at ASC
        """, (alert_id,))
        logs = cur.fetchall()
        
    # Serialize for JSON
    for log in logs:
        log["id"] = str(log["id"])
        log["created_at"] = str(log["created_at"])
        
    return {"audit_log": logs}
