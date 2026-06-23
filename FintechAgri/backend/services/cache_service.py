"""Simple in-memory TTL cache for predictions and computed results.

Avoids Redis dependency for MVP. Keys expire after a configurable TTL.
"""

import time
from typing import Any, Optional

_cache: dict[str, tuple[Any, float]] = {}


def get_cached(key: str) -> Optional[Any]:
    """Return cached value if it exists and hasn't expired, else None."""
    entry = _cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        _cache.pop(key, None)
        return None
    return value


def set_cached(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    """Store a value in cache with TTL (default 1 hour)."""
    _cache[key] = (value, time.time() + ttl_seconds)


def invalidate(key: str) -> None:
    """Remove a specific key from cache."""
    _cache.pop(key, None)


def invalidate_prefix(prefix: str) -> None:
    """Remove all keys matching a prefix."""
    keys_to_remove = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_remove:
        _cache.pop(k, None)


def clear_all() -> None:
    """Clear entire cache."""
    _cache.clear()


def cleanup_expired() -> int:
    """Remove all expired entries. Returns count removed."""
    now = time.time()
    expired = [k for k, (_, exp) in _cache.items() if now > exp]
    for k in expired:
        _cache.pop(k, None)
    return len(expired)
