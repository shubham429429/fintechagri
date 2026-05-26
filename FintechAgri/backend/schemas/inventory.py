"""Pydantic v2 schemas for inventory, posts, and comments."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# ── Inventory Schemas ────────────────────────────────────────────────────────


class InventoryCreate(BaseModel):
    """Schema for adding a new inventory item."""

    crop: str
    quantity_quintals: float
    grade: Optional[str] = None
    storage_location: str = "On Farm"
    harvest_date: Optional[date] = None
    estimated_value: Optional[float] = None


class InventoryUpdate(BaseModel):
    """Schema for updating an inventory item — all fields optional."""

    crop: Optional[str] = None
    quantity_quintals: Optional[float] = None
    grade: Optional[str] = None
    storage_location: Optional[str] = None
    harvest_date: Optional[date] = None
    estimated_value: Optional[float] = None


class InventoryResponse(BaseModel):
    """Full inventory item response."""

    id: int
    user_id: int
    crop: str
    quantity_quintals: float
    grade: Optional[str] = None
    storage_location: str = "On Farm"
    harvest_date: Optional[date] = None
    estimated_value: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventorySummary(BaseModel):
    """Aggregate inventory summary for a user."""

    total_items: int
    total_quantity: float
    total_value: float
    items_by_crop: dict[str, float]


# ── Post / Comment Schemas ───────────────────────────────────────────────────


class PostCreate(BaseModel):
    """Schema for creating a community post."""

    content: str
    category: str = "general"


class PostResponse(BaseModel):
    """Community post response including author name."""

    id: int
    user_id: int
    author_name: str = ""
    content: str
    category: str
    likes_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    """Schema for adding a comment."""

    content: str


class CommentResponse(BaseModel):
    """Comment response including author name."""

    id: int
    post_id: int
    user_id: int
    author_name: str = ""
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
