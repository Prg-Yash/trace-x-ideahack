from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import webauthn
from webauthn.helpers.structs import (
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn.helpers import options_to_json, base64url_to_bytes, bytes_to_base64url
from typing import Dict, Any

from app.db.session import get_pg_conn
from app.core.deps import get_current_user
from app.routers.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.audit import log_system_event
from datetime import timedelta, datetime

from app.core.config import settings

router = APIRouter(tags=["webauthn"])

RP_ID = settings.WEB_DOMAIN
RP_NAME = "TRACE-X"
ORIGIN = f"https://{settings.WEB_DOMAIN}" if settings.WEB_DOMAIN != "localhost" else "http://localhost:5173"

# In a real app, this challenge should be stored in Redis with an expiration.
# For this ideahack, we will store it temporarily in a global dict keyed by user_id.
# A better approach is storing it in the database `users.current_webauthn_challenge`.
temporary_challenges = {}

class RegistrationResponse(BaseModel):
    options: Dict[str, Any]

class AuthenticationResponse(BaseModel):
    options: Dict[str, Any]

@router.get("/register/generate")
async def generate_registration_options(current_user: dict = Depends(get_current_user), conn = Depends(get_pg_conn)):
    # Create options
    options: PublicKeyCredentialCreationOptions = webauthn.generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=str(current_user["id"]).encode("utf-8"),
        user_name=current_user["username"],
        user_display_name=current_user["full_name"],
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
            resident_key=ResidentKeyRequirement.PREFERRED,
        ),
        exclude_credentials=[],
    )
    
    # Store challenge
    with conn.cursor() as cur:
        # We can just use the global dict for simplicity, but let's add it to the DB if possible, or just the dict
        temporary_challenges[f"reg_{current_user['id']}"] = options.challenge
        
    return {"options": options_to_json(options)}

@router.post("/register/verify")
async def verify_registration(request: Request, credential: dict, current_user: dict = Depends(get_current_user), conn = Depends(get_pg_conn)):
    expected_challenge = temporary_challenges.get(f"reg_{current_user['id']}")
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Challenge not found or expired")
        
    try:
        verification = webauthn.verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            require_user_verification=False,
        )
        
        # Save credential to DB
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count) VALUES (%s, %s, %s, %s)",
                (
                    current_user["id"],
                    bytes_to_base64url(verification.credential_id),
                    bytes_to_base64url(verification.credential_public_key),
                    verification.sign_count
                )
            )
            # Mark user as having 2FA enabled
            cur.execute("UPDATE users SET two_factor_enabled = TRUE WHERE id = %s", (current_user["id"],))
            conn.commit()
            
        del temporary_challenges[f"reg_{current_user['id']}"]
        
        log_system_event(
            action_type="PASSKEY_REGISTERED",
            status="SUCCESS",
            description="Successfully registered a WebAuthn passkey",
            actor_id=current_user["id"],
            actor_name=current_user["full_name"],
            request=request
        )
        
        return {"message": "Passkey registered successfully"}
    except Exception as e:
        print("WebAuthn verification error:", e)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/authenticate/generate/{username}")
async def generate_authentication_options(username: str, conn = Depends(get_pg_conn)):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, is_locked FROM users WHERE username = %s AND is_active = TRUE", (username,))
        user = cur.fetchone()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("is_locked"):
        raise HTTPException(status_code=403, detail="Account locked due to too many failed attempts.")
        
    options = webauthn.generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    
    temporary_challenges[f"auth_{username}"] = options.challenge
    return {"options": options_to_json(options)}

@router.post("/authenticate/verify/{username}")
async def verify_authentication(request: Request, username: str, credential: dict, conn = Depends(get_pg_conn)):
    expected_challenge = temporary_challenges.get(f"auth_{username}")
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Challenge not found or expired")
        
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, full_name, role, branch_id, two_factor_enabled FROM users WHERE username = %s AND is_active = TRUE", (username,))
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        cur.execute("SELECT credential_id, public_key, sign_count FROM webauthn_credentials WHERE user_id = %s", (user["id"],))
        credentials = cur.fetchall()
        
    if not credentials:
        raise HTTPException(status_code=400, detail="No passkeys registered for this user")
        
    # Find the matching credential
    matching_cred = None
    for c in credentials:
        if c["credential_id"] == credential.get("id"):
            matching_cred = c
            break
            
    if not matching_cred:
        raise HTTPException(status_code=400, detail="Passkey not recognized")
        
    try:
        verification = webauthn.verify_authentication_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_origin=ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=base64url_to_bytes(matching_cred["public_key"]),
            credential_current_sign_count=matching_cred["sign_count"],
            require_user_verification=False,
        )
        
        # Update sign count
        with conn.cursor() as cur:
            cur.execute("UPDATE webauthn_credentials SET sign_count = %s WHERE credential_id = %s", (verification.new_sign_count, matching_cred["credential_id"]))
            cur.execute("UPDATE users SET failed_otp_attempts = 0, last_login_at = %s WHERE id = %s", (datetime.utcnow(), user["id"]))
            
            # Fetch branch code if available
            branch_code = None
            if user.get("branch_id"):
                cur.execute("SELECT branch_code FROM branches WHERE id = %s", (user["branch_id"],))
                b = cur.fetchone()
                if b:
                    branch_code = b[0]
                    
            conn.commit()
            
        del temporary_challenges[f"auth_{username}"]
        
        log_system_event(
            action_type="LOGIN_ATTEMPT",
            status="SUCCESS",
            description="Successful passkey login",
            actor_id=user["id"],
            actor_name=user["full_name"],
            request=request,
            conn=conn
        )
        
        # Generate JWT
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=username, expires_delta=access_token_expires
        )
        
        user_data = {
            "id": str(user["id"]),
            "name": user["full_name"],
            "role": user["role"],
            "username": username,
            "branch_id": user.get("branch_id"),
            "branch_code": branch_code,
            "two_factor_enabled": bool(user.get("two_factor_enabled"))
        }
        
        return {"access_token": access_token, "token_type": "bearer", "user": user_data}
        
    except Exception as e:
        print("WebAuthn auth error:", e)
        log_system_event(
            action_type="LOGIN_ATTEMPT",
            status="FAILED",
            description=f"Passkey verification failed for {username}: {e}",
            actor_id=user["id"] if user else None,
            actor_name=user["full_name"] if user else None,
            request=request,
            conn=conn
        )
        raise HTTPException(status_code=401, detail=str(e))
