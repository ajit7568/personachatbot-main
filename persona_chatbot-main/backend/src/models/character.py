from sqlalchemy import Column, Integer, String, JSON, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base

class Character(Base):
    __tablename__ = 'characters'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    movie = Column(String, nullable=False, index=True)
    chat_style = Column(String, nullable=False)
    example_responses = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add unique constraint for name and movie combination
    __table_args__ = (
        UniqueConstraint('name', 'movie', name='uq_character_name_movie'),
    )

    def __repr__(self):
        return f"<Character(name='{self.name}', movie='{self.movie}')>"