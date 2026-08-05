import os
import signal
import threading
from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["health"])
def health_check():
    """
    Health check endpoint to ensure the API is running.
    """
    return {
        "status": "ok",
        "data_center": os.environ.get("DATA_CENTER", "local")
    }

@router.post("/health/crash", tags=["health"])
def simulate_crash():
    """
    Simulates a critical failure by crashing the container.
    """
    def die():
        os.kill(os.getpid(), signal.SIGTERM)
    
    # Delay the kill slightly so the HTTP response can be sent
    threading.Timer(0.5, die).start()
    return {"status": "crashing", "data_center": os.environ.get("DATA_CENTER", "local")}
