from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatMessageBase(BaseModel):
    message: str
    user_id: int
    character_id: Optional[int] = None

class ChatMessage(ChatMessageBase):
    pass

class ChatResponse(BaseModel):
    response: str

class ChatSchema(ChatMessageBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True