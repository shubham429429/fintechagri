"""Clustering service — farmer proximity search, K-means clustering, and mandi ranking."""

import math
import json
from datetime import date
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.user import User
from models.market import MarketPrice
from models.inventory import Inventory
from services.cache_service import get_cached, set_cached


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the Haversine distance in km between two lat/lng points."""
    R = 6371.0
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


# Static mandi coordinates
MANDI_COORDS = {
    "Lasalgaon": (20.1879, 74.2407),
    "Azadpur": (28.7185, 77.1735),
    "Vashi": (19.0771, 73.0091),
    "Pune": (18.5204, 73.8567),
    "Nashik": (19.9975, 73.7898),
}


def find_nearby_farmers(
    db: Session, lat: float, lng: float, radius_km: float = 100
) -> list[dict]:
    """Find farmers within radius_km of given coordinates."""
    # Get all farmers with GPS coordinates
    farmers = (
        db.query(User)
        .filter(User.latitude.isnot(None), User.longitude.isnot(None))
        .all()
    )

    nearby = []
    for farmer in farmers:
        dist = haversine(lat, lng, farmer.latitude, farmer.longitude)
        if dist <= radius_km:
            # Get farmer's crops
            crops = []
            if farmer.crops:
                try:
                    crops = json.loads(farmer.crops) if isinstance(farmer.crops, str) else farmer.crops
                except (json.JSONDecodeError, TypeError):
                    pass

            nearby.append({
                "farmer_id": farmer.id,
                "name": farmer.name,
                "distance_km": round(dist, 1),
                "farm_location": farmer.farm_location,
                "crops": crops,
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return nearby


def create_clusters(db: Session, n_clusters: int = 5) -> list[dict]:
    """Simple K-means-style clustering of farmers by location.

    Uses iterative centroid refinement (simplified K-means).
    """
    farmers = (
        db.query(User)
        .filter(User.latitude.isnot(None), User.longitude.isnot(None))
        .all()
    )

    if len(farmers) < n_clusters:
        n_clusters = max(1, len(farmers))

    if not farmers:
        return []

    # Initialize centroids from evenly spaced farmers
    step = max(1, len(farmers) // n_clusters)
    centroids = [
        (farmers[i * step].latitude, farmers[i * step].longitude)
        for i in range(n_clusters)
    ]

    # Iterate 10 times to refine
    assignments = [0] * len(farmers)
    for _ in range(10):
        # Assign farmers to nearest centroid
        for i, farmer in enumerate(farmers):
            min_dist = float('inf')
            for j, (c_lat, c_lng) in enumerate(centroids):
                dist = haversine(farmer.latitude, farmer.longitude, c_lat, c_lng)
                if dist < min_dist:
                    min_dist = dist
                    assignments[i] = j

        # Recalculate centroids
        for j in range(n_clusters):
            cluster_farmers = [
                farmers[i] for i in range(len(farmers)) if assignments[i] == j
            ]
            if cluster_farmers:
                centroids[j] = (
                    sum(f.latitude for f in cluster_farmers) / len(cluster_farmers),
                    sum(f.longitude for f in cluster_farmers) / len(cluster_farmers),
                )

    # Build cluster results
    clusters = []
    for j in range(n_clusters):
        cluster_farmers = [
            farmers[i] for i in range(len(farmers)) if assignments[i] == j
        ]
        if not cluster_farmers:
            continue

        # Aggregate inventory
        farmer_ids = [f.id for f in cluster_farmers]
        total_stock = (
            db.query(func.sum(Inventory.quantity_quintals))
            .filter(Inventory.user_id.in_(farmer_ids))
            .scalar()
        ) or 0.0

        # Collect crops
        all_crops = set()
        for f in cluster_farmers:
            if f.crops:
                try:
                    c = json.loads(f.crops) if isinstance(f.crops, str) else f.crops
                    all_crops.update(c)
                except (json.JSONDecodeError, TypeError):
                    pass

        clusters.append({
            "cluster_id": j,
            "centroid_lat": round(centroids[j][0], 4),
            "centroid_lng": round(centroids[j][1], 4),
            "farmer_count": len(cluster_farmers),
            "total_stock_quintals": round(total_stock, 1),
            "crops": sorted(all_crops),
        })

    return clusters


def get_cluster_stock_summary(db: Session, cluster_id: int) -> dict:
    """Get aggregated stock summary for a cluster."""
    clusters = create_clusters(db)

    if cluster_id >= len(clusters):
        return {"error": "Cluster not found"}

    cluster = clusters[cluster_id]
    return cluster


def rank_mandis_by_proximity(
    db: Session, farmer_lat: float, farmer_lng: float
) -> list[dict]:
    """Rank mandis by proximity + current best prices."""
    today = date.today()

    ranked = []
    for mandi_name, (m_lat, m_lng) in MANDI_COORDS.items():
        dist = haversine(farmer_lat, farmer_lng, m_lat, m_lng)

        # Get average price at this mandi today
        avg_price = (
            db.query(func.avg(MarketPrice.price_close))
            .filter(MarketPrice.mandi == mandi_name, MarketPrice.date == today)
            .scalar()
        )

        # Get total arrivals today
        total_arrivals = (
            db.query(func.sum(MarketPrice.arrivals_quintals))
            .filter(MarketPrice.mandi == mandi_name, MarketPrice.date == today)
            .scalar()
        )

        # Score: closer + higher price = better (normalize distance inversely)
        distance_score = max(0, 1 - dist / 500)  # 500km max
        price_score = (avg_price / 5000) if avg_price else 0  # Normalize by expected max price
        composite_score = 0.4 * distance_score + 0.6 * price_score

        ranked.append({
            "mandi": mandi_name,
            "distance_km": round(dist, 1),
            "avg_price_today": round(avg_price, 2) if avg_price else None,
            "total_arrivals_today": round(total_arrivals, 1) if total_arrivals else None,
            "composite_score": round(composite_score, 3),
        })

    ranked.sort(key=lambda x: x["composite_score"], reverse=True)
    return ranked
