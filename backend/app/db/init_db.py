from pathlib import Path

from app.core.config import get_settings


def ensure_sqlite_db_dir() -> None:
    settings = get_settings()
    if not settings.auto_create_db_dir:
        return

    if not settings.database_url.startswith("sqlite:///./"):
        return

    sqlite_relative_path = settings.database_url.removeprefix("sqlite:///./")
    db_path = Path(__file__).resolve().parents[2] / sqlite_relative_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
