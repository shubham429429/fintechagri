"""Upload service — handles file validation, storage, and URL generation."""

import os
import uuid
from pathlib import Path

# Upload directory relative to backend root
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "profiles"


def ensure_upload_dir() -> None:
    """Create the upload directory if it doesn't exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_image(filename: str, file_size: int) -> str | None:
    """Validate file type and size. Returns error message or None if valid."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    if file_size > MAX_FILE_SIZE:
        return f"File too large ({file_size / 1024 / 1024:.1f} MB). Max: 5 MB"
    return None


async def save_profile_photo(user_id: int, file_content: bytes, filename: str) -> str:
    """Save uploaded file and return the URL path."""
    ensure_upload_dir()
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(file_content)

    return f"/uploads/profiles/{unique_name}"
