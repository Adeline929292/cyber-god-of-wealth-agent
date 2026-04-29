from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, desc, select

from app.db.session import get_session
from app.models.cooldown_list import CooldownList
from app.models.purchase_intent import PurchaseIntent, PurchaseIntentRead

router = APIRouter()


class CooldownDetailResponse(BaseModel):
    purchase_intent_id: int
    item_name: str
    chosen_price: int
    best_price: int | None
    save_vs_best: int | None
    persona: str
    advice_text: str
    created_at: datetime
    items: list[dict]


class CooldownUpdateRequest(BaseModel):
    items: list[dict]


@router.get("/cooldown/items")
def list_cooldown_items(session: Session = Depends(get_session)):
    statement = (
        select(PurchaseIntent)
        .where(PurchaseIntent.decision == "discourage")
        .order_by(desc(PurchaseIntent.created_at))
    )
    intents = list(session.exec(statement).all())
    items = [
        PurchaseIntentRead(
            purchase_intent_id=int(i.id),
            item_name=i.item_name,
            chosen_price=i.chosen_price,
            best_price=i.best_price,
            save_vs_best=i.save_vs_best,
            persona=i.persona,
            advice_text=i.advice_text,
            created_at=i.created_at,
        )
        for i in intents
    ]
    return {"items": items}


@router.get("/cooldown/items/{purchase_intent_id}", response_model=CooldownDetailResponse)
def get_cooldown_detail(purchase_intent_id: int, session: Session = Depends(get_session)):
    intent = session.get(PurchaseIntent, purchase_intent_id)
    if intent is None or intent.decision != "discourage":
        raise HTTPException(status_code=404, detail="Not found")

    statement = select(CooldownList).where(CooldownList.purchase_intent_id == purchase_intent_id).order_by(desc(CooldownList.created_at)).limit(1)
    cooldown = session.exec(statement).first()
    items = []
    if cooldown is not None:
        try:
            items = json.loads(cooldown.items_json)
        except json.JSONDecodeError:
            items = []

    return CooldownDetailResponse(
        purchase_intent_id=purchase_intent_id,
        item_name=intent.item_name,
        chosen_price=intent.chosen_price,
        best_price=intent.best_price,
        save_vs_best=intent.save_vs_best,
        persona=intent.persona,
        advice_text=intent.advice_text,
        created_at=intent.created_at,
        items=items,
    )


@router.patch("/cooldown/items/{purchase_intent_id}", response_model=CooldownDetailResponse)
def update_cooldown_items(purchase_intent_id: int, payload: CooldownUpdateRequest, session: Session = Depends(get_session)):
    intent = session.get(PurchaseIntent, purchase_intent_id)
    if intent is None or intent.decision != "discourage":
        raise HTTPException(status_code=404, detail="Not found")

    session.add(
        CooldownList(
            purchase_intent_id=purchase_intent_id,
            items_json=json.dumps(payload.items, ensure_ascii=False),
            created_at=datetime.now(timezone.utc),
        )
    )
    session.commit()
    return get_cooldown_detail(purchase_intent_id, session)
