"""
pipeline.py
-----------
Master analysis pipeline:

    text  ->  Emotion (rule-based)
          ->  Condition (trained Random Forest, rule-based fallback)
          ->  Severity  (trained XGBoost,      rule-based fallback)
          ->  Crisis override (rule-based safety net, always on)
          ->  Response + remedies (varied, no immediate repeats)

The trained ML models drive condition & severity. If the model files are
missing, model_loader reports not-ready and we transparently fall back to
the original rule-based logic, so the app never breaks.

The crisis override is ALWAYS rule-based and runs on top of whatever the
models say — a probabilistic model must never be the only thing standing
between a user in danger and the helpline.
"""

import logging
import random

from ml_models.emotion_detector import detect_emotion
from ml_models import model_loader
from ml_models.responses import (
    RESPONSES,
    ISLAMIC_REMEDIES,
    CLINICAL_REMEDIES,
    CRISIS_RESPONSE,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rule-based fallbacks (used only if trained models are unavailable)
# ---------------------------------------------------------------------------
EMOTION_CONDITION_MAP = {
    "hopeless": {"Depression": 0.75, "Anxiety": 0.10, "Stress": 0.15},
    "sad":      {"Depression": 0.70, "Anxiety": 0.10, "Stress": 0.20},
    "fatigued": {"Depression": 0.60, "Anxiety": 0.15, "Stress": 0.25},
    "anxious":  {"Depression": 0.10, "Anxiety": 0.75, "Stress": 0.15},
    "stressed": {"Depression": 0.15, "Anxiety": 0.25, "Stress": 0.60},
    "angry":    {"Depression": 0.20, "Anxiety": 0.20, "Stress": 0.60},
    "neutral":  {"Depression": 0.20, "Anxiety": 0.20, "Stress": 0.60},
}
CONDITION_BASE_SEVERITY = {"Depression": 45, "Anxiety": 40, "Stress": 35}
EMOTION_SEVERITY_BOOST = {
    "hopeless": 20, "anxious": 15, "sad": 12,
    "fatigued": 10, "stressed": 8, "angry": 8, "neutral": -5,
}


def _fallback_condition(emotion: str) -> dict:
    scores = EMOTION_CONDITION_MAP.get(
        emotion, {"Depression": 0.33, "Anxiety": 0.33, "Stress": 0.34}
    )
    top = max(scores, key=scores.get)
    return {"condition": top, "confidence": round(scores[top], 3),
            "all_scores": scores}


def _fallback_severity(emotion: str, condition: str) -> dict:
    score = CONDITION_BASE_SEVERITY.get(
        condition, 35) + EMOTION_SEVERITY_BOOST.get(emotion, 0)
    score = round(max(5, min(95, score)), 1)
    if score <= 20:
        level = "Minimal"
    elif score <= 40:
        level = "Mild"
    elif score <= 60:
        level = "Moderate"
    elif score <= 80:
        level = "Moderately Severe"
    else:
        level = "Severe"
    return {"score": score, "level": level}


# ---------------------------------------------------------------------------
# Crisis override — ALWAYS rule-based, always runs
# ---------------------------------------------------------------------------
CRISIS_INDICATORS = [
    "جینے کا دل نہیں", "مرنا چاہتا", "مرنا چاہتی", "خودکشی", "خود کشی",
    "سب کچھ ختم کرنا", "زندگی ختم", "مجھے جینے کا کوئی مقصد",
    "اپنے آپ کو نقصان", "نہیں رہنا چاہتا",
    "suicidal", "suicide", "want to die", "kill myself", "end my life",
    "no reason to live", "self harm", "hurt myself", "dont want to exist",
    "marna chahta", "khudkushi", "jeene ka koi maqsad nahi",
]


def _is_crisis(text: str) -> bool:
    t = text.lower()
    return any(ind.lower() in t for ind in CRISIS_INDICATORS)


# ---------------------------------------------------------------------------
# No-repeat picker: avoid returning the same line twice in a row.
# _last_used remembers the previous pick per (condition, severity_key) bucket
# so consecutive identical responses don't happen within a session.
# ---------------------------------------------------------------------------
_last_used = {}


def _pick(pool: list, bucket_key: str) -> str:
    """Choose a random item from pool, avoiding the immediately previous pick."""
    if not pool:
        return ""
    if len(pool) == 1:
        return pool[0]
    last = _last_used.get(bucket_key)
    choices = [p for p in pool if p != last] or pool
    choice = random.choice(choices)
    _last_used[bucket_key] = choice
    return choice


def _percent_breakdown(scores: dict) -> dict:
    """Convert raw 0-1 probabilities into integer percentages that sum to ~100."""
    if not scores:
        return {}
    return {k: round(v * 100) for k, v in scores.items()}


def _pick_item(pool: list, bucket_key: str) -> dict:
    """Like _pick but for list-of-dicts (remedies with references). Avoids
    repeating the same item (by its text) twice in a row."""
    if not pool:
        return {"text": "", "reference": "", "verified": False}
    if len(pool) == 1:
        return pool[0]
    last = _last_used.get(bucket_key)
    choices = [p for p in pool if p["text"] != last] or pool
    choice = random.choice(choices)
    _last_used[bucket_key] = choice["text"]
    return choice


def run_pipeline(text: str) -> dict:
    logger.info("Pipeline started for: %s...", text[:50])

    # Stage 1 — Emotion (rule-based)
    emotion_result = detect_emotion(text)
    emotion = emotion_result["emotion"]

    # Stage 2 — Condition (trained model, fallback to rules)
    cond = model_loader.predict_condition(text)
    if cond is None:
        cond = _fallback_condition(emotion)
        cond_source = "rule-based"
    else:
        cond_source = "ml"
    condition = cond["condition"]

    # Stage 3 — Severity (trained model, fallback to rules)
    sev = model_loader.predict_severity(text)
    if sev is None:
        sev = _fallback_severity(emotion, condition)
        sev_source = "rule-based"
    else:
        sev_source = "ml"
    severity_score = sev["score"]
    severity_level = sev["level"]

    # Stage 4 — Crisis override (ALWAYS rule-based)
    is_crisis = _is_crisis(text)

    # Stage 5 — Response selection (varied, no immediate repeats)
    if severity_score <= 40:
        key = "low"
    elif severity_score <= 70:
        key = "medium"
    else:
        key = "high"

    pool = RESPONSES.get(condition, RESPONSES["Stress"]).get(key, [])
    response_text = _pick(pool, f"{condition}:{key}")

    # Islamic and clinical remedies are both dicts {text, reference, verified}.
    islamic_item = _pick_item(ISLAMIC_REMEDIES.get(
        condition, []), f"islamic:{condition}")
    clinical_item = _pick_item(CLINICAL_REMEDIES.get(
        condition, []), f"clinical:{condition}")

    # Crisis overrides the conversational reply with the fixed helpline message.
    if is_crisis:
        response_text = CRISIS_RESPONSE

    result = {
        "text": text,
        "emotion": emotion,
        "emotion_confidence": emotion_result["confidence"],
        "condition": condition,
        "condition_confidence": cond["confidence"],
        "condition_scores": cond.get("all_scores", {}),
        "condition_breakdown": _percent_breakdown(cond.get("all_scores", {})),
        "severity_percent": int(round(severity_score)),
        "severity_score": severity_score,
        "severity_level": severity_level,
        "is_crisis": is_crisis,
        "response_text": response_text,
        "islamic_remedy": islamic_item["text"],
        "islamic_reference": islamic_item["reference"],
        "islamic_verified": islamic_item["verified"],
        "clinical_remedy": clinical_item["text"],
        "clinical_reference": clinical_item["reference"],
        "clinical_verified": clinical_item["verified"],
        "model_source": {"condition": cond_source, "severity": sev_source},
    }
    logger.info("Pipeline complete: %s | %s | crisis=%s | source=%s",
                condition, severity_level, is_crisis, cond_source)
    return result
