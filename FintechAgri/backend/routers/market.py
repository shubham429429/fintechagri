"""Market data endpoints — prices, history, crop list, and summaries."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas.market import CropSummary, MarketPriceResponse
from services.market_service import (
    get_available_crops,
    get_crop_summary,
    get_latest_prices,
    get_price_history,
)

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/prices", response_model=list[MarketPriceResponse])
def list_prices(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    mandi: Optional[str] = Query(None, description="Filter by mandi name"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Return latest market prices, optionally filtered by crop and/or mandi."""
    rows, _total = get_latest_prices(db, crop=crop, mandi=mandi, limit=limit)
    return rows


@router.get("/prices/history", response_model=list[MarketPriceResponse])
def price_history(
    crop: str = Query(..., description="Crop name (required)"),
    days: int = Query(30, ge=1, le=365),
    mandi: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return historical prices for a crop over the given number of days."""
    return get_price_history(db, crop=crop, days=days, mandi=mandi)


@router.get("/crops", response_model=list[str])
def list_crops(db: Session = Depends(get_db)):
    """Return a list of all crops that have price data."""
    return get_available_crops(db)


@router.get("/summary/{crop}", response_model=CropSummary)
def crop_summary(crop: str, db: Session = Depends(get_db)):
    """Return aggregated summary for a specific crop."""
    return get_crop_summary(db, crop)
