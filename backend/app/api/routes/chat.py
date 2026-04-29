from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, desc, select

from app.db.session import get_session
from app.models.chat_session import ChatSession
from app.models.cooldown_list import CooldownList
from app.models.price_quote import PriceQuote
from app.models.purchase_intent import PurchaseIntent
from app.models.saving_goal import SavingGoal
from app.models.user import User

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str | None = None
    goal_id: int | None = None
    message: str = Field(min_length=1)
    explicit_price: int | None = Field(default=None, ge=1, description="单位：分")
    currency: str = "CNY"
    llm_provider: str | None = None
    llm_enabled: bool = False


@dataclass(frozen=True)
class ParsedIntent:
    item_name: str
    price: int | None
    reason: str | None


def _yuan_to_cents(value: float) -> int:
    return max(0, int(round(value * 100)))


def _parse_price_from_text(text: str) -> int | None:
    t = text.replace(",", "").replace("，", "")
    m = re.search(r"(?P<num>\d+(?:\.\d+)?)\s*(?:元|块|￥|¥|rmb|RMB)?", t)
    if not m:
        return None
    try:
        num = float(m.group("num"))
    except ValueError:
        return None
    if num <= 0:
        return None
    return _yuan_to_cents(num)


def _parse_item_name(text: str) -> str:
    t = text.strip()
    t = re.sub(r"\d+(?:\.\d+)?\s*(?:元|块|￥|¥|rmb|RMB)?", "", t)
    t = re.sub(r"[，,。.!！?？]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    for prefix in ["我想买", "我好想买", "好想买", "想买", "想要", "我要买", "我想花", "我好想花", "想花", "要花"]:
        if t.startswith(prefix):
            t = t.removeprefix(prefix).strip()
    return t or "未命名商品"


def _parse_reason(text: str) -> str | None:
    m = re.search(r"(?:因为|理由是|原因是)\s*(.+)$", text.strip())
    if not m:
        return None
    reason = m.group(1).strip()
    return reason or None


def parse_intent(message: str, explicit_price: int | None) -> ParsedIntent:
    price = explicit_price if explicit_price is not None else _parse_price_from_text(message)
    item_name = _parse_item_name(message)
    reason = _parse_reason(message)
    return ParsedIntent(item_name=item_name, price=price, reason=reason)


def _get_goal_for_request(session: Session, goal_id: int | None, session_id: str | None) -> SavingGoal | None:
    if goal_id is not None:
        return session.get(SavingGoal, goal_id)

    if session_id is not None:
        chat_session = session.get(ChatSession, session_id)
        if chat_session is not None and chat_session.goal_id is not None:
            return session.get(SavingGoal, chat_session.goal_id)

    statement = select(SavingGoal).order_by(desc(SavingGoal.updated_at)).limit(1)
    return session.exec(statement).first()


def _get_or_create_default_user(session: Session) -> User:
    user = session.get(User, 1)
    if user is not None:
        return user

    user = User(id=1, display_name="默认用户")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _format_yuan(cents: int) -> str:
    return f"{cents / 100:.2f}"


def compute_impact(goal: SavingGoal, price: int) -> dict:
    remaining_before = max(0, goal.target_amount - goal.current_amount)
    remaining_after_if_buy = remaining_before + price
    current_amount_after_if_buy = max(0, goal.current_amount - price)

    daily_plan: int | None = None
    eta_shift_days: int | None = None

    today = date.today()
    if goal.target_date is not None:
        days_left = max(1, (goal.target_date - today).days)
        daily_plan = int((remaining_before + days_left - 1) // days_left)
        eta_shift_days = int((price + daily_plan - 1) // daily_plan) if daily_plan > 0 else None
    elif goal.monthly_contribution is not None and goal.monthly_contribution > 0:
        per_day = max(1, int(goal.monthly_contribution // 30))
        eta_shift_days = int((price + per_day - 1) // per_day)
        daily_plan = per_day

    return {
        "goal_name": goal.name,
        "price": price,
        "current_amount_before": goal.current_amount,
        "current_amount_after_if_buy": current_amount_after_if_buy,
        "remaining_before": remaining_before,
        "remaining_after_if_buy": remaining_after_if_buy,
        "daily_plan": daily_plan,
        "eta_shift_days": eta_shift_days,
    }


def decide(impact: dict, save_vs_best: int | None) -> tuple[str, str]:
    price = int(impact["price"])
    remaining_before = int(impact["remaining_before"])
    eta_shift_days = impact.get("eta_shift_days")

    ratio = price / max(remaining_before, 1)
    big_price = price >= 50000
    huge_ratio = ratio >= 0.10
    big_shift = isinstance(eta_shift_days, int) and eta_shift_days >= 7

    price_gap_big = False
    if save_vs_best is not None and price > 0:
        price_gap_big = save_vs_best >= max(500, int(price * 0.05))

    if big_shift or huge_ratio or (big_price and price_gap_big):
        result = "discourage"
    elif (not big_price) and ratio <= 0.02 and not price_gap_big:
        result = "encourage"
    else:
        result = "neutral"

    persona = "cyber_caishen" if (_hash_flag(str(price)) == 0) else "toxic_bestie"
    return result, persona


def _hash_flag(seed: str) -> int:
    return sum(seed.encode("utf-8")) % 2


def build_cooldown_items(result: str) -> list[dict]:
    if result != "discourage":
        return []
    return [
        {"text": "先放入冷静清单 24 小时", "checked": False},
        {"text": "写下：我买它是为了解决什么问题？", "checked": False},
        {"text": "找一个 0 元替代方案先用 1 天", "checked": False},
        {"text": "如果仍想买：只买最低价渠道并设置价格提醒", "checked": False},
    ]


def build_advice(persona: str, result: str, intent: ParsedIntent, impact: dict, best_price: int | None) -> str:
    item = intent.item_name
    price = intent.price
    if price is None:
        if persona == "toxic_bestie":
            return f"你先把“{item}”的价格说清楚（多少元）。不报价格就让我劝退？我又不是算命的。"
        return f"想买“{item}”可以，但先给个价格（多少元）。账不清，神谕不出。"

    price_yuan = _format_yuan(price)
    best_yuan = _format_yuan(best_price) if best_price is not None else None
    remaining_after = int(impact["remaining_after_if_buy"])
    remaining_after_yuan = _format_yuan(remaining_after)
    shift = impact.get("eta_shift_days")

    if persona == "cyber_caishen":
        if result == "discourage":
            tip = f"此物“{item}”价 {price_yuan} 元，买下即为你目标额外添一笔缺口：{remaining_after_yuan} 元待补。"
            if best_yuan is not None:
                tip += f"底价约 {best_yuan} 元，先别当冤大头。"
            if isinstance(shift, int):
                tip += f"按当前计划，达成可能延后约 {shift} 天。"
            return tip + "我的建议：先等 24 小时，再用最低价/二手/折扣条件购买。"
        if result == "encourage":
            return f"“{item}”价 {price_yuan} 元，对目标影响可控。记住条件：只按预算买、只买最低价。"
        return f"“{item}”价 {price_yuan} 元，影响不小也不至于立刻封印。给你个条件：先比价、再决定。"

    if result == "discourage":
        tip = f"{item} 值不值 {price_yuan} 元先放一边，关键是你目标缺口会变成 {remaining_after_yuan} 元。"
        if best_yuan is not None:
            tip += f"而且同类底价 {best_yuan} 元，你现在这个价就是在加税。"
        if isinstance(shift, int):
            tip += f"顺带把达成时间往后推 {shift} 天。"
        return tip + "所以：先别买，丢进冷静清单，明天再来。"
    if result == "encourage":
        return f"行，{item} {price_yuan} 元不算离谱。但我只允许你：搜最低价、能退就退、别加购别凑单。"
    return f"{item} {price_yuan} 元我不表态。你先把底价和你买它的理由讲清楚，别用冲动当借口。"


def _persist_discourage(
    session: Session,
    user_id: int,
    goal: SavingGoal,
    chat_session_id: str | None,
    intent: ParsedIntent,
    currency: str,
    decision: str,
    persona: str,
    advice_text: str,
    best_price: int | None,
    save_vs_best: int | None,
    eta_shift_days: int | None,
    quotes: list[dict],
    cooldown_items: list[dict],
) -> int:
    purchase_intent = PurchaseIntent(
        user_id=user_id,
        goal_id=goal.id,
        session_id=chat_session_id,
        item_name=intent.item_name,
        stated_price=intent.price,
        chosen_price=intent.price or 0,
        currency=currency,
        reason=intent.reason,
        decision=decision,
        persona=persona,
        advice_text=advice_text,
        best_price=best_price,
        save_vs_best=save_vs_best,
        eta_shift_days=eta_shift_days,
        created_at=datetime.now(timezone.utc),
    )
    session.add(purchase_intent)
    session.commit()
    session.refresh(purchase_intent)

    for q in quotes:
        session.add(
            PriceQuote(
                purchase_intent_id=purchase_intent.id,
                source=q["source"],
                price=q["price"],
                url=q.get("url"),
                created_at=datetime.now(timezone.utc),
            )
        )
    session.commit()

    session.add(
        CooldownList(
            purchase_intent_id=purchase_intent.id,
            items_json=json.dumps(cooldown_items, ensure_ascii=False),
            created_at=datetime.now(timezone.utc),
        )
    )
    session.commit()

    return int(purchase_intent.id)


@router.post("/chat")
def chat(payload: ChatRequest, session: Session = Depends(get_session)):
    request_id = f"req_{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    intent = parse_intent(payload.message, payload.explicit_price)
    goal = _get_goal_for_request(session, payload.goal_id, payload.session_id)

    if intent.price is None:
        assistant_message = build_advice("cyber_caishen", "neutral", intent, {"remaining_after_if_buy": 0, "eta_shift_days": None, "price": 0}, None)
        return {
            "request_id": request_id,
            "session_id": payload.session_id,
            "assistant_message": assistant_message,
            "parsed": {"item_name": intent.item_name, "price": None, "reason": intent.reason},
            "decision": {"result": "neutral", "persona": "cyber_caishen"},
            "impact": None,
            "price_comparison": None,
            "purchase_intent_id": None,
            "cooldown": {"items": []},
        }

    price = intent.price

    if goal is None:
        assistant_message = "先去设置一个攒钱目标（/goals）。没有目标，我只能劝你“凭感觉”，那就不专业了。"
        return {
            "request_id": request_id,
            "session_id": payload.session_id,
            "assistant_message": assistant_message,
            "parsed": {"item_name": intent.item_name, "price": price, "reason": intent.reason},
            "decision": {"result": "neutral", "persona": "cyber_caishen"},
            "impact": None,
            "price_comparison": None,
            "purchase_intent_id": None,
            "cooldown": {"items": []},
        }

    quotes = _mock_quotes_for_item(intent.item_name)
    best = min(quotes, key=lambda q: q["price"])
    save_vs_best = max(0, price - best["price"])

    impact = compute_impact(goal, price)
    result, persona = decide(impact, save_vs_best)
    assistant_message = build_advice(persona, result, intent, impact, best["price"])
    cooldown_items = build_cooldown_items(result)

    purchase_intent_id: int | None = None
    if result == "discourage":
        user = _get_or_create_default_user(session)
        purchase_intent_id = _persist_discourage(
            session=session,
            user_id=int(user.id),
            goal=goal,
            chat_session_id=payload.session_id,
            intent=intent,
            currency=payload.currency,
            decision=result,
            persona=persona,
            advice_text=assistant_message,
            best_price=best["price"],
            save_vs_best=save_vs_best,
            eta_shift_days=impact.get("eta_shift_days"),
            quotes=quotes,
            cooldown_items=cooldown_items,
        )

    return {
        "request_id": request_id,
        "session_id": payload.session_id,
        "assistant_message": assistant_message,
        "parsed": {"item_name": intent.item_name, "price": price, "reason": intent.reason},
        "decision": {"result": result, "persona": persona},
        "impact": impact,
        "price_comparison": {
            "quotes": quotes,
            "best": {"source": best["source"], "price": best["price"]},
            "save_vs_current": save_vs_best,
        },
        "purchase_intent_id": purchase_intent_id,
        "cooldown": {"items": cooldown_items},
    }


def _mock_quotes_for_item(item_name: str) -> list[dict]:
    from app.api.routes.prices import _mock_quotes

    quotes = _mock_quotes(item_name)
    return [{"source": q.source, "price": q.price, "url": q.url} for q in quotes]
