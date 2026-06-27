"""
model_loader.py
---------------
Loads the trained TF-IDF vectorizer, Random Forest condition classifier,
XGBoost severity regressor, and label encoder ONCE at import time, then
exposes simple predict helpers used by pipeline.py.

If any model file is missing, the loader stays in a 'not ready' state and
predict_* functions return None, so pipeline.py can fall back to the
rule-based path instead of crashing.
"""

import os
import logging
import joblib
import numpy as np

logger = logging.getLogger(__name__)

# saved_models/ sits next to this file, inside ml_models/
_HERE = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_HERE, "saved_models")

_PATHS = {
    "vectorizer": os.path.join(_MODELS_DIR, "tfidf_vectorizer.joblib"),
    "rf":         os.path.join(_MODELS_DIR, "random_forest.joblib"),
    "xgb":        os.path.join(_MODELS_DIR, "xgboost_severity.joblib"),
    "encoder":    os.path.join(_MODELS_DIR, "label_encoder.joblib"),
}

_vectorizer = None
_rf = None
_xgb = None
_encoder = None
MODELS_READY = False


def _load():
    global _vectorizer, _rf, _xgb, _encoder, MODELS_READY
    missing = [name for name, p in _PATHS.items() if not os.path.exists(p)]
    if missing:
        logger.warning(
            "ML models not loaded — missing files: %s. "
            "Falling back to rule-based pipeline. "
            "Run train_models.py to generate them.", missing
        )
        MODELS_READY = False
        return
    try:
        _vectorizer = joblib.load(_PATHS["vectorizer"])
        _rf = joblib.load(_PATHS["rf"])
        _xgb = joblib.load(_PATHS["xgb"])
        _encoder = joblib.load(_PATHS["encoder"])
        MODELS_READY = True
        logger.info(
            "Trained ML models loaded successfully (RF + XGBoost + TF-IDF).")
    except Exception as e:
        logger.error(
            "Failed to load ML models: %s. Using rule-based fallback.", e)
        MODELS_READY = False


_load()


def _vectorize(text: str):
    return _vectorizer.transform([text]).toarray()


def predict_condition(text: str):
    """
    Returns dict {condition, confidence, all_scores} or None if models
    are unavailable.
    """
    if not MODELS_READY:
        return None
    try:
        X = _vectorize(text)
        proba = _rf.predict_proba(X)[0]
        classes = _encoder.inverse_transform(np.arange(len(proba)))
        scores = {cls: round(float(p), 3) for cls, p in zip(classes, proba)}
        top_idx = int(np.argmax(proba))
        condition = _encoder.inverse_transform([top_idx])[0]
        return {
            "condition": condition,
            "confidence": round(float(proba[top_idx]), 3),
            "all_scores": scores,
        }
    except Exception as e:
        logger.error("predict_condition failed: %s", e)
        return None


def predict_severity(text: str):
    """
    Returns dict {score, level} or None if models are unavailable.
    """
    if not MODELS_READY:
        return None
    try:
        X = _vectorize(text)
        raw = float(_xgb.predict(X)[0])
        score = round(max(5.0, min(95.0, raw)), 1)
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
    except Exception as e:
        logger.error("predict_severity failed: %s", e)
        return None
