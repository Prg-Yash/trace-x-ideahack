from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.graph_rag import process_chat_query
from app.core.deps import get_current_user
from fastapi import Depends

router = APIRouter(tags=["chat"])

class HistoryTurn(BaseModel):
    role: str  # "user" or "ai"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[list[HistoryTurn]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def handle_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    try:
        # Convert history to plain dicts for the graph_rag pipeline
        history = [{"role": t.role, "content": t.content} for t in (request.history or [])]
        # Process the natural language query through the Graph-RAG pipeline
        answer = process_chat_query(request.message, history)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
