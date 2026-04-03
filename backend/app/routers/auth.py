from datetime import datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
    create_action_token,
    decode_action_token,
)
from app.core.dependencies import get_current_user_payload
from app.models.user import User, UserRole
from app.models.student import Student
from app.schemas.auth_schemas import (
    Token,
    LoginRequest,
    SignupRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequestResponse,
    GoogleCallbackRequest,
    UserInfo,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def build_user_info_from_staff(user: User) -> UserInfo:
    return UserInfo(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        username=user.username,
    )


def build_user_info_from_student(student: Student) -> UserInfo:
    return UserInfo(
        id=str(student.id),
        email=student.email,
        full_name=student.full_name,
        role="student",
        avatar_url=student.avatar_url,
    )


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    login_identifier = body.username.strip()
    user = db.query(User).filter(
        (User.username == login_identifier.lower()) | (User.email == login_identifier)
    ).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    if user.role == UserRole.visitor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account role is visitor. Ask an administrator to assign organizer/admin access.",
        )

    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(
        access_token=token,
        role=user.role.value,
        user=build_user_info_from_staff(user),
    )


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    username = body.username.strip().lower()
    email = body.email.strip().lower()

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        username=username,
        email=email,
        full_name=body.full_name.strip(),
        hashed_password=hash_password(body.password),
        role=UserRole.visitor,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(access_token=token, role=user.role.value, user=build_user_info_from_staff(user))


@router.post("/logout")
def logout():
    return {"detail": "Logged out successfully"}


@router.post("/password/forgot", response_model=PasswordResetRequestResponse)
def request_password_reset(body: PasswordResetRequest, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    reset_token = None
    if user and user.is_active:
        reset_token = create_action_token(
            "reset_password",
            {"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES),
        )

    response = PasswordResetRequestResponse(
        detail="If the account exists, a password reset link has been generated.",
    )
    if reset_token and settings.EXPOSE_RESET_TOKEN_FOR_TESTING:
        response.reset_token = reset_token

    return response


@router.post("/password/reset")
def reset_password(body: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    payload = decode_action_token(body.token, "reset_password")
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user_id = payload.get("sub")
    email = payload.get("email")
    user = db.query(User).filter(User.id == user_id, User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(body.new_password)
    db.commit()

    return {"detail": "Password reset successfully"}


@router.get("/google/url")
def google_auth_url():
    """Returns the Google OAuth2 authorization URL for the frontend to redirect to."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    state = create_action_token(
        "google_oauth_state",
        {"provider": "google"},
        expires_delta=timedelta(minutes=10),
    )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return {"url": url, "state": state}


@router.post("/google/callback", response_model=Token)
async def google_callback(body: GoogleCallbackRequest, db: Session = Depends(get_db)):
    payload = decode_action_token(body.state, "google_oauth_state")
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": body.code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code with Google")

    token_data = token_resp.json()
    access_token = token_data.get("access_token")

    # Get user info
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    userinfo = userinfo_resp.json()
    email = userinfo.get("email", "").strip().lower()
    sub = userinfo.get("sub", "")
    name = userinfo.get("name", "")
    picture = userinfo.get("picture", "")
    verified_email = bool(userinfo.get("email_verified", False))

    if not email or not sub:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google profile data")

    if not verified_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Google email is not verified")

    if not email.endswith("@student.usv.ro"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only @student.usv.ro accounts are allowed",
        )

    # Upsert student
    student = db.query(Student).filter((Student.google_sub == sub) | (Student.email == email)).first()
    if not student:
        student = Student(
            email=email,
            full_name=name,
            google_sub=sub,
            avatar_url=picture,
            last_login_at=datetime.utcnow(),
        )
        db.add(student)
    else:
        student.email = email
        student.full_name = name
        student.google_sub = sub
        student.avatar_url = picture
        student.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(student)

    our_token = create_access_token(
        {"sub": str(student.id), "role": "student"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=our_token, role="student", user=build_user_info_from_student(student))


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    role = payload.get("role")
    user_id = payload.get("sub")

    if role in ("organizer", "admin", "visitor"):
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
        return build_user_info_from_staff(user)

    if role == "student":
        student = db.query(Student).filter(Student.id == user_id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Student not found")
        return build_user_info_from_student(student)

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unsupported account role")
