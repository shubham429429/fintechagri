"""PredictionRecord ORM model for storing forecasts and recommendations."""

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mandi: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    crop: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    predicted_arrivals: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_price_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_price_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_price_modal: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0.0 - 1.0
    recommendation: Mapped[str | None] = mapped_column(String(20), nullable=True)  # sell / hold / wait
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="baseline_v1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return (
            f"<PredictionRecord(mandi='{self.mandi}', crop='{self.crop}', "
            f"date={self.forecast_date}, rec='{self.recommendation}')>"
        )
