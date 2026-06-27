"""
firestore_service.py
--------------------
Thin helper around Firestore for saving and reading analysis sessions.

Sessions are stored at:
    users/{uid}/sessions/{auto_id}

Each session document:
    {
        "condition": "Anxiety",
        "condition_confidence": 0.81,
        "severity_percent": 61,
        "severity_level": "Moderately Severe",
        "emotion": "anxious",
        "is_crisis": false,
        "text_preview": "first ~80 chars of the user's message",
        "created_at": <server timestamp>
    }

We store only a short preview of the text (not the full message) to respect
user privacy — the dashboard needs the scores and time, not the raw content.
"""

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _db():
    # Imported lazily so this module doesn't require firebase at import time
    from firebase_admin import firestore
    return firestore.client()


def save_session(uid: str, analysis: dict) -> bool:
    """
    Save one analysis result under the user's sessions collection.
    Returns True on success, False on failure (never raises — saving a
    session must never break the chat response).
    """
    if not uid:
        return False
    try:
        from firebase_admin import firestore
        db = _db()
        doc = {
            "condition": analysis.get("condition"),
            "condition_confidence": float(analysis.get("condition_confidence", 0)),
            "severity_percent": int(analysis.get("severity_percent", 0)),
            "severity_level": analysis.get("severity_level"),
            "emotion": analysis.get("emotion"),
            "is_crisis": bool(analysis.get("is_crisis", False)),
            "text_preview": (analysis.get("text") or "")[:80],
            "created_at": firestore.SERVER_TIMESTAMP,
        }
        db.collection("users").document(uid).collection("sessions").add(doc)
        # also bump a sessions_count on the user doc (best-effort)
        try:
            db.collection("users").document(uid).set(
                {"sessions_count": firestore.Increment(1)}, merge=True
            )
        except Exception as e:
            logger.warning(
                "sessions_count increment failed (non-blocking): %s", e)
        logger.info("Saved session for uid=%s (%s, %s%%)",
                    uid, doc["condition"], doc["severity_percent"])
        return True
    except Exception as e:
        logger.error("save_session failed (non-blocking): %s", e)
        return False


def get_sessions(uid: str, limit: int = 100) -> list:
    """
    Return the user's sessions, oldest-first (good for plotting a time line).
    Each item is JSON-serialisable (timestamps -> ISO strings).
    """
    if not uid:
        return []
    try:
        from firebase_admin import firestore
        db = _db()
        q = (db.collection("users").document(uid).collection("sessions")
             .order_by("created_at", direction=firestore.Query.ASCENDING)
             .limit(limit))
        out = []
        for snap in q.stream():
            d = snap.to_dict() or {}
            ts = d.get("created_at")
            # Firestore returns a DatetimeWithNanoseconds; make it ISO
            if hasattr(ts, "isoformat"):
                created_iso = ts.isoformat()
            else:
                created_iso = None
            out.append({
                "id": snap.id,
                "condition": d.get("condition"),
                "condition_confidence": d.get("condition_confidence"),
                "severity_percent": d.get("severity_percent"),
                "severity_level": d.get("severity_level"),
                "emotion": d.get("emotion"),
                "is_crisis": d.get("is_crisis", False),
                "text_preview": d.get("text_preview", ""),
                "created_at": created_iso,
            })
        return out
    except Exception as e:
        logger.error("get_sessions failed: %s", e)
        return []


def get_summary(sessions: list) -> dict:
    """Compute small dashboard summary cards from a list of sessions."""
    if not sessions:
        return {
            "total_sessions": 0,
            "most_common_condition": None,
            "latest_severity": None,
            "average_severity": None,
            "trend": None,  # "improving" | "worsening" | "steady"
        }
    conditions = [s["condition"] for s in sessions if s.get("condition")]
    most_common = max(
        set(conditions), key=conditions.count) if conditions else None
    sevs = [s["severity_percent"]
            for s in sessions if s.get("severity_percent") is not None]
    latest = sevs[-1] if sevs else None
    avg = round(sum(sevs) / len(sevs), 1) if sevs else None

    trend = "steady"
    if len(sevs) >= 4:
        half = len(sevs) // 2
        first_avg = sum(sevs[:half]) / half
        second_avg = sum(sevs[half:]) / (len(sevs) - half)
        diff = second_avg - first_avg
        if diff <= -5:
            trend = "improving"
        elif diff >= 5:
            trend = "worsening"

    return {
        "total_sessions": len(sessions),
        "most_common_condition": most_common,
        "latest_severity": latest,
        "average_severity": avg,
        "trend": trend,
    }
