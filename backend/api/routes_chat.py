"""
routes_chat.py
--------------
Handles all chat and ML analysis requests.
Currently uses mock responses — will be replaced with
real ML pipeline in Phase 3.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from api.routes_auth import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class MessageRequest(BaseModel):
    message: str
    language: str = "ur"


class ChatResponse(BaseModel):
    reply: str
    emotion: str
    condition: str
    severity: float
    islamic_remedy: Optional[str] = None
    clinical_remedy: Optional[str] = None


# ---------------------------------------------------------------------------
# POST /chat/message  (Protected — requires login)
# ---------------------------------------------------------------------------
@router.post("/message", response_model=ChatResponse)
async def handle_message(
    request: MessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Protected endpoint — user must be logged in.
    Currently returns mock response.
    Phase 3 will chain: Whisper -> mBERT -> RF -> XGBoost -> Rasa
    """
    uid = current_user.get("uid")
    print(f"Message from user {uid}: {request.message}")

    # Mock response for now
    return ChatResponse(
        reply="السلام علیکم! میں آپ کی بات سن رہا ہوں۔ براہ کرم مجھے بتائیں کہ آپ کیسا محسوس کر رہے ہیں۔",
        emotion="neutral",
        condition="none",
        severity=0.0,
        islamic_remedy="أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        clinical_remedy="Take deep breaths and drink water."
    )


# ---------------------------------------------------------------------------
# POST /chat/message/public  (No login required — guest mode)
# ---------------------------------------------------------------------------
@router.post("/message/public", response_model=ChatResponse)
async def handle_message_public(request: MessageRequest):
    """
    Public endpoint — no authentication required.
    Useful for demo mode.
    """
    return ChatResponse(
        reply="السلام علیکم! میں آپ کا ذہنی صحت کا معاون ہوں۔",
        emotion="neutral",
        condition="none",
        severity=0.0,
        islamic_remedy="أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        clinical_remedy="Take deep breaths and drink water."
    )


# ---------------------------------------------------------------------------
# GET /chat/history  (Protected)
# ---------------------------------------------------------------------------
@router.get("/history")
async def get_chat_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns chat history for logged in user.
    Will fetch from Firestore in Phase 6.
    """
    uid = current_user.get("uid")
    return {
        "uid": uid,
        "sessions": [],
        "message": "History feature coming in Phase 6"
    }
