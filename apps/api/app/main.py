import sys
import warnings
from pathlib import Path

# Silence the parallel thread propagation warnings from scikit-learn/joblib
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn.utils.parallel")
warnings.filterwarnings("ignore", message=".*propagate the scikit-learn configuration.*")
warnings.filterwarnings("ignore", message=".*feature names.*")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, schema, fraud, data, demo, stream, auth, workflow
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
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.broker import get_active_broker
    from app.services.stream_simulator import FirehoseProducer, StreamConsumer
    import app.services.stream_simulator as stream_sim
    
    # Init broker
    active_broker = await get_active_broker()
    # Init instances
    stream_sim.producer_instance = FirehoseProducer(active_broker)
    stream_sim.consumer_instance = StreamConsumer(active_broker)
    
    try:
        yield
    finally:
        # Cleanup
        if stream_sim.producer_instance:
            await stream_sim.producer_instance.stop()
        if stream_sim.consumer_instance:
            await stream_sim.consumer_instance.stop()
        await active_broker.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
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
app.include_router(stream.router, prefix=f"{settings.API_V1_STR}/stream")
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth")
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/alerts")


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
