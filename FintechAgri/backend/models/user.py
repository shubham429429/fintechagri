"""User ORM model."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    farm_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    pin_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    crops: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string e.g. '["Onion","Tomato"]'
    farm_size_acres: Mapped[float | None] = mapped_column(Float, nullable=True)
    preferred_mandi: Mapped[str | None] = mapped_column(String(100), nullable=True)
    storage_capacity_quintals: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    inventory = relationship("Inventory", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', phone='{self.phone}')>"
