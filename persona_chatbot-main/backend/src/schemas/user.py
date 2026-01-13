from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class UserOut(UserBase):
    id: int
    username: str
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True