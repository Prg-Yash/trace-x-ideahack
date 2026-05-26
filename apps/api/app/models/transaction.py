from pydantic import BaseModel
from datetime import datetime

class Transaction(BaseModel):
    txn_id: str
    sender_id: str
    receiver_id: str
    amount: float
    channel: str
    txn_ts: datetime
    status: str
    narration: str
