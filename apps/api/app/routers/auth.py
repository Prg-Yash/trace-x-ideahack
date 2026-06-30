from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash
from app.core.deps import get_current_user, require_roles
from app.db.session import get_pg_conn

router = APIRouter(tags=["auth"])

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserOut(BaseModel):
    id: str
    username: str
    full_name: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str

class PasswordUpdate(BaseModel):
    new_password: str

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
        user = cur.fetchone()

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["username"], expires_delta=access_token_expires
    )
    
    # Return user data alongside token as requested
    user_data = {
        "id": str(user["id"]),
        "name": user["full_name"], # Frontend expects "name"
        "role": user["role"],
        "username": user["username"]
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/users/investigators")
async def get_investigators(
    current_user: dict = Depends(require_roles(["Admin", "Principal Officer"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, username, full_name, role FROM users WHERE role = 'Investigator'")
        users = cur.fetchall()
        # Convert UUID to string
        for u in users:
            u["id"] = str(u["id"])
    return users

@router.post("/users/investigator")
async def create_investigator(
    user_data: UserCreate,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    hashed_password = get_password_hash(user_data.password)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if username exists
        cur.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
            
        cur.execute(
            "INSERT INTO users (username, hashed_password, full_name, role) VALUES (%s, %s, %s, 'Investigator') RETURNING id, username, full_name, role",
            (user_data.username, hashed_password, user_data.full_name)
        )
        new_user = cur.fetchone()
        new_user["id"] = str(new_user["id"])
        conn.commit()
    return new_user

@router.patch("/users/{user_id}/password")
async def update_user_password(
    user_id: str,
    data: PasswordUpdate,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    hashed_password = get_password_hash(data.new_password)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
            
        cur.execute(
            "UPDATE users SET hashed_password = %s WHERE id = %s",
            (hashed_password, user_id)
        )
        conn.commit()
    return {"message": "Password updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["Admin"])),
    conn = Depends(get_pg_conn)
):
    # Prevent admin from deleting themselves
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
            
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
    return {"message": "User deleted successfully"}
