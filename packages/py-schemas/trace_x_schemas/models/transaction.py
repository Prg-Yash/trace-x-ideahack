from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator

class Transaction(BaseModel):
    txn_id: str
    sender_id: str
    receiver_id: str
    amount: float = Field(..., ge=0.0, description="Transaction amount cannot be negative.")
    channel: str
    txn_ts: datetime
    status: str
    narration: str

    @field_validator("txn_ts")
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        # Ensure the timestamp doesn't exceed current time + small buffer for drift
        now = datetime.now(v.tzinfo if v.tzinfo else timezone.utc)
        # If naive, make it aware to compare correctly, or just compare naive
        if v.tzinfo is None:
            now = datetime.now()
        
        if v > now:
            raise ValueError(f"txn_ts {v} is in the future. Cannot process future-dated graphs.")
        return v
