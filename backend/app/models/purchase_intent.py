from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class PurchaseIntent(SQLModel, table=True):
    __tablename__ = "purchase_intents"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="users.id")
    goal_id: int | None = Field(default=None, foreign_key="saving_goals.id")
    session_id: str | None = Field(default=None, foreign_key="chat_sessions.id")

    item_name: str
    stated_price: int | None = Field(default=None, description="单位：分")
    chosen_price: int = Field(description="单位：分")
    currency: str = Field(default="CNY")
    reason: str | None = None

    decision: str
    persona: str
    advice_text: str

    best_price: int | None = Field(default=None, description="单位：分")
    save_vs_best: int | None = Field(default=None, description="单位：分")
    eta_shift_days: int | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PurchaseIntentRead(SQLModel):
    purchase_intent_id: int
    item_name: str
    chosen_price: int
    best_price: int | None
    save_vs_best: int | None
    persona: str
    advice_text: str
    created_at: datetime
