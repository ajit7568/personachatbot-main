from sqlalchemy import Column, Integer, String, JSON, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Character(Base):
    __tablename__ = 'characters'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    movie = Column(String, nullable=False, index=True)
    chat_style = Column(String, nullable=False)
    example_responses = Column(JSON, nullable=False)
    genre = Column(String, nullable=True, index=True)
    source = Column(String, nullable=True, default='local', index=True)  # 'local', 'tmdb', 'anilist', 'openlibrary', 'wikipedia', 'generated'
    image_url = Column(String, nullable=True)
    external_id = Column(String, nullable=True)  # For storing TMDB/AniList/OpenLibrary IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add unique constraint for name and movie combination
    __table_args__ = (
        UniqueConstraint('name', 'movie', name='uq_character_name_movie'),
    )

    # Relationship to favorites
    favorites = relationship("UserCharacterFavorite", back_populates="character", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Character(name='{self.name}', movie='{self.movie}')>"


class UserCharacterFavorite(Base):
    __tablename__ = 'user_character_favorites'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey('characters.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="character_favorites")
    character = relationship("Character", back_populates="favorites")

    # Unique constraint to prevent duplicate favorites
    __table_args__ = (
        UniqueConstraint('user_id', 'character_id', name='uq_user_character_favorite'),
    )

    def __repr__(self):
        return f"<UserCharacterFavorite(user_id={self.user_id}, character_id={self.character_id})>"