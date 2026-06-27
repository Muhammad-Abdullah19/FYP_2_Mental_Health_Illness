"""
severity_scorer.py
------------------
Scores severity of mental health condition on 0-100 scale.

Method: Rule-based keyword intensity scoring (Phase 3)
Upgrade: XGBoost regressor in Phase 4
"""

import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Severity indicator words with weights
# Higher weight = more severe
# ---------------------------------------------------------------------------
HIGH_SEVERITY_INDICATORS: List[str] = [
    # Urdu - high severity
    "جینے کا دل نہیں", "مرنا چاہتا", "مرنا چاہتی", "خودکشی",
    "سب ختم کرنا", "زندگی ختم", "برداشت نہیں ہوتا",
    "بہت زیادہ تکلیف", "ناقابل برداشت",
    # English - high severity
    "suicidal", "want to die", "end my life", "cant take it anymore",
    "no reason to live", "self harm", "hurt myself"
]

MEDIUM_SEVERITY_INDICATORS: List[str] = [
    # Urdu - medium severity
    "بہت پریشان", "بہت اداس", "روتا رہتا", "روتی رہتی",
    "نیند نہیں آتی", "کھانا نہیں کھاتا", "گھر سے نہیں نکلتا",
    "کسی سے نہیں ملتا", "بہت تھکا ہوا",
    # English - medium severity
    "cant sleep", "not eating", "crying all the time",
    "cant leave home", "very depressed", "severe anxiety"
]

LOW_SEVERITY_INDICATORS: List[str] = [
    # Urdu - low severity
    "تھوڑا پریشان", "کبھی کبھی", "تھوڑا اداس", "ٹھیک نہیں",
    "کچھ مسائل", "تھوڑی پریشانی",
    # English - low severity
    "little worried", "sometimes", "slightly", "a bit sad",
    "not great", "some stress"
]

# Condition base severity ranges
CONDITION_BASE_SEVERITY = {
    "Depression": 45,
    "Anxiety": 40,
    "Stress": 35
}

# Emotion severity adjustments
EMOTION_SEVERITY_BOOST = {
    "hopeless": 20,
    "anxious":  15,
    "sad":      12,
    "fatigued": 10,
    "stressed":  8,
    "angry":     8,
    "neutral": -5
}


def calculate_severity(
    text: str,
    emotion: str,
    condition: str
) -> Dict:
    """
    Calculates severity score from 0 to 100.

    Severity scale:
        0  - 20  : Minimal
        21 - 40  : Mild
        41 - 60  : Moderate
        61 - 80  : Moderately Severe
        81 - 100 : Severe

    Parameters
    ----------
    text : str
        Original user input
    emotion : str
        Detected primary emotion
    condition : str
        Classified condition (Depression/Anxiety/Stress)

    Returns
    -------
    dict with keys: score, level, description
    """
    logger.info(
        f"Calculating severity — condition: {condition}, emotion: {emotion}")

    text_lower = text.lower().strip()

    # Start with base score for condition
    score = CONDITION_BASE_SEVERITY.get(condition, 35)

    # Add emotion boost
    emotion_boost = EMOTION_SEVERITY_BOOST.get(emotion, 0)
    score += emotion_boost
    logger.debug(
        f"  Base: {CONDITION_BASE_SEVERITY.get(condition, 35)}, emotion boost: +{emotion_boost}")

    # Check high severity indicators
    high_matches = 0
    for indicator in HIGH_SEVERITY_INDICATORS:
        if indicator in text_lower:
            high_matches += 1
            score += 15
            logger.warning(f"  HIGH severity indicator: '{indicator}'")

    # Check medium severity indicators
    for indicator in MEDIUM_SEVERITY_INDICATORS:
        if indicator in text_lower:
            score += 8
            logger.info(f"  MEDIUM severity indicator: '{indicator}'")

    # Check low severity indicators (reduce score)
    for indicator in LOW_SEVERITY_INDICATORS:
        if indicator in text_lower:
            score -= 5
            logger.debug(f"  LOW severity indicator: '{indicator}'")

    # Clamp between 5 and 95
    score = max(5, min(95, score))
    score = round(score, 1)

    # Determine level
    if score <= 20:
        level = "Minimal"
        description_ur = "آپ کی کیفیت معمولی ہے۔ خیال رکھیں۔"
        description_en = "Minimal symptoms. Keep taking care of yourself."
    elif score <= 40:
        level = "Mild"
        description_ur = "ہلکی علامات ہیں۔ کسی قریبی سے بات کریں۔"
        description_en = "Mild symptoms. Consider talking to someone you trust."
    elif score <= 60:
        level = "Moderate"
        description_ur = "اعتدال پسند علامات ہیں۔ ماہر سے مشورہ کریں۔"
        description_en = "Moderate symptoms. Speaking with a counselor is recommended."
    elif score <= 80:
        level = "Moderately Severe"
        description_ur = "شدید علامات ہیں۔ فوری طور پر ماہر نفسیات سے ملیں۔"
        description_en = "Moderately severe symptoms. Please seek professional help soon."
    else:
        level = "Severe"
        description_ur = "انتہائی شدید علامات۔ فوری طبی مدد لیں۔"
        description_en = "Severe symptoms. Please seek immediate professional help."

    # Extra warning for crisis indicators
    is_crisis = high_matches > 0

    logger.info(f"Severity score: {score} — Level: {level}")

    return {
        "score": score,
        "level": level,
        "description_ur": description_ur,
        "description_en": description_en,
        "is_crisis": is_crisis
    }
