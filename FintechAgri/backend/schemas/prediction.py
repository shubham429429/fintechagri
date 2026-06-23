"""Pydantic v2 schemas for predictions and forecasts."""

from datetime import date
from typing import Optional

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    """Single prediction/forecast record."""

    id: int
    mandi: str
    crop: str
    forecast_date: date
    predicted_arrivals: Optional[float] = None
    predicted_price_min: Optional[float] = None
    predicted_price_max: Optional[float] = None
    predicted_price_modal: Optional[float] = None
    confidence_score: Optional[float] = None
    recommendation: Optional[str] = None  # sell / hold / wait
    explanation: Optional[str] = None
    model_version: str = "baseline_v1"

    model_config = {"from_attributes": True}


class FarmerRecommendation(BaseModel):
    """Personalised sell/hold recommendation for a farmer."""

    crop: str
    recommendation: str  # SELL / HOLD / WAIT
    confidence: float
    explanation: str
    best_mandi: Optional[str] = None
    expected_price: Optional[float] = None
    price_trend: str = "stable"  # up / down / stable
    days_to_peak: Optional[int] = None
