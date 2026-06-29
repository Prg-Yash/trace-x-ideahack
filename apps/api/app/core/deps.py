from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from .security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

async def get_current_user(token: str = Depends(oauth2_scheme)):
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
        
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, username, email, role FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
    finally:
        conn.close()
        
    if user is None:
        raise credentials_exception
    return user
