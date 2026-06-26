"""
routes_chat.py
--------------
Handles all chat and ML analysis requests.

Current state (Phase 1):
  - POST /api/chat/analyze  — calls mock_ai.py stub, saves result to Firestore
  - GET  /api/chat/history  — returns user's session history from Firestore

Phase 2 upgrade path:
  - Replace mock_ai.analyze() with real pipeline:
    Whisper → mBERT+CNN → RandomForest → XGBoost → Rasa → Coqui TTS
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from firebase_admin import auth, firestore
from datetime import datetime

from ml_models.mock_ai import analyze as mock_analyze
from api.routes_auth import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str                    # Urdu text (typed or Whisper-transcribed)
    session_id: Optional[str] = None


class AnalysisResult(BaseModel):
    transcription: str              # Echo of input text (will be Whisper output in Phase 2)
    emotion: str                    # e.g. "anxious", "hopeless", "fatigued"
    condition: str                  # "Depression" | "Anxiety" | "Stress"
    confidence: float               # 0.0 – 1.0
    severity: float                 # 0.0 – 100.0
    response_text: str              # Rasa/Gemini dialogue response (Urdu)
    islamic_remedy: str             # Quranic verse / Hadith
    clinical_remedy: str            # WHO/NIH wellness tip
    session_id: str


class SessionSummary(BaseModel):
    session_id: str
    timestamp: str
    condition: str
    severity: float
    emotion: str


# ---------------------------------------------------------------------------
# POST /api/chat/analyze
# Full pipeline: text → emotion → condition → severity → response + remedies
# Saves result to Firestore under users/{uid}/sessions/{session_id}
# ---------------------------------------------------------------------------
@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]

    try:
        # Run the (currently mock) AI pipeline
        result = mock_analyze(payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {str(e)}")

    # Persist to Firestore
    db = firestore.client()
    session_ref = (
        db.collection("users")
          .document(uid)
          .collection("sessions")
          .document()
    )
    session_data = {
        "session_id": session_ref.id,
        "timestamp": datetime.utcnow().isoformat(),
        "input_text": payload.message,
        **result,
    }
    session_ref.set(session_data)

    # Increment session counter on user document
    db.collection("users").document(uid).update(
        {"sessions_count": firestore.INCREMENT(1)}
    )

    return AnalysisResult(session_id=session_ref.id, **result)


# ---------------------------------------------------------------------------
# POST /api/chat/analyze/public
# Same as /analyze but does NOT require authentication.
# Useful for demo / guest mode. Results are NOT saved.
# ---------------------------------------------------------------------------
@router.post("/analyze/public", response_model=AnalysisResult)
async def analyze_public(payload: ChatRequest):
    try:
        result = mock_analyze(payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {str(e)}")

    return AnalysisResult(session_id="guest", **result)


# ---------------------------------------------------------------------------
# GET /api/chat/history
# Returns the authenticated user's last 20 sessions, ordered by timestamp.
# ---------------------------------------------------------------------------
@router.get("/history", response_model=List[SessionSummary])
async def get_history(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    db = firestore.client()

    sessions = (
        db.collection("users")
          .document(uid)
          .collection("sessions")
          .order_by("timestamp", direction=firestore.Query.DESCENDING)
          .limit(20)
          .stream()
    )

    history = []
    for s in sessions:
        data = s.to_dict()
        history.append(
            SessionSummary(
                session_id=data.get("session_id", s.id),
                timestamp=data.get("timestamp", ""),
                condition=data.get("condition", ""),
                severity=data.get("severity", 0.0),
                emotion=data.get("emotion", ""),
            )
        )
    return history


# ---------------------------------------------------------------------------
# GET /api/chat/session/{session_id}
# Returns the full details of a single session.
# ---------------------------------------------------------------------------
@router.get("/session/{session_id}", response_model=AnalysisResult)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["uid"]
    db = firestore.client()

    doc = (
        db.collection("users")
          .document(uid)
          .collection("sessions")
          .document(session_id)
          .get()
    )
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found.")

    data = doc.to_dict()
    return AnalysisResult(**{k: data[k] for k in AnalysisResult.__fields__ if k in data})
