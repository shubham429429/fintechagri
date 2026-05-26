"""User profile endpoints."""

import json
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserUpdate
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    """Return the authenticated user's profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update the authenticated user's profile fields."""
    update_data = payload.model_dump(exclude_unset=True)

    if "crops" in update_data and update_data["crops"] is not None:
        update_data["crops"] = json.dumps(update_data["crops"])

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user
