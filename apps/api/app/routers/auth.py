from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
from typing import Optional

from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash
from app.core.deps import get_current_user, require_roles
from app.db.session import get_pg_conn
import random
import smtplib
from email.message import EmailMessage
from app.core.config import settings
from app.core.audit import log_system_event
import pyotp
from fastapi import Request

from typing import Optional

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
    branch_id: int | None = None
    branch_code: str | None = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    branch_id: int | None = None
    role: str = "Investigator"

class PasswordUpdate(BaseModel):
    new_password: str

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), totp_code: Optional[str] = Form(None), conn = Depends(get_pg_conn)):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT u.*, b.branch_code 
            FROM users u 
            LEFT JOIN branches b ON u.branch_id = b.id 
            WHERE (u.username = %s OR u.email = %s) AND u.is_active = TRUE
        """, (form_data.username, form_data.username))
        user = cur.fetchone()

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        log_system_event(
            action_type="LOGIN_ATTEMPT",
            status="FAILED",
            description=f"Failed login attempt for username: {form_data.username}",
            request=request,
            conn=conn
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.get("is_locked"):
        log_system_event(
            action_type="LOGIN_ATTEMPT",
            status="DENIED",
            description=f"Attempt to login to locked account: {form_data.username}",
            actor_id=user["id"],
            actor_name=user["full_name"],
            request=request,
            conn=conn
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account locked due to too many failed attempts. Please contact your Administrator."
        )
        
    if user.get("two_factor_enabled"):
        if not totp_code:
            # Generate OTP
            otp = f"{random.randint(100000, 999999)}"
            expires_at = datetime.utcnow() + timedelta(minutes=10)
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET current_otp = %s, otp_expires_at = %s WHERE id = %s", (otp, expires_at, user["id"]))
                conn.commit()
            
            # Send real email
            email = user.get("email", "unknown@trace-x.com")
            if settings.SMTP_EMAIL and settings.SMTP_PASSWORD and email and "@" in email:
                try:
                    msg = EmailMessage()
                    msg.set_content(f"Your 6-digit TRACE-X Login OTP is {otp}. It expires in 10 minutes.")
                    msg['Subject'] = 'Your TRACE-X Login OTP'
                    msg['From'] = settings.SMTP_EMAIL
                    msg['To'] = email
                    
                    server = smtplib.SMTP('smtp.gmail.com', 587)
                    server.starttls()
                    server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
                    server.send_message(msg)
                    server.quit()
                    print(f"Real email sent to {email}")
                except Exception as e:
                    print(f"Failed to send real email to {email}: {e}")
            else:
                print(f"\n{'='*50}\n[MOCK EMAIL SERVICE] Sent to: {email}\nSubject: Your TRACE-X Login OTP\nBody: Your 6-digit OTP is {otp}. It expires in 10 minutes.\n{'='*50}\n")
            
            raise HTTPException(status_code=400, detail="2FA code required")
            
        # Verify OTP
        if not user.get("current_otp") or user.get("current_otp") != totp_code or (user.get("otp_expires_at") and user.get("otp_expires_at") < datetime.utcnow()):
            failed_attempts = user.get("failed_otp_attempts", 0) + 1
            is_locked = failed_attempts >= 3
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET failed_otp_attempts = %s, is_locked = %s WHERE id = %s", (failed_attempts, is_locked, user["id"]))
                conn.commit()
            
            if is_locked:
                log_system_event(
                    action_type="ACCOUNT_LOCKOUT",
                    status="SUCCESS",
                    description=f"Account locked due to 3 failed OTP attempts",
                    actor_id=user["id"],
                    actor_name=user["full_name"],
                    target_id=str(user["id"]),
                    request=request,
                    conn=conn
                )
                raise HTTPException(status_code=403, detail="Account locked due to too many failed attempts. Please contact your Administrator.")
            else:
                log_system_event(
                    action_type="LOGIN_ATTEMPT",
                    status="FAILED",
                    description=f"Invalid OTP. Failed attempts: {failed_attempts}",
                    actor_id=user["id"],
                    actor_name=user["full_name"],
                    request=request,
                    conn=conn
                )
                raise HTTPException(status_code=401, detail=f"Invalid or expired 2FA code. Attempts remaining: {3 - failed_attempts}")
            
        # Clear OTP after successful use
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET current_otp = NULL, otp_expires_at = NULL, failed_otp_attempts = 0 WHERE id = %s", (user["id"],))
            conn.commit()
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["username"], expires_delta=access_token_expires
    )
    
    with conn.cursor() as cur:
        cur.execute("UPDATE users SET last_login_at = %s WHERE id = %s", (datetime.utcnow(), user["id"]))
        conn.commit()
    
    log_system_event(
        action_type="LOGIN_ATTEMPT",
        status="SUCCESS",
        description="Successful login",
        actor_id=user["id"],
        actor_name=user["full_name"],
        request=request,
        conn=conn
    )
    
    # Return user data alongside token as requested
    user_data = {
        "id": str(user["id"]),
        "name": user["full_name"], # Frontend expects "name"
        "role": user["role"],
        "username": user["username"],
        "branch_id": user.get("branch_id"),
        "branch_code": user.get("branch_code"),
        "two_factor_enabled": bool(user.get("two_factor_enabled"))
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/users/investigators")
async def get_investigators(
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if current_user["role"] == "Branch Manager":
            cur.execute("""
                SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.is_locked, b.branch_code 
                FROM users u 
                LEFT JOIN branches b ON u.branch_id = b.id 
                WHERE u.role = 'Investigator' AND u.branch_id = %s AND u.is_active = TRUE
            """, (current_user.get("branch_id"),))
        else:
            cur.execute("""
                SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.is_locked, b.branch_code 
                FROM users u 
                LEFT JOIN branches b ON u.branch_id = b.id 
                WHERE u.role = 'Investigator' AND u.is_active = TRUE
            """)
        users = cur.fetchall()
        # Convert UUID to string
        for u in users:
            u["id"] = str(u["id"])
    return users

@router.post("/users")
async def create_user(
    request: Request,
    user_data: UserCreate,
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    hashed_password = get_password_hash(user_data.password)
    
    # Determine branch_id and role
    target_branch = user_data.branch_id
    assigned_role = user_data.role

    if current_user["role"] == "Branch Manager":
        target_branch = current_user.get("branch_id")
        assigned_role = "Investigator"
        if not target_branch:
            raise HTTPException(status_code=400, detail="Manager has no branch assigned")
            
    if assigned_role not in ["Investigator", "Branch Manager"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if username exists
        cur.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
            
        cur.execute(
            "INSERT INTO users (username, hashed_password, full_name, email, role, branch_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, username, full_name, email, role, branch_id",
            (user_data.username, hashed_password, user_data.full_name, user_data.email, assigned_role, target_branch)
        )
        new_user = cur.fetchone()
        new_user["id"] = str(new_user["id"])
        conn.commit()
        
    log_system_event(
        action_type="USER_CREATE",
        status="SUCCESS",
        description=f"Created user {user_data.username} with role {assigned_role}",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=new_user["id"],
        request=request
    )
    return new_user

@router.patch("/users/{user_id}/password")
async def update_user_password(
    request: Request,
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
        
    log_system_event(
        action_type="PASSWORD_UPDATE",
        status="SUCCESS",
        description=f"Updated password for user {user_id}",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=user_id,
        request=request
    )
    return {"message": "Password updated successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    # Prevent deleting themselves
    if current_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if user exists and enforce branch manager scope
        cur.execute("SELECT id, role, branch_id FROM users WHERE id = %s", (user_id,))
        user_to_delete = cur.fetchone()
        
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
            
        if current_user["role"] == "Branch Manager":
            if user_to_delete["role"] != "Investigator" or user_to_delete["branch_id"] != current_user.get("branch_id"):
                raise HTTPException(status_code=403, detail="Branch managers can only delete their own investigators")
            
        cur.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (user_id,))
        cur.execute("UPDATE alerts SET assigned_to = NULL WHERE assigned_to = %s AND status = 'INVESTIGATING'", (user_id,))
        conn.commit()
        
    log_system_event(
        action_type="USER_DELETE",
        status="SUCCESS",
        description=f"Deleted user {user_id}",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        target_id=user_id,
        request=request
    )
    return {"message": "User soft-deleted successfully"}

@router.post("/2fa/generate")
async def generate_2fa(request: Request, current_user: dict = Depends(get_current_user), conn = Depends(get_pg_conn)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=current_user["username"], issuer_name="TRACE-X")
    
    with conn.cursor() as cur:
        cur.execute("UPDATE users SET two_factor_secret = %s WHERE id = %s", (secret, current_user["id"]))
        conn.commit()
        conn.commit()
        
    log_system_event(
        action_type="2FA_OTP_REQUEST",
        status="SUCCESS",
        description="Generated new TOTP secret",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        request=request
    )
        
    return {"secret": secret, "uri": provisioning_uri}

@router.post("/2fa/verify")
async def verify_2fa(request: Request, totp_code: str = Form(...), current_user: dict = Depends(get_current_user), conn = Depends(get_pg_conn)):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT two_factor_secret FROM users WHERE id = %s", (current_user["id"],))
        user_row = cur.fetchone()
        
    if not user_row or not user_row["two_factor_secret"]:
        raise HTTPException(status_code=400, detail="2FA not generated yet")
        
    totp = pyotp.TOTP(user_row["two_factor_secret"])
    if not totp.verify(totp_code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    with conn.cursor() as cur:
        cur.execute("UPDATE users SET two_factor_enabled = TRUE WHERE id = %s", (current_user["id"],))
        conn.commit()
        
    log_system_event(
        action_type="2FA_OTP_VERIFY",
        status="SUCCESS",
        description="Successfully enabled 2FA",
        actor_id=current_user["id"],
        actor_name=current_user["full_name"],
        request=request
    )
        
    return {"message": "2FA successfully enabled"}

@router.post("/users/{user_id}/unlock")
async def unlock_user(
    request: Request,
    user_id: str,
    current_user: dict = Depends(require_roles(["Admin", "Branch Manager"])),
    conn = Depends(get_pg_conn)
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check permissions for branch managers
        if current_user["role"] == "Branch Manager":
            cur.execute("SELECT branch_id FROM users WHERE id = %s", (user_id,))
            target_user = cur.fetchone()
            if not target_user or target_user["branch_id"] != current_user.get("branch_id"):
                raise HTTPException(status_code=403, detail="Branch managers can only unlock investigators in their own branch")
                
        cur.execute("UPDATE users SET is_locked = FALSE, failed_otp_attempts = 0 WHERE id = %s", (user_id,))
        conn.commit()
        
    log_system_event(
        action_type="ACCOUNT_UNLOCKED",
        status="SUCCESS",
        description=f"Unlocked user account: {user_id}",
        actor_id=current_user["id"],
        actor_name=current_user["username"],
        target_id=user_id,
        request=request,
        conn=conn
    )
    return {"message": "User unlocked successfully"}
