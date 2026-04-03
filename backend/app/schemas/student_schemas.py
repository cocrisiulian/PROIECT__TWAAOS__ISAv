import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class StudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
