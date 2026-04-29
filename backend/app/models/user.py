from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    display_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
