"""Nearby Markets endpoint — find mandis within a given radius with produce data."""

import math
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.market import MarketPrice

router = APIRouter(prefix="/api/market", tags=["Nearby Markets"])

# Static mandi coordinates (lat, lng)
MANDI_COORDS: dict[str, tuple[float, float]] = {
    "Lasalgaon": (20.1879, 74.2407),
    "Azadpur": (28.7185, 77.1735),
    "Vashi": (19.0771, 73.0091),
    "Pune": (18.5204, 73.8567),
    "Nashik": (19.9975, 73.7898),
}


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the Haversine distance in km between two points on Earth."""
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("/nearby")
def get_nearby_markets(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: int = Query(100, ge=1, le=500, description="Search radius in km"),
    db: Session = Depends(get_db),
):
    """Return mandis within *radius_km* of the given location, with produce data."""

    # 1. Filter mandis by distance
    nearby: list[dict] = []
    for mandi_name, (m_lat, m_lng) in MANDI_COORDS.items():
        dist = _haversine(lat, lng, m_lat, m_lng)
        if dist <= radius_km:
            nearby.append({"mandi": mandi_name, "distance_km": round(dist, 1)})

    if not nearby:
        return []

    # Sort by distance (closest first)
    nearby.sort(key=lambda x: x["distance_km"])

    mandi_names = [m["mandi"] for m in nearby]

    # 2. Get the most recent date with data for the nearby mandis
    latest_date_row = (
        db.query(func.max(MarketPrice.date))
        .filter(MarketPrice.mandi.in_(mandi_names))
        .scalar()
    )
    if latest_date_row is None:
        # No data at all — return mandis with empty produce
        return [
            {
                "mandi": m["mandi"],
                "state": None,
                "distance_km": m["distance_km"],
                "produce": [],
                "total_quintals": 0.0,
            }
            for m in nearby
        ]

    query_date: date = latest_date_row

    # 3. Aggregate arrivals by mandi + crop for that date
    rows = (
        db.query(
            MarketPrice.mandi,
            MarketPrice.state,
            MarketPrice.crop,
            func.sum(MarketPrice.arrivals_quintals).label("quantity_quintals"),
            func.max(MarketPrice.price_close).label("latest_price"),
        )
        .filter(
            MarketPrice.mandi.in_(mandi_names),
            MarketPrice.date == query_date,
        )
        .group_by(MarketPrice.mandi, MarketPrice.state, MarketPrice.crop)
        .all()
    )

    # Build a lookup: mandi -> {state, produce[]}
    mandi_data: dict[str, dict] = {}
    for row in rows:
        entry = mandi_data.setdefault(
            row.mandi,
            {"state": row.state, "produce": [], "total_quintals": 0.0},
        )
        qty = row.quantity_quintals or 0.0
        entry["produce"].append(
            {
                "crop": row.crop,
                "quantity_quintals": round(qty, 1),
                "latest_price": round(row.latest_price, 2) if row.latest_price else None,
            }
        )
        entry["total_quintals"] = round(entry["total_quintals"] + qty, 1)

    # 4. Merge distance info with produce data
    result = []
    for m in nearby:
        data = mandi_data.get(m["mandi"], {"state": None, "produce": [], "total_quintals": 0.0})
        result.append(
            {
                "mandi": m["mandi"],
                "state": data["state"],
                "distance_km": m["distance_km"],
                "produce": data["produce"],
                "total_quintals": data["total_quintals"],
            }
        )

    return result
