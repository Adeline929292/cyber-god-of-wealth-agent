from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class PriceQuote(SQLModel, table=True):
    __tablename__ = "price_quotes"

    id: int | None = Field(default=None, primary_key=True)
    purchase_intent_id: int = Field(foreign_key="purchase_intents.id")
    source: str
    price: int = Field(description="单位：分")
    url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
