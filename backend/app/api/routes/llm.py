from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/llm/providers")
def list_llm_providers():
    settings = get_settings()
    providers = [
        {"name": "openai", "enabled": bool(settings.openai_api_key)},
        {"name": "qwen", "enabled": bool(settings.qwen_api_key)},
        {"name": "deepseek", "enabled": bool(settings.deepseek_api_key)},
    ]
    return {"providers": providers}
