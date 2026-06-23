"""Market data endpoints — prices, history, crop list, summaries, volatility, and alerts."""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from schemas.market import CropSummary, MarketPriceResponse
from models.market import MarketPrice
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


# ── New Phase 1 Endpoints ───────────────────────────────────────────────────


@router.get("/volatility/{crop}")
def price_volatility(
    crop: str,
    mandi: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90, description="Window for volatility calculation"),
    db: Session = Depends(get_db),
):
    """Calculate price volatility (coefficient of variation) for a crop.

    Returns: mean, std_dev, volatility_pct, trend, data_points
    """
    since = date.today() - timedelta(days=days)
    query = db.query(MarketPrice.price_close).filter(
        MarketPrice.crop == crop,
        MarketPrice.date >= since,
        MarketPrice.price_close.isnot(None),
    )
    if mandi:
        query = query.filter(MarketPrice.mandi == mandi)

    prices = [row[0] for row in query.all()]

    if len(prices) < 2:
        return {
            "crop": crop,
            "mandi": mandi,
            "days": days,
            "mean_price": prices[0] if prices else None,
            "std_dev": 0,
            "volatility_pct": 0,
            "trend": "insufficient_data",
            "data_points": len(prices),
        }

    import statistics

    mean_price = statistics.mean(prices)
    std_dev = statistics.stdev(prices)
    volatility_pct = (std_dev / mean_price) * 100 if mean_price > 0 else 0

    # Determine trend using first vs last half comparison
    mid = len(prices) // 2
    first_half_avg = statistics.mean(prices[:mid]) if mid > 0 else mean_price
    second_half_avg = statistics.mean(prices[mid:])
    change = ((second_half_avg - first_half_avg) / first_half_avg) * 100 if first_half_avg else 0

    if change > 3:
        trend = "up"
    elif change < -3:
        trend = "down"
    else:
        trend = "stable"

    return {
        "crop": crop,
        "mandi": mandi,
        "days": days,
        "mean_price": round(mean_price, 2),
        "std_dev": round(std_dev, 2),
        "volatility_pct": round(volatility_pct, 2),
        "trend": trend,
        "data_points": len(prices),
    }


@router.get("/alerts")
def market_alerts(db: Session = Depends(get_db)):
    """Detect oversupply/shortage conditions across all crops and mandis.

    Oversupply: today's arrivals > 120% of 7-day average
    Shortage: today's arrivals < 80% of 7-day average
    """
    today = date.today()
    seven_days_ago = today - timedelta(days=7)

    # Get today's arrivals by crop + mandi
    today_arrivals = (
        db.query(
            MarketPrice.crop,
            MarketPrice.mandi,
            func.sum(MarketPrice.arrivals_quintals).label("today_arrivals"),
        )
        .filter(MarketPrice.date == today)
        .group_by(MarketPrice.crop, MarketPrice.mandi)
        .all()
    )

    # Get 7-day average arrivals by crop + mandi
    avg_arrivals = (
        db.query(
            MarketPrice.crop,
            MarketPrice.mandi,
            func.avg(MarketPrice.arrivals_quintals).label("avg_arrivals"),
        )
        .filter(
            MarketPrice.date >= seven_days_ago,
            MarketPrice.date < today,
        )
        .group_by(MarketPrice.crop, MarketPrice.mandi)
        .all()
    )

    # Build lookup
    avg_lookup = {(r.crop, r.mandi): r.avg_arrivals for r in avg_arrivals}

    alerts = []
    for row in today_arrivals:
        avg = avg_lookup.get((row.crop, row.mandi))
        if avg is None or avg == 0:
            continue

        ratio = row.today_arrivals / avg
        if ratio > 1.2:
            alerts.append({
                "type": "oversupply",
                "severity": "high" if ratio > 1.5 else "medium",
                "crop": row.crop,
                "mandi": row.mandi,
                "today_arrivals": round(row.today_arrivals, 1),
                "avg_7d_arrivals": round(avg, 1),
                "ratio": round(ratio, 2),
                "message": f"⚠️ Oversupply: {row.crop} arrivals at {row.mandi} are {ratio:.0%} of average",
            })
        elif ratio < 0.8:
            alerts.append({
                "type": "shortage",
                "severity": "high" if ratio < 0.5 else "medium",
                "crop": row.crop,
                "mandi": row.mandi,
                "today_arrivals": round(row.today_arrivals, 1),
                "avg_7d_arrivals": round(avg, 1),
                "ratio": round(ratio, 2),
                "message": f"📈 Shortage: {row.crop} at {row.mandi} — prices may rise (arrivals at {ratio:.0%} of avg)",
            })

    alerts.sort(key=lambda x: abs(1 - x["ratio"]), reverse=True)
    return alerts


@router.get("/trend/{crop}")
def market_trend(
    crop: str,
    days: int = Query(7, ge=1, le=90),
    mandi: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return moving average trend data for a crop."""
    since = date.today() - timedelta(days=days + 7)  # Extra 7 days for MA calculation

    query = (
        db.query(MarketPrice.date, func.avg(MarketPrice.price_close).label("avg_price"))
        .filter(
            MarketPrice.crop == crop,
            MarketPrice.date >= since,
            MarketPrice.price_close.isnot(None),
        )
    )
    if mandi:
        query = query.filter(MarketPrice.mandi == mandi)

    daily_prices = (
        query.group_by(MarketPrice.date)
        .order_by(MarketPrice.date.asc())
        .all()
    )

    if not daily_prices:
        return {"crop": crop, "trend_data": [], "direction": "insufficient_data"}

    prices = [{"date": str(row.date), "price": round(row.avg_price, 2)} for row in daily_prices]

    # Calculate 7-day moving average
    price_values = [row.avg_price for row in daily_prices]
    ma_data = []
    for i in range(len(price_values)):
        window = price_values[max(0, i - 6) : i + 1]
        ma_data.append(round(sum(window) / len(window), 2))

    # Overall direction
    if len(ma_data) >= 2:
        change = ((ma_data[-1] - ma_data[0]) / ma_data[0]) * 100 if ma_data[0] else 0
        direction = "up" if change > 2 else "down" if change < -2 else "stable"
    else:
        direction = "stable"

    trend_data = [
        {"date": prices[i]["date"], "price": prices[i]["price"], "moving_avg": ma_data[i]}
        for i in range(len(prices))
    ]

    return {
        "crop": crop,
        "mandi": mandi,
        "days": days,
        "direction": direction,
        "trend_data": trend_data,
    }
