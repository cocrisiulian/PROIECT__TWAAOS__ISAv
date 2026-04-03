from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    color_hex = Column(String(7), nullable=True, default="#3B82F6")

    events = relationship("Event", back_populates="category")
