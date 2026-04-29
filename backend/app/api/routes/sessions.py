from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlmodel import Session, desc, select

from app.db.session import get_session
from app.models.chat_session import ChatSession, ChatSessionCreate, ChatSessionRead
from app.models.saving_goal import SavingGoal
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


def _get_default_goal_id(session: Session) -> int | None:
    statement = select(SavingGoal).order_by(desc(SavingGoal.updated_at)).limit(1)
    goal = session.exec(statement).first()
    return goal.id if goal is not None else None


@router.post("/sessions", response_model=ChatSessionRead)
def create_session(payload: ChatSessionCreate, session: Session = Depends(get_session)) -> ChatSessionRead:
    user = _get_or_create_default_user(session)
    goal_id = payload.goal_id if payload.goal_id is not None else _get_default_goal_id(session)

    session_id = str(uuid4())
    chat_session = ChatSession(
        id=session_id,
        user_id=user.id,
        goal_id=goal_id,
        created_at=datetime.now(timezone.utc),
    )
    session.add(chat_session)
    session.commit()
    return ChatSessionRead(session_id=session_id, goal_id=goal_id)
