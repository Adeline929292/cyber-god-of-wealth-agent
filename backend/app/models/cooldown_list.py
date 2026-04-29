from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class CooldownList(SQLModel, table=True):
    __tablename__ = "cooldown_lists"

    id: int | None = Field(default=None, primary_key=True)
    purchase_intent_id: int = Field(foreign_key="purchase_intents.id")
    items_json: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
