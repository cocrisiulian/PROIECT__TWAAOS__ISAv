import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import settings
from app.database import Base, engine
from app.core.hardening import (
    get_allowed_hosts,
    should_redirect_https,
    validate_production_settings,
)
from app.routers import health
from app.routers import auth, public, export, organizer, admin, account, github
from app.migrate_student_profile_fields import migrate as migrate_student_profile_fields
from app.seed import seed

# Import all models so Base knows about them for create_all
import app.models  # noqa: F401
from app.models.role_upgrade_request import RoleUpgradeRequest  # noqa: F401

migrate_student_profile_fields()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
)


@app.on_event("startup")
def startup_validate_security():
    """Fail fast when production settings are unsafe."""
    validate_production_settings()


@app.on_event("startup")
def startup_seed():
    """Seed the database with initial data on startup"""
    seed()


if should_redirect_https():
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=get_allowed_hosts(),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://frontend:5173", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(public.router, prefix=settings.API_PREFIX)
app.include_router(export.router, prefix=settings.API_PREFIX)
app.include_router(organizer.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(account.router, prefix=settings.API_PREFIX)
app.include_router(github.router, prefix=settings.API_PREFIX)
