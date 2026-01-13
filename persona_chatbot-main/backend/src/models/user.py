from sqlalchemy import Column, Integer, String, Boolean
from ..database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for Google OAuth users
    google_id = Column(String, unique=True, nullable=True, index=True)  # Google user ID
    auth_provider = Column(String, default='email')  # 'email' or 'google'
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    refresh_token = Column(String, nullable=True)  # New field for refresh token