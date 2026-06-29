from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Any

from app.services.websocket_manager import ws_manager

router = APIRouter()

class InjectPatternRequest(BaseModel):
    pattern: str

class StreamConfigRequest(BaseModel):
    tps: int

@router.get("/status")
async def stream_status():
    from app.services.stream_simulator import producer_instance
    is_running = producer_instance._running if producer_instance else False
    return {"is_running": is_running}

@router.post("/start")
async def start_stream():
    from app.services.stream_simulator import producer_instance, consumer_instance
    if producer_instance:
        await producer_instance.start()
    if consumer_instance:
        await consumer_instance.start()
    return {"status": "ok", "message": "Stream started"}

@router.post("/stop")
async def stop_stream():
    from app.services.stream_simulator import producer_instance, consumer_instance
    if producer_instance:
        await producer_instance.stop()
    if consumer_instance:
        await consumer_instance.stop()
    return {"status": "ok", "message": "Stream stopped"}

@router.post("/inject")
async def inject_fraud(request: InjectPatternRequest):
    from app.services.stream_simulator import producer_instance
    if producer_instance:
        await producer_instance.inject_pattern(request.pattern)
    return {"status": "ok", "message": f"Injected pattern: {request.pattern}"}

@router.post("/config")
async def config_stream(request: StreamConfigRequest):
    from app.services.stream_simulator import producer_instance
    if producer_instance:
        producer_instance.set_tps(request.tps)
    return {"status": "ok", "message": f"TPS updated to {request.tps}"}

@router.delete("/reset")
async def reset_demo_data():
    from app.db.session import get_db
    driver = get_db()
    if driver:
        try:
            # Clear Neo4j
            with driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    return {"status": "ok", "message": "Demo data reset successfully"}

@router.websocket("/ws")
async def websocket_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    
    # Tell the frontend which broker is active
    from app.services import stream_simulator as sim
    broker_mode = "kafka" if sim.producer_instance and \
        sim.producer_instance.broker.__class__.__name__ == "KafkaBroker" \
        else "memory"
    await websocket.send_json({"type": "broker_status", "mode": broker_mode})
    
    try:
        while True:
            # We don't really expect client to send us things, but we need to keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
