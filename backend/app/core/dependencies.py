from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.models.student import Student

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload


def get_current_user(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
) -> User:
    user_id = payload.get("sub")
    role = payload.get("role")
    if role not in ("organizer", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a staff user")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_organizer(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.organizer, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer access required")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def get_current_student(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
) -> Student:
    student_id = payload.get("sub")
    role = payload.get("role")
    if role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Student not found")
    return student


def get_optional_student(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Returns student if authenticated, None otherwise."""
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or payload.get("role") != "student":
        return None
    return db.query(Student).filter(Student.id == payload.get("sub")).first()
