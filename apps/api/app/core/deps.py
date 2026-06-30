from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from psycopg2.extras import RealDictCursor
from app.core.security import SECRET_KEY, ALGORITHM
from app.core.config import settings
from app.db.session import get_pg_conn

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), conn = Depends(get_pg_conn)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.is_active, b.branch_code
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.username = %s
        """, (username,))
        user = cur.fetchone()
        
    if user is None or not user.get("is_active"):
        raise credentials_exception
    
    # Format for JSON serialization (uuid -> str)
    user['id'] = str(user['id'])
    return user

def require_roles(allowed_roles: list[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker
