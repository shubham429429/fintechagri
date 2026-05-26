"""MarketPrice ORM model."""

from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"
    __table_args__ = (
        UniqueConstraint("mandi", "crop", "date", name="uq_mandi_crop_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mandi: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    crop: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    price_open: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_close: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    arrivals_quintals: Mapped[float | None] = mapped_column(Float, nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<MarketPrice(mandi='{self.mandi}', crop='{self.crop}', date={self.date}, close={self.price_close})>"
