from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter(tags=["sdk-auth"])

class SDKAuthRequest(BaseModel):
    apiKey: str
    clientId: str

class SDKAuthResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=SDKAuthResponse)
async def sdk_login(request: SDKAuthRequest):
    # Dummy validation for SDK authentication
    if not request.apiKey or not request.clientId:
        raise HTTPException(status_code=401, detail="Invalid API Key or Client ID")
    
    # In a real system, you'd validate against a database of SDK clients.
    # We issue a JWT token with "SDK_CLIENT" as the subject/role.
    access_token = create_access_token(
        subject=f"sdk|{request.clientId}"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
