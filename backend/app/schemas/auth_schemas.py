from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserInfo(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: Optional[UserInfo] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetRequestResponse(BaseModel):
    detail: str
    reset_token: Optional[str] = None


class GoogleCallbackRequest(BaseModel):
    code: str
    state: str
