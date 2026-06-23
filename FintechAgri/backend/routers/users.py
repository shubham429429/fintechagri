"""User profile endpoints — profile CRUD, photo upload, and GPS location."""

import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserUpdate
from services.auth_service import get_current_user
from services.upload_service import save_profile_photo, validate_image

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


@router.post("/location", response_model=UserResponse)
def update_location(
    lat: float,
    lng: float,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update the authenticated user's GPS coordinates."""
    if not (-90 <= lat <= 90):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Latitude must be between -90 and 90",
        )
    if not (-180 <= lng <= 180):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Longitude must be between -180 and 180",
        )

    current_user.latitude = lat
    current_user.longitude = lng
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/photo", response_model=UserResponse)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Upload a profile photo for the authenticated user."""
    # Read file content
    content = await file.read()

    # Validate
    error = validate_image(file.filename or "", len(content))
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Save and update user
    url = await save_profile_photo(current_user.id, content, file.filename or "photo.jpg")
    current_user.profile_photo_url = url
    db.commit()
    db.refresh(current_user)
    return current_user
