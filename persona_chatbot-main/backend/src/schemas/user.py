from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class TokenRefresh(BaseModel):
    refresh_token: str


class SetPasswordRequest(BaseModel):
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        # No maximum length - passwords of any length are supported
        # (passwords > 72 bytes are automatically pre-hashed with SHA-256)
        return v

    @field_validator('confirm_password')
    @classmethod
    def validate_confirm_password(cls, v: str) -> str:
        # No maximum length - passwords of any length are supported
        return v


class UserOut(UserBase):
    id: int
    username: str
    is_active: bool
    is_superuser: bool
    has_password: bool

    class Config:
        from_attributes = True