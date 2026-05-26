"""Dashboard KPI endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.market import DashboardSummary
from services.auth_service import get_current_user
from services.market_service import get_dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return aggregated dashboard KPIs for the authenticated farmer."""
    return get_dashboard_summary(db, current_user)
