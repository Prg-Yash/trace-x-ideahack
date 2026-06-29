from fastapi import WebSocket
import asyncio

class WebSocketManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()
    
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.add(ws)
    
    def disconnect(self, ws: WebSocket):
        self.active_connections.discard(ws)
    
    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        
        dead = set()
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)  # connection dropped
        
        self.active_connections -= dead  # clean up dead connections

# Singleton — import this everywhere
ws_manager = WebSocketManager()
