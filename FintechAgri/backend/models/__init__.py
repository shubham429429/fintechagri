"""ORM models package — re-exports every model so `import models` registers them."""

from models.user import User  # noqa: F401
from models.market import MarketPrice  # noqa: F401
from models.inventory import Inventory, Post, Comment, StockHistory, StorageLocation  # noqa: F401
from models.prediction import PredictionRecord  # noqa: F401

__all__ = [
    "User", "MarketPrice", "Inventory", "Post", "Comment",
    "StockHistory", "StorageLocation", "PredictionRecord",
]

