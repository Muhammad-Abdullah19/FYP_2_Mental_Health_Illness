"""
mock_ai.py
----------
Stub implementation of the full Noor-e-Shifa ML pipeline.

This module returns realistic-looking analysis results WITHOUT running
any real models, so Phase 1 can be fully tested end-to-end while the
ML pipeline (Phase 2-4) is developed in parallel.

Replace the body of `analyze()` stage-by-stage:
  Stage 1  → Whisper-Small transcription
  Stage 2  → mBERT + CNN emotion detection
  Stage 3  → Random Forest condition classification
  Stage 4  → XGBoost severity regression
  Stage 5  → Rasa dialogue + Coqui TTS
  Stage 6  → Ayat al-Shifa + WHO/NIH remedy retrieval
"""

import random
from typing import Dict, Any


# ---------------------------------------------------------------------------
# Static remedy banks (will be replaced by Ayat al-Shifa dataset in Phase 6)
# ---------------------------------------------------------------------------
ISLAMIC_REMEDIES: Dict[str, str] = {
    "Depression": (
        "سورۃ الضحیٰ کی تلاوت کریں۔ اللہ تعالیٰ فرماتے ہیں: "
        "\"وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ\" "
        "(اور عنقریب تمہارا رب تمہیں اتنا دے گا کہ تم خوش ہو جاؤ گے۔) — الضحیٰ: 5"
    ),
    "Anxiety": (
        "ذکرِ الٰہی کریں: \"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ\" — "
        "\"اللہ کے ذکر ہی سے دلوں کو اطمینان ملتا ہے۔\" — الرعد: 28"
    ),
    "Stress": (
        "سورۃ الشرح کی تلاوت کریں: \"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا\" — "
        "\"بے شک ہر مشکل کے ساتھ آسانی ہے۔\" — الانشراح: 5"
    ),
}

CLINICAL_REMEDIES: Dict[str, str] = {
    "Depression": (
        "روزانہ 30 منٹ کی واک کریں، نیند کا باقاعدہ شیڈول بنائیں، "
        "اور کسی قابلِ اعتماد شخص سے اپنے جذبات شیئر کریں۔ "
        "CBT (Cognitive Behavioural Therapy) کے لیے کسی ماہرِ نفسیات سے رجوع کریں۔"
    ),
    "Anxiety": (
        "4-7-8 سانس لینے کی مشق کریں (4 سیکنڈ سانس لیں، 7 روکیں، 8 میں چھوڑیں)۔ "
        "کیفین کم کریں اور روزانہ mindfulness مراقبہ کریں۔"
    ),
    "Stress": (
        "وقت کا انتظام کریں — کام کی فہرست بنائیں اور حد مقرر کریں۔ "
        "جسمانی سرگرمی اور کافی نیند تناؤ کو نمایاں طور پر کم کرتی ہے۔"
    ),
}

DIALOGUE_RESPONSES: Dict[str, list] = {
    "Depression": [
        "آپ کے جذبات بالکل حقیقی ہیں۔ میں آپ کے ساتھ ہوں۔ یاد رکھیں، ہر رات کے بعد صبح ضرور آتی ہے۔",
        "آپ اکیلے نہیں ہیں۔ اللہ تعالیٰ نے فرمایا: \"مجھے یاد کرو، میں تمہیں یاد کروں گا۔\" آپ بہت قیمتی ہیں۔",
    ],
    "Anxiety": [
        "گہری سانس لیں۔ یہ لمحہ گزر جائے گا۔ آپ اس سے پہلے بھی مشکل وقت سے گزرے ہیں اور کامیاب رہے ہیں۔",
        "آپ کی فکریں سمجھ میں آتی ہیں۔ ذکرِ الٰہی سے دل کو سکون ملتا ہے — ابھی تھوڑا وقت صرف اپنے لیے نکالیں۔",
    ],
    "Stress": [
        "آپ بہت محنتی ہیں، لیکن اپنا خیال رکھنا بھی ضروری ہے۔ ایک قدم ایک وقت میں لیں۔",
        "مشکلات عارضی ہیں۔ اللہ نے وعدہ کیا ہے: ہر تنگی کے ساتھ آسانی ہے۔ آج آپ کو کیا چاہیے؟",
    ],
}

EMOTIONS: Dict[str, list] = {
    "Depression": ["hopeless", "fatigued", "sad", "withdrawn"],
    "Anxiety":    ["anxious", "fearful", "overwhelmed", "restless"],
    "Stress":     ["stressed", "frustrated", "tense", "irritable"],
}


# ---------------------------------------------------------------------------
# Public interface — replace this function body in Phase 2-6
# ---------------------------------------------------------------------------
def analyze(text: str) -> Dict[str, Any]:
    """
    Stub analysis pipeline.

    Parameters
    ----------
    text : str
        Urdu input text (from user typing or Whisper transcription).

    Returns
    -------
    dict
        Keys matching the AnalysisResult Pydantic model in routes_chat.py.
    """
    # ── Phase 3 replacement: Random Forest classifier ─────────────────────
    condition = random.choice(["Depression", "Anxiety", "Stress"])
    confidence = round(random.uniform(0.60, 0.95), 2)

    # ── Phase 4 replacement: XGBoost regressor ────────────────────────────
    severity = round(random.uniform(20.0, 75.0), 1)

    # ── Phase 2 replacement: mBERT + CNN emotion vector ───────────────────
    emotion = random.choice(EMOTIONS[condition])

    # ── Phase 5 replacement: Rasa dialogue manager ────────────────────────
    response_text = random.choice(DIALOGUE_RESPONSES[condition])

    # ── Phase 6 replacement: Ayat al-Shifa + WHO/NIH lookup ──────────────
    islamic_remedy  = ISLAMIC_REMEDIES[condition]
    clinical_remedy = CLINICAL_REMEDIES[condition]

    return {
        "transcription":   text,          # Phase 1: echo; Phase 2: Whisper output
        "emotion":         emotion,
        "condition":       condition,
        "confidence":      confidence,
        "severity":        severity,
        "response_text":   response_text,
        "islamic_remedy":  islamic_remedy,
        "clinical_remedy": clinical_remedy,
    }
