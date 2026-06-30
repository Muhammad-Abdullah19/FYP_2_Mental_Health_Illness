"""
routes_chat.py
--------------
Chat endpoints. Runs the ML analysis pipeline, returns the reply plus the
full breakdown, and (for logged-in users) saves each analysis to Firestore
so the progress dashboard can plot severity over time.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from api.routes_auth import get_current_user
from ml_models.pipeline import run_pipeline
from api.firestore_service import save_session, get_sessions, get_summary

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageRequest(BaseModel):
    message: str
    language: str = "ur"


class ChatResponse(BaseModel):
    reply: str
    emotion: str
    emotion_confidence: float
    condition: str
    condition_confidence: float
    condition_breakdown: Dict[str, int]
    severity_score: float
    severity_percent: int
    severity_level: str
    is_crisis: bool
    islamic_remedy: Optional[str] = None
    islamic_reference: Optional[str] = None
    islamic_verified: Optional[bool] = None
    clinical_remedy: Optional[str] = None
    clinical_reference: Optional[str] = None
    clinical_verified: Optional[bool] = None


def _to_response(result: dict) -> ChatResponse:
    return ChatResponse(
        reply=result["response_text"],
        emotion=result["emotion"],
        emotion_confidence=result["emotion_confidence"],
        condition=result["condition"],
        condition_confidence=result["condition_confidence"],
        condition_breakdown=result["condition_breakdown"],
        severity_score=result["severity_score"],
        severity_percent=result["severity_percent"],
        severity_level=result["severity_level"],
        is_crisis=result["is_crisis"],
        islamic_remedy=result["islamic_remedy"],
        islamic_reference=result.get("islamic_reference"),
        islamic_verified=result.get("islamic_verified"),
        clinical_remedy=result["clinical_remedy"],
        clinical_reference=result.get("clinical_reference"),
        clinical_verified=result.get("clinical_verified"),
    )


@router.post("/message", response_model=ChatResponse)
async def handle_message(
    request: MessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """Authenticated chat: runs analysis AND saves the session to Firestore."""
    uid = current_user.get("uid")
    logger.info("Message from user %s: %s", uid, request.message[:50])
    try:
        result = run_pipeline(request.message)
        # Save session (non-blocking — a failed save never breaks the reply)
        save_session(uid, result)
        return _to_response(result)
    except Exception as e:
        logger.error("Pipeline error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message/public", response_model=ChatResponse)
async def handle_message_public(request: MessageRequest):
    """Guest chat: runs analysis but does NOT save anything."""
    logger.info("Public message: %s", request.message[:50])
    try:
        return _to_response(run_pipeline(request.message))
    except Exception as e:
        logger.error("Pipeline error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Return the logged-in user's saved sessions plus summary stats."""
    uid = current_user.get("uid")
    sessions = get_sessions(uid, limit=200)
    summary = get_summary(sessions)
    return {"uid": uid, "sessions": sessions, "summary": summary}
