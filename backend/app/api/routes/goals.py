from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, desc, select

from app.db.session import get_session
from app.models.saving_goal import SavingGoal, SavingGoalCreate, SavingGoalRead, SavingGoalUpdate
from app.models.user import User

router = APIRouter()


def _get_or_create_default_user(session: Session) -> User:
    user = session.get(User, 1)
    if user is not None:
        return user

    user = User(id=1, display_name="默认用户")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/goals", response_model=list[SavingGoalRead])
def list_goals(session: Session = Depends(get_session)) -> list[SavingGoal]:
    statement = select(SavingGoal).order_by(desc(SavingGoal.updated_at))
    return list(session.exec(statement).all())


@router.get("/goals/current", response_model=SavingGoalRead | None)
def get_current_goal(session: Session = Depends(get_session)) -> SavingGoal | None:
    statement = select(SavingGoal).order_by(desc(SavingGoal.updated_at)).limit(1)
    return session.exec(statement).first()


@router.post("/goals", response_model=SavingGoalRead)
def create_goal(payload: SavingGoalCreate, session: Session = Depends(get_session)) -> SavingGoal:
    default_user = _get_or_create_default_user(session)

    goal = SavingGoal.model_validate(payload)
    if goal.user_id is None:
        goal.user_id = default_user.id

    now = datetime.now(timezone.utc)
    goal.created_at = now
    goal.updated_at = now

    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.patch("/goals/{goal_id}", response_model=SavingGoalRead)
def update_goal(goal_id: int, payload: SavingGoalUpdate, session: Session = Depends(get_session)) -> SavingGoal:
    goal = session.get(SavingGoal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)

    goal.updated_at = datetime.now(timezone.utc)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal
