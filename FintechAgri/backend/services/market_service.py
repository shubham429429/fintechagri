"""Market data service — price queries, summaries, and dashboard KPIs."""

import json
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from models.inventory import Inventory
from models.market import MarketPrice
from models.user import User
from schemas.market import CropPriceInfo, CropSummary, DashboardSummary


# ── Price Queries ────────────────────────────────────────────────────────────


def get_latest_prices(
    db: Session,
    crop: Optional[str] = None,
    mandi: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
) -> tuple[list[MarketPrice], int]:
    """Return the most-recent market prices, optionally filtered by crop / mandi.

    Returns a tuple of (rows, total_count).
    """
    query = db.query(MarketPrice)
    if crop:
        query = query.filter(MarketPrice.crop.ilike(f"%{crop}%"))
    if mandi:
        query = query.filter(MarketPrice.mandi.ilike(f"%{mandi}%"))
    total = query.count()
    rows = query.order_by(MarketPrice.date.desc(), MarketPrice.crop).offset(skip).limit(limit).all()
    return rows, total


def get_price_history(
    db: Session,
    crop: str,
    days: int = 30,
    mandi: Optional[str] = None,
) -> list[MarketPrice]:
    """Return price history for *crop* over the last *days* days."""
    since = date.today() - timedelta(days=days)
    query = db.query(MarketPrice).filter(
        MarketPrice.crop.ilike(f"%{crop}%"),
        MarketPrice.date >= since,
    )
    if mandi:
        query = query.filter(MarketPrice.mandi.ilike(f"%{mandi}%"))
    return query.order_by(MarketPrice.date.asc(), MarketPrice.mandi).all()


def get_crop_summary(db: Session, crop: str) -> CropSummary:
    """Compute an aggregated summary for *crop*: latest price, 7-day avg,
    price-change %, and today's total arrivals."""
    today = date.today()
    seven_days_ago = today - timedelta(days=7)

    # Latest price (most recent date for this crop)
    latest_row = (
        db.query(MarketPrice)
        .filter(MarketPrice.crop.ilike(f"%{crop}%"))
        .order_by(MarketPrice.date.desc())
        .first()
    )
    latest_price = latest_row.price_close if latest_row else None

    # 7-day average close price
    avg_result = (
        db.query(func.avg(MarketPrice.price_close))
        .filter(
            MarketPrice.crop.ilike(f"%{crop}%"),
            MarketPrice.date >= seven_days_ago,
        )
        .scalar()
    )
    avg_price_7d = round(avg_result, 2) if avg_result else None

    # Price-change %  (latest vs 7-day avg)
    price_change_pct: Optional[float] = None
    if latest_price and avg_price_7d and avg_price_7d != 0:
        price_change_pct = round(((latest_price - avg_price_7d) / avg_price_7d) * 100, 2)

    # Today's total arrivals
    arrivals_today = (
        db.query(func.sum(MarketPrice.arrivals_quintals))
        .filter(
            MarketPrice.crop.ilike(f"%{crop}%"),
            MarketPrice.date == today,
        )
        .scalar()
    )

    return CropSummary(
        crop=crop,
        latest_price=latest_price,
        price_change_pct=price_change_pct,
        avg_price_7d=avg_price_7d,
        total_arrivals_today=arrivals_today,
    )


# ── Dashboard KPIs ───────────────────────────────────────────────────────────


def get_dashboard_summary(db: Session, user: User) -> DashboardSummary:
    """Build a personalised dashboard summary for *user*."""
    today = date.today()
    seven_days_ago = today - timedelta(days=7)

    # ---- total stock value from inventory -----------------------------------
    inv_items = db.query(Inventory).filter(Inventory.user_id == user.id).all()
    total_stock_value = sum(i.estimated_value or 0.0 for i in inv_items)

    # ---- user's tracked crops -----------------------------------------------
    user_crops: list[str] = []
    if user.crops:
        try:
            user_crops = json.loads(user.crops) if isinstance(user.crops, str) else user.crops
        except (json.JSONDecodeError, TypeError):
            pass

    crops_tracked = len(user_crops)

    # ---- best price today for user's crops ----------------------------------
    best_price_today: Optional[CropPriceInfo] = None
    if user_crops:
        best_row = (
            db.query(MarketPrice)
            .filter(
                MarketPrice.crop.in_(user_crops),
                MarketPrice.date == today,
            )
            .order_by(MarketPrice.price_close.desc())
            .first()
        )
        if best_row and best_row.price_close:
            best_price_today = CropPriceInfo(
                crop=best_row.crop,
                price=best_row.price_close,
                mandi=best_row.mandi,
            )

    # ---- market trend (compare today avg vs 7-day avg) ----------------------
    market_trend = "stable"
    if user_crops:
        today_avg = (
            db.query(func.avg(MarketPrice.price_close))
            .filter(MarketPrice.crop.in_(user_crops), MarketPrice.date == today)
            .scalar()
        )
        week_avg = (
            db.query(func.avg(MarketPrice.price_close))
            .filter(
                MarketPrice.crop.in_(user_crops),
                MarketPrice.date >= seven_days_ago,
                MarketPrice.date < today,
            )
            .scalar()
        )
        if today_avg and week_avg:
            change = ((today_avg - week_avg) / week_avg) * 100
            if change > 2:
                market_trend = "up"
            elif change < -2:
                market_trend = "down"

    # ---- recommendation -----------------------------------------------------
    recommendation = _build_recommendation(market_trend, best_price_today, total_stock_value)

    return DashboardSummary(
        total_stock_value=round(total_stock_value, 2),
        best_price_today=best_price_today,
        market_trend=market_trend,
        crops_tracked=crops_tracked,
        recommendation=recommendation,
    )


def get_available_crops(db: Session) -> list[str]:
    """Return a sorted list of distinct crop names."""
    rows = db.query(distinct(MarketPrice.crop)).order_by(MarketPrice.crop).all()
    return [r[0] for r in rows]


# ── Internal helpers ─────────────────────────────────────────────────────────


def _build_recommendation(
    trend: str,
    best_price: Optional[CropPriceInfo],
    stock_value: float,
) -> str:
    """Generate a simple recommendation string for the dashboard."""
    if trend == "up" and best_price:
        return (
            f"Prices are trending up! Consider selling {best_price.crop} "
            f"at ₹{best_price.price:.0f}/quintal in {best_price.mandi}."
        )
    if trend == "down":
        return "Prices are falling — consider holding stock for a few days."
    if stock_value == 0:
        return "Add your inventory to get personalised selling recommendations."
    return "Market is stable. Monitor prices and sell when you see a good opportunity."
