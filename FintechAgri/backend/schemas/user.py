"""Pydantic v2 schemas for users and authentication."""

import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator


# ── Request Schemas ──────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Schema for new user registration."""

    name: str
    phone: str
    password: str
    farm_location: Optional[str] = None
    pin_code: Optional[str] = None
    crops: Optional[list[str]] = None
    farm_size_acres: Optional[float] = None
    preferred_mandi: Optional[str] = None
    storage_capacity_quintals: float = 0


class UserLogin(BaseModel):
    """Schema for login credentials."""

    phone: str
    password: str


class UserUpdate(BaseModel):
    """Schema for profile updates — every field is optional."""

    name: Optional[str] = None
    farm_location: Optional[str] = None
    pin_code: Optional[str] = None
    crops: Optional[list[str]] = None
    farm_size_acres: Optional[float] = None
    preferred_mandi: Optional[str] = None
    storage_capacity_quintals: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ── Response Schemas ─────────────────────────────────────────────────────────


class UserResponse(BaseModel):
    """Schema returned for user profile data."""

    id: int
    name: str
    phone: str
    farm_location: Optional[str] = None
    pin_code: Optional[str] = None
    crops: Optional[list[str]] = None
    farm_size_acres: Optional[float] = None
    preferred_mandi: Optional[str] = None
    storage_capacity_quintals: float = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_photo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def parse_crops_json(cls, data: object) -> object:
        """Convert the JSON string stored in the DB to a Python list."""
        # Handle ORM objects
        if hasattr(data, "crops"):
            raw = data.crops
            if isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                    # For ORM objects we can't set attrs directly, so convert to dict
                    d = {
                        "id": data.id,
                        "name": data.name,
                        "phone": data.phone,
                        "farm_location": data.farm_location,
                        "pin_code": data.pin_code,
                        "crops": parsed,
                        "farm_size_acres": data.farm_size_acres,
                        "preferred_mandi": data.preferred_mandi,
                        "storage_capacity_quintals": data.storage_capacity_quintals,
                        "latitude": getattr(data, "latitude", None),
                        "longitude": getattr(data, "longitude", None),
                        "profile_photo_url": getattr(data, "profile_photo_url", None),
                        "created_at": data.created_at,
                    }
                    return d
                except (json.JSONDecodeError, TypeError):
                    pass
        # Handle dicts
        if isinstance(data, dict) and "crops" in data:
            raw = data["crops"]
            if isinstance(raw, str):
                try:
                    data["crops"] = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    data["crops"] = None
        return data


# ── Auth Schemas ─────────────────────────────────────────────────────────────


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Payload extracted from a JWT."""

    user_id: int
