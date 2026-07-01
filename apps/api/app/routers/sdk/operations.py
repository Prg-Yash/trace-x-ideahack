from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, List
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.routers.fraud import get_score, get_alerts_quick, get_trace
from app.routers.fraud import get_stats as get_dashboard_stats
from app.routers.chat import handle_chat, ChatRequest

# For simplicity, we reuse the same SECRET_KEY and ALGORITHM
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

# SDK uses its own bearer token schema
sdk_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/sdk/v1/auth/login")

def get_current_sdk_client(token: str = Depends(sdk_oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None or not sub.startswith("sdk|"):
            raise HTTPException(status_code=401, detail="Invalid SDK token")
        return {"client_id": sub.split("|")[1]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid SDK token")

router = APIRouter(tags=["sdk-operations"], dependencies=[Depends(get_current_sdk_client)])

class ChatMessagePayload(BaseModel):
    message: str
    
class NarrativeRequestPayload(BaseModel):
    focused_pattern: Optional[str] = None
    all_patterns: List[str] = []
    shap_features: List[str] = []

@router.post("/analyze-transaction")
async def analyze_transaction(account_id: str, background_tasks: BackgroundTasks):
    return await get_score(account_id, background_tasks)

@router.post("/generate-commentary")
async def generate_commentary(account_id: str, body: NarrativeRequestPayload):
    from app.routers.fraud import get_narrative
    return await get_narrative(account_id, body)

@router.get("/track-funds")
async def track_funds(account_id: str, hint: str = ""):
    return await get_trace(account_id, hint)

@router.post("/detect-fraud")
async def detect_fraud(account_id: str, background_tasks: BackgroundTasks):
    # This can be the same as analyze-transaction for now
    return await get_score(account_id, background_tasks)

@router.get("/alerts")
async def get_alerts(limit: int = 200, branch_code: Optional[str] = None):
    # Pass a dummy admin user to bypass frontend-specific role checks in the business logic
    dummy_admin_user = {"role": "Admin"}
    return await get_alerts_quick(limit, branch_code, dummy_admin_user)

@router.get("/stats")
async def get_stats(branch_code: Optional[str] = None):
    dummy_admin_user = {"role": "Admin"}
    return await get_dashboard_stats(branch_code, dummy_admin_user)

@router.post("/chat")
async def sdk_chat(body: ChatMessagePayload):
    req = ChatRequest(message=body.message)
    dummy_admin_user = {"role": "Admin"}
    return await handle_chat(req, dummy_admin_user)

