"""Cluster endpoints — farmer proximity, K-means clusters, mandi ranking."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth_service import get_current_user
from services.clustering_service import (
    create_clusters,
    find_nearby_farmers,
    get_cluster_stock_summary,
    rank_mandis_by_proximity,
)

router = APIRouter(prefix="/api/cluster", tags=["Location & Clustering"])


@router.get("/nearby")
def nearby_farmers(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Find farmers within a given radius of the specified coordinates."""
    return find_nearby_farmers(db, lat, lng, radius_km)


@router.get("/clusters")
def get_clusters(
    n_clusters: int = Query(5, ge=1, le=20, description="Number of clusters"),
    db: Session = Depends(get_db),
):
    """Run K-means clustering on all farmers with GPS coordinates."""
    return create_clusters(db, n_clusters)


@router.get("/clusters/{cluster_id}/stock")
def cluster_stock(
    cluster_id: int,
    db: Session = Depends(get_db),
):
    """Get aggregated stock summary for a specific cluster."""
    return get_cluster_stock_summary(db, cluster_id)


@router.get("/mandi-ranking")
def mandi_ranking(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Rank mandis by proximity + price score for the authenticated farmer."""
    lat = current_user.latitude or 19.9975  # Default to Nashik
    lng = current_user.longitude or 73.7898
    return rank_mandis_by_proximity(db, lat, lng)
