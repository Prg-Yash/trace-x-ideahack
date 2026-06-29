import sys
import warnings
from pathlib import Path

# Silence the parallel thread propagation warnings from scikit-learn/joblib
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn.utils.parallel")
warnings.filterwarnings("ignore", message=".*propagate the scikit-learn configuration.*")
warnings.filterwarnings("ignore", message=".*feature names.*")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, schema, fraud, data, demo, auth
from app.core.config import settings
from app.core.websockets import manager

ROOT_DIR = Path(__file__).resolve().parents[3]
AI_ML_DIR = ROOT_DIR / "apps" / "ai-ml"
if str(AI_ML_DIR) not in sys.path:
    sys.path.append(str(AI_ML_DIR))

from fraud_detector import (
    score_account,
    detect_layering,
    get_account_ids,
    explain_dormant,
    explain_smurfing,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(schema.router, prefix=settings.API_V1_STR)
app.include_router(fraud.router, prefix=settings.API_V1_STR)
app.include_router(data.router, prefix=settings.API_V1_STR)
app.include_router(demo.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth")


@app.get("/")
def read_root():
    return {"message": "Welcome to the TRACE-X Platform API"}



@app.websocket(f"{settings.API_V1_STR}/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
