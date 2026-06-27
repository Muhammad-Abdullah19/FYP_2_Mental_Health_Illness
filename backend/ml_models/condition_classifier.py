"""
condition_classifier.py
-----------------------
Classifies mental health condition from emotion + text.

Conditions: Depression, Anxiety, Stress
Method: Rule-based mapping (Phase 3)
Upgrade: Random Forest classifier in Phase 4
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Emotion to condition mapping
# Based on DSM-5 and clinical psychology guidelines
# ---------------------------------------------------------------------------
EMOTION_CONDITION_MAP = {
    "hopeless":  {"Depression": 0.75, "Anxiety": 0.10, "Stress": 0.15},
    "sad":       {"Depression": 0.70, "Anxiety": 0.10, "Stress": 0.20},
    "fatigued":  {"Depression": 0.60, "Anxiety": 0.15, "Stress": 0.25},
    "anxious":   {"Depression": 0.10, "Anxiety": 0.75, "Stress": 0.15},
    "stressed":  {"Depression": 0.15, "Anxiety": 0.25, "Stress": 0.60},
    "angry":     {"Depression": 0.20, "Anxiety": 0.20, "Stress": 0.60},
    "neutral":   {"Depression": 0.20, "Anxiety": 0.20, "Stress": 0.60},
}

# Additional Urdu text pattern boosters
CONDITION_TEXT_PATTERNS = {
    "Depression": [
        "مایوس", "ناامید", "جینے کا دل نہیں", "زندگی بیکار",
        "کچھ اچھا نہیں لگتا", "hopeless", "worthless", "no point living"
    ],
    "Anxiety": [
        "گھبراہٹ", "ڈر", "خوف", "بے چین", "پریشان",
        "panic", "fear", "worried", "cant stop thinking"
    ],
    "Stress": [
        "دباؤ", "بوجھ", "کام کا", "وقت نہیں", "مسائل",
        "overwhelmed", "too much", "deadline", "pressure"
    ]
}


def classify_condition(text: str, emotion: str) -> Dict:
    """
    Classifies the mental health condition based on
    detected emotion and text patterns.

    Parameters
    ----------
    text : str
        Original user text
    emotion : str
        Primary emotion detected by emotion_detector

    Returns
    -------
    dict with keys: condition, confidence, all_scores
    """
    logger.info(f"Classifying condition — emotion: {emotion}")

    text_lower = text.lower().strip()

    # Start with emotion-based probabilities
    base_scores = EMOTION_CONDITION_MAP.get(
        emotion,
        {"Depression": 0.33, "Anxiety": 0.33, "Stress": 0.34}
    ).copy()

    # Boost scores based on text patterns
    for condition, patterns in CONDITION_TEXT_PATTERNS.items():
        for pattern in patterns:
            if pattern in text_lower:
                base_scores[condition] += 0.15
                logger.debug(f"  Pattern boost: '{pattern}' → {condition}")

    # Normalize
    total = sum(base_scores.values())
    normalized = {c: round(s / total, 3) for c, s in base_scores.items()}

    # Get primary condition
    primary_condition = max(normalized, key=normalized.get)
    confidence = normalized[primary_condition]

    logger.info(f"Condition: {primary_condition} ({confidence:.1%})")
    logger.info(f"All scores: {normalized}")

    return {
        "condition": primary_condition,
        "confidence": round(confidence, 3),
        "all_scores": normalized
    }
