from __future__ import annotations

import hashlib
from dataclasses import dataclass

from fastapi import APIRouter, Query

router = APIRouter()


@dataclass(frozen=True)
class Quote:
    source: str
    price: int
    url: str | None


def _stable_int(seed: str) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big")


def _mock_quotes(query: str) -> list[Quote]:
    q = query.strip().lower()
    presets: dict[str, list[Quote]] = {
        "airpods": [
            Quote(source="京东", price=129900, url=None),
            Quote(source="天猫", price=124900, url=None),
            Quote(source="拼多多", price=119900, url=None),
        ],
        "盲盒": [
            Quote(source="京东", price=80000, url=None),
            Quote(source="天猫", price=69000, url=None),
            Quote(source="拼多多", price=59000, url=None),
        ],
        "switch": [
            Quote(source="京东", price=209900, url=None),
            Quote(source="天猫", price=199900, url=None),
            Quote(source="拼多多", price=189900, url=None),
        ],
    }
    for key, quotes in presets.items():
        if key in q:
            return quotes

    base = 5000 + (_stable_int(q) % 450000)
    sources = ["京东", "天猫", "拼多多"]
    offsets = [0, -max(100, base // 30), -max(200, base // 18)]
    quotes = [Quote(source=s, price=max(100, base + o), url=None) for s, o in zip(sources, offsets, strict=True)]
    return quotes


@router.get("/prices/search")
def search_prices(query: str = Query(..., min_length=1), currency: str = Query("CNY")):
    quotes = _mock_quotes(query)
    return {
        "query": query,
        "currency": currency,
        "quotes": [{"source": q.source, "price": q.price, "url": q.url} for q in quotes],
    }
