"""Prediction endpoints — forecasts, recommendations, and market predictions."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth_service import get_current_user
from services.prediction_service import (
    generate_price_forecast,
    generate_recommendation,
    get_mandi_forecast,
)

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


@router.get("/{mandi}")
def get_mandi_predictions(
    mandi: str,
    db: Session = Depends(get_db),
):
    """Get 7-day price forecasts for all crops at a mandi."""
    result = get_mandi_forecast(db, mandi)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No forecast data available for mandi '{mandi}'",
        )
    return result


@router.get("/{mandi}/{crop}")
def get_crop_prediction(
    mandi: str,
    crop: str,
    days: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    db: Session = Depends(get_db),
):
    """Get price forecast for a specific crop at a mandi."""
    forecast = generate_price_forecast(db, crop, mandi, days=days)
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Not enough historical data for {crop} at {mandi}",
        )
    return {"crop": crop, "mandi": mandi, "forecasts": forecast}


@router.get("/recommendation/{farmer_id}")
def get_farmer_recommendation(
    farmer_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get personalised sell/hold recommendations for a farmer."""
    # Only allow requesting own recommendations (or could be admin)
    if current_user.id != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only request recommendations for your own profile",
        )
    recommendations = generate_recommendation(db, farmer_id)
    return {"farmer_id": farmer_id, "recommendations": recommendations}
