from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"

    id: str = Field(primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="users.id")
    goal_id: int | None = Field(default=None, foreign_key="saving_goals.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatSessionCreate(SQLModel):
    goal_id: int | None = None


class ChatSessionRead(SQLModel):
    session_id: str
    goal_id: int | None = None
