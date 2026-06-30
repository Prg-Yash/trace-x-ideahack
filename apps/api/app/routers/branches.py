from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from app.core.deps import require_roles
from app.db.session import get_pg_conn
from app.core.audit import log_system_event

router = APIRouter(tags=["branches"])

class BranchCreate(BaseModel):
    branch_code: str
    name: str
    city: str | None = None

class BranchUpdate(BaseModel):
    name: str | None = None
    city: str | None = None

@router.get("/branches")
async def get_branches(
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, branch_code, name, city, created_at FROM branches ORDER BY id")
        return cur.fetchall()

@router.post("/branches")
async def create_branch(
    request: Request,
    branch_data: BranchCreate,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM branches WHERE branch_code = %s", (branch_data.branch_code,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Branch code already exists")
            
        cur.execute(
            "INSERT INTO branches (branch_code, name, city) VALUES (%s, %s, %s) RETURNING id, branch_code, name, city",
            (branch_data.branch_code, branch_data.name, branch_data.city)
        )
        new_branch = cur.fetchone()
        conn.commit()
        
    log_system_event(
        action_type="BRANCH_CREATE",
        status="SUCCESS",
        description=f"Created branch {branch_data.name} ({branch_data.branch_code})",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=str(new_branch["id"]),
        request=request
    )
    return new_branch

@router.patch("/branches/{branch_id}")
async def update_branch(
    request: Request,
    branch_id: int,
    branch_data: BranchUpdate,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    updates = []
    values = []
    if branch_data.name is not None:
        updates.append("name = %s")
        values.append(branch_data.name)
    if branch_data.city is not None:
        updates.append("city = %s")
        values.append(branch_data.city)
        
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    values.append(branch_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"UPDATE branches SET {', '.join(updates)} WHERE id = %s RETURNING id, branch_code, name, city", tuple(values))
        updated_branch = cur.fetchone()
        if not updated_branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        conn.commit()
        
    log_system_event(
        action_type="BRANCH_UPDATE",
        status="SUCCESS",
        description=f"Updated branch {branch_id}",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=str(branch_id),
        request=request
    )
    return updated_branch

@router.delete("/branches/{branch_id}")
async def delete_branch(
    request: Request,
    branch_id: int,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if users are tied to this branch
        cur.execute("SELECT id FROM users WHERE branch_id = %s LIMIT 1", (branch_id,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Cannot delete branch with active users. Move users first.")
            
        cur.execute("DELETE FROM branches WHERE id = %s", (branch_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Branch not found")
        conn.commit()
        
    log_system_event(
        action_type="BRANCH_DELETE",
        status="SUCCESS",
        description=f"Deleted branch {branch_id}",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=str(branch_id),
        request=request
    )
    return {"message": "Branch deleted successfully"}
