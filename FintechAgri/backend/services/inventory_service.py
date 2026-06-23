"""Inventory service — stock history tracking, depletion, and freshness calculations."""

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.inventory import Inventory, StockHistory
from models.user import User


# Crop shelf life in days (approximate)
CROP_SHELF_LIFE = {
    "Onion": 60, "Tomato": 10, "Potato": 90,
    "Cauliflower": 7, "Cabbage": 14, "Green Chilli": 5,
}


def log_stock_change(
    db: Session,
    inventory_id: int,
    farmer_id: int,
    crop: str,
    quantity_before: float,
    quantity_after: float,
    change_type: str,
) -> StockHistory:
    """Record a stock quantity change in the audit trail."""
    entry = StockHistory(
        inventory_id=inventory_id,
        farmer_id=farmer_id,
        crop=crop,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        change_type=change_type,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_stock_history(db: Session, inventory_id: int) -> list[dict]:
    """Get change history for a specific inventory item."""
    records = (
        db.query(StockHistory)
        .filter(StockHistory.inventory_id == inventory_id)
        .order_by(StockHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "inventory_id": r.inventory_id,
            "crop": r.crop,
            "quantity_before": r.quantity_before,
            "quantity_after": r.quantity_after,
            "change_type": r.change_type,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


def get_farmer_stock_history(db: Session, farmer_id: int) -> list[dict]:
    """Get all stock change history for a farmer."""
    records = (
        db.query(StockHistory)
        .filter(StockHistory.farmer_id == farmer_id)
        .order_by(StockHistory.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": r.id,
            "inventory_id": r.inventory_id,
            "crop": r.crop,
            "quantity_before": r.quantity_before,
            "quantity_after": r.quantity_after,
            "change_type": r.change_type,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


def calculate_freshness(harvest_date: Optional[date], crop: str) -> dict:
    """Calculate freshness percentage and status for a crop.

    Returns: {freshness_pct, status, days_remaining, shelf_life_days}
    """
    shelf_life = CROP_SHELF_LIFE.get(crop, 30)

    if harvest_date is None:
        return {
            "freshness_pct": 100.0,
            "status": "unknown",
            "days_remaining": None,
            "shelf_life_days": shelf_life,
        }

    days_since = (date.today() - harvest_date).days
    freshness_pct = max(0.0, min(100.0, (1 - days_since / shelf_life) * 100))
    days_remaining = max(0, shelf_life - days_since)

    if freshness_pct > 70:
        status = "fresh"
    elif freshness_pct > 40:
        status = "aging"
    elif freshness_pct > 10:
        status = "old"
    else:
        status = "spoiled"

    return {
        "freshness_pct": round(freshness_pct, 1),
        "status": status,
        "days_remaining": days_remaining,
        "shelf_life_days": shelf_life,
    }


def calculate_depletion(db: Session, farmer_id: int) -> list[dict]:
    """Estimate days until each inventory item is depleted based on recent sell rate."""
    items = db.query(Inventory).filter(Inventory.user_id == farmer_id).all()

    results = []
    for item in items:
        # Get recent stock changes to estimate sell rate
        recent_sales = (
            db.query(StockHistory)
            .filter(
                StockHistory.inventory_id == item.id,
                StockHistory.change_type.in_(["updated", "sold"]),
            )
            .order_by(StockHistory.created_at.desc())
            .limit(10)
            .all()
        )

        # Calculate average daily depletion rate
        daily_rate = 0.0
        if recent_sales and len(recent_sales) >= 2:
            total_depleted = sum(
                max(0, s.quantity_before - s.quantity_after) for s in recent_sales
            )
            first = recent_sales[-1].created_at
            last = recent_sales[0].created_at
            if first and last and first != last:
                days_span = max(1, (last - first).days)
                daily_rate = total_depleted / days_span

        days_until_depleted = None
        if daily_rate > 0 and item.quantity_quintals > 0:
            days_until_depleted = int(item.quantity_quintals / daily_rate)

        freshness = calculate_freshness(item.harvest_date, item.crop)

        results.append({
            "inventory_id": item.id,
            "crop": item.crop,
            "current_quantity": item.quantity_quintals,
            "daily_sell_rate": round(daily_rate, 2),
            "days_until_depleted": days_until_depleted,
            "freshness": freshness,
        })

    return results
