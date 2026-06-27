"""
emotion_detector.py
-------------------
Detects emotions from Urdu text using a rule-based approach
combined with multilingual sentiment analysis.

Phase 2 upgrade: Replace keyword matching with fine-tuned
mBERT model when training data is available.
"""

import logging
import re
from typing import Dict, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Urdu emotion keyword banks
# These cover common expressions used by Urdu speakers
# ---------------------------------------------------------------------------
EMOTION_KEYWORDS: Dict[str, List[str]] = {
    "hopeless": [
        "مایوس", "ناامید", "امید نہیں", "کوئی فائدہ نہیں",
        "سب ختم", "جینے کا دل نہیں", "تھک گیا", "تھک گئی",
        "بیکار", "ناکام", "ہار گیا", "ہار گئی", "زندگی بیکار"
    ],
    "anxious": [
        "پریشان", "گھبراہٹ", "ڈر", "خوف", "فکر", "بے چین",
        "اضطراب", "سکون نہیں", "نیند نہیں", "دل گھبراتا",
        "سانس پھولتی", "کانپنا", "دل دھڑکتا", "پریشانی"
    ],
    "sad": [
        "اداس", "غمگین", "رونا", "آنسو", "دکھ", "درد",
        "تکلیف", "دل ٹوٹا", "بہت برا لگ رہا", "دل بھاری",
        "غم", "رنج", "دل روتا", "اکیلا", "اکیلی"
    ],
    "angry": [
        "غصہ", "ناراض", "چڑچڑاپن", "غصہ آتا", "ناراضگی",
        "جھنجھلاہٹ", "برداشت نہیں", "تنگ آ گیا", "تنگ آ گئی"
    ],
    "fatigued": [
        "تھکاوٹ", "تھکا ہوا", "تھکی ہوئی", "سستی", "کمزوری",
        "توانائی نہیں", "کچھ کرنے کا دل نہیں", "بستر سے نہیں اٹھتا",
        "کام نہیں ہوتا", "ہمت نہیں"
    ],
    "stressed": [
        "دباؤ", "بوجھ", "ذمہ داری", "مسئلہ", "مشکل",
        "پریشانی", "سر درد", "کام کا بوجھ", "وقت نہیں",
        "سب کچھ بگڑ رہا", "مسائل"
    ],
    "neutral": [
        "ٹھیک ہوں", "اچھا ہوں", "ٹھیک ہے", "بس چل رہا ہے",
        "معمول", "نارمل"
    ]
}

# English keywords as fallback
EMOTION_KEYWORDS_EN: Dict[str, List[str]] = {
    "hopeless": [
        "hopeless", "no hope", "pointless", "useless", "worthless",
        "no point", "giving up", "cant go on", "end it all"
    ],
    "anxious": [
        "anxious", "anxiety", "worried", "nervous", "panic",
        "scared", "fear", "cant breathe", "heart racing", "restless"
    ],
    "sad": [
        "sad", "crying", "tears", "depressed", "unhappy",
        "miserable", "heartbroken", "lonely", "alone", "hurt"
    ],
    "angry": [
        "angry", "frustrated", "furious", "irritated", "annoyed",
        "rage", "mad", "cant stand"
    ],
    "fatigued": [
        "tired", "exhausted", "fatigue", "no energy", "weak",
        "drained", "cant get up", "no motivation", "lethargic"
    ],
    "stressed": [
        "stressed", "stress", "pressure", "overwhelmed", "burden",
        "too much", "cant cope", "deadline", "struggling"
    ],
    "neutral": [
        "fine", "okay", "alright", "good", "normal", "okay"
    ]
}


def detect_emotion(text: str) -> Dict:
    """
    Detects the primary emotion from Urdu or English text.

    Parameters
    ----------
    text : str
        Input text from user (Urdu or English)

    Returns
    -------
    dict with keys: emotion, confidence, all_scores
    """
    if not text or not text.strip():
        return {
            "emotion": "neutral",
            "confidence": 0.5,
            "all_scores": {"neutral": 0.5}
        }

    text_lower = text.lower().strip()
    logger.info(f"Detecting emotion for: {text_lower[:50]}...")

    scores: Dict[str, float] = {emotion: 0.0 for emotion in EMOTION_KEYWORDS}

    # Score Urdu keywords
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[emotion] += 1.0
                logger.debug(f"  Matched Urdu '{keyword}' → {emotion}")

    # Score English keywords as fallback
    for emotion, keywords in EMOTION_KEYWORDS_EN.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[emotion] += 0.8
                logger.debug(f"  Matched English '{keyword}' → {emotion}")

    # Get total score
    total = sum(scores.values())

    if total == 0:
        # No keywords matched — default to neutral
        logger.info("No keywords matched — defaulting to neutral")
        return {
            "emotion": "neutral",
            "confidence": 0.4,
            "all_scores": {e: 0.0 for e in scores}
        }

    # Normalize scores to percentages
    normalized = {e: round(s / total, 3) for e, s in scores.items()}

    # Get primary emotion
    primary_emotion = max(normalized, key=normalized.get)
    confidence = normalized[primary_emotion]

    logger.info(f"Detected emotion: {primary_emotion} ({confidence:.1%})")

    return {
        "emotion": primary_emotion,
        "confidence": round(confidence, 3),
        "all_scores": normalized
    }
