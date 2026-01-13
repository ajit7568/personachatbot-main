from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Chat(Base):
    __tablename__ = 'chats'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    character_id = Column(Integer, ForeignKey('characters.id'), index=True)
    message = Column(String, nullable=True)
    is_bot = Column(Boolean, nullable=True, default=False)
    timestamp = Column(DateTime, server_default=func.now())
    chat_session = Column(String, nullable=True, index=True)

    def __repr__(self):
        return f"<Chat(id={self.id}, user_id={self.user_id}, character_id={self.character_id}, message='{self.message}', is_bot={self.is_bot}, timestamp={self.timestamp}, chat_session='{self.chat_session}')>"