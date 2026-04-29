from __future__ import annotations

from datetime import date, datetime, timezone

from sqlmodel import Field, SQLModel


class SavingGoalBase(SQLModel):
    name: str
    target_amount: int = Field(ge=1, description="单位：分")
    current_amount: int = Field(default=0, ge=0, description="单位：分")
    start_date: date
    target_date: date | None = None
    monthly_contribution: int | None = Field(default=None, ge=0, description="单位：分")


class SavingGoal(SavingGoalBase, table=True):
    __tablename__ = "saving_goals"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SavingGoalCreate(SavingGoalBase):
    user_id: int | None = None


class SavingGoalUpdate(SQLModel):
    name: str | None = None
    target_amount: int | None = Field(default=None, ge=1, description="单位：分")
    current_amount: int | None = Field(default=None, ge=0, description="单位：分")
    start_date: date | None = None
    target_date: date | None = None
    monthly_contribution: int | None = Field(default=None, ge=0, description="单位：分")


class SavingGoalRead(SavingGoalBase):
    id: int
    user_id: int | None
    created_at: datetime
    updated_at: datetime
