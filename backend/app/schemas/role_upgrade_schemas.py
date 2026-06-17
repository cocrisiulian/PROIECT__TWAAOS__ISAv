from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class RoleType(str, Enum):
    student = "student"
    organizer = "organizer"


class RoleUpgradeRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class CreateRoleUpgradeRequest(BaseModel):
    """Request body to create a role upgrade request"""
    requested_role: RoleType
    reason: Optional[str] = Field(None, max_length=1000)


class RoleUpgradeRequestRead(BaseModel):
    """Response for a single role upgrade request"""
    id: str
    user_id: str
    requested_role: str
    status: str
    reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoleUpgradeRequestDetailRead(RoleUpgradeRequestRead):
    """Detailed response with user and reviewer info"""
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    user_username: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    decision_reason: Optional[str] = None


class ApproveRoleUpgradeRequest(BaseModel):
    """Request body to approve a role upgrade request"""
    decision_reason: Optional[str] = Field(None, max_length=500)


class RejectRoleUpgradeRequest(BaseModel):
    """Request body to reject a role upgrade request"""
    decision_reason: str = Field(..., max_length=500)


class RoleUpgradeRequestList(BaseModel):
    """List of role upgrade requests"""
    total: int
    requests: list[RoleUpgradeRequestDetailRead]
