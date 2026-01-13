from pydantic import BaseModel, conlist
from typing import List, Optional, Annotated
from datetime import datetime

class CharacterBase(BaseModel):
    name: str
    movie: str
    chat_style: str
    example_responses: Annotated[List[str], conlist(str, min_length=1, max_length=10)]

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    movie: Optional[str] = None
    chat_style: Optional[str] = None
    example_responses: Optional[Annotated[List[str], conlist(str, min_length=1, max_length=10)]] = None
    updated_at: datetime = datetime.utcnow()

class Character(CharacterBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CharacterWithMessages(Character):
    messages: List['ChatMessage'] = []

    class Config:
        from_attributes = True

# Add this at the end of the file to resolve forward references
from .chat import ChatMessage
CharacterWithMessages.model_rebuild()