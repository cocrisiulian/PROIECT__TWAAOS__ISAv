from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class FacultyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    short_name: Optional[str] = None


class FacultyCreate(BaseModel):
    name: str
    short_name: Optional[str] = None


class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    faculty_id: int


class DepartmentCreate(BaseModel):
    name: str
    faculty_id: int


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    color_hex: Optional[str] = None


class CategoryCreate(BaseModel):
    name: str
    color_hex: Optional[str] = "#3B82F6"
