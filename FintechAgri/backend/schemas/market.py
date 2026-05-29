"""Pydantic v2 schemas for market prices and dashboard."""

from datetime import date
from typing import Optional

from pydantic import BaseModel


class MarketPriceResponse(BaseModel):
    """Single market-price row."""

    id: int
    mandi: str
    crop: str
    price_open: Optional[float] = None
    price_close: Optional[float] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    arrivals_quintals: Optional[float] = None
    date: date
    state: Optional[str] = None

    model_config = {"from_attributes": True}


class MarketPriceList(BaseModel):
    """Paginated list of market prices."""

    items: list[MarketPriceResponse]
    total: int


class CropSummary(BaseModel):
    """Aggregated summary for a single crop."""

    crop: str
    latest_price: Optional[float] = None
    price_change_pct: Optional[float] = None
    avg_price_7d: Optional[float] = None
    total_arrivals_today: Optional[float] = None


class CropPriceInfo(BaseModel):
    """Best-price info surfaced on the dashboard."""

    crop: str
    price: float
    mandi: str


class DashboardSummary(BaseModel):
    """KPI payload returned to the dashboard."""

    total_stock_value: float = 0.0
    best_price_today: Optional[CropPriceInfo] = None
    market_trend: str = "stable"  # 'up' | 'down' | 'stable'
    crops_tracked: int = 0
    recommendation: str = ""
    total_arrivals_today: dict[str, float] = {}
    nearby_produce_summary: list[dict] = []
