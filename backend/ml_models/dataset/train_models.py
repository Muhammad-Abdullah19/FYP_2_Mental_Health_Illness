"""
train_models.py  (torch-free version)
-------------------------------------
Trains a Random Forest condition classifier and an XGBoost severity
regressor on the Urdu mental-health dataset using TF-IDF features.

No PyTorch / transformers required — runs in seconds on CPU and is not
affected by the Windows Application Control DLL block.

Run once from inside the dataset/ folder (venv active):
    python train_models.py
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor
import warnings
warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Paths — models are saved one level up, in ml_models/saved_models/
# ---------------------------------------------------------------------------
DATASET_PATH = "urdu_mental_health_dataset.csv"
MODELS_DIR = os.path.join("..", "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# TF-IDF feature extractor
# char_wb n-grams work well for Urdu because they sidestep the need for a
# language-specific word tokenizer and capture sub-word patterns in both
# Urdu script and Roman/English text.
# ---------------------------------------------------------------------------
def build_vectorizer():
    return TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        min_df=1,
        max_features=5000,
        lowercase=True,
    )


def train_random_forest(X_train, X_test, y_train, y_test, label_encoder):
    print("\n" + "=" * 55)
    print("Random Forest — Condition Classifier")
    print("=" * 55)

    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\nTest accuracy: {acc:.4f} ({acc * 100:.2f}%)")
    print("\nClassification report:")
    print(classification_report(
        y_test, y_pred,
        labels=range(len(label_encoder.classes_)),
        target_names=label_encoder.classes_,
        zero_division=0,
    ))
    print("Confusion matrix (rows = actual, cols = predicted):")
    print("  ", list(label_encoder.classes_))
    print(confusion_matrix(y_test, y_pred,
          labels=range(len(label_encoder.classes_))))

    # Cross-validation on the full set gives a more stable read on tiny data
    cv = cross_val_score(rf, np.vstack([X_train, X_test]),
                         np.concatenate([y_train, y_test]), cv=5)
    print(f"\n5-fold CV accuracy: {cv.mean():.4f} (+/- {cv.std():.4f})")

    joblib.dump(rf, os.path.join(MODELS_DIR, "random_forest.joblib"))
    print(f"Saved -> {os.path.join(MODELS_DIR, 'random_forest.joblib')}")
    return rf, acc


def train_xgboost(X_train, X_test, y_train, y_test):
    print("\n" + "=" * 55)
    print("XGBoost — Severity Regressor (0-100)")
    print("=" * 55)

    xgb = XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        verbosity=0,
    )
    xgb.fit(X_train, y_train)

    y_pred = xgb.predict(X_test)
    mae = float(np.mean(np.abs(y_test - y_pred)))
    rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))

    print(f"\nMAE : {mae:.2f} points (out of 100)")
    print(f"RMSE: {rmse:.2f} points")
    print("\nSample predictions vs actual:")
    for i in range(min(6, len(y_test))):
        print(f"  predicted {y_pred[i]:5.1f}  |  actual {y_test[i]:5.1f}")

    joblib.dump(xgb, os.path.join(MODELS_DIR, "xgboost_severity.joblib"))
    print(f"\nSaved -> {os.path.join(MODELS_DIR, 'xgboost_severity.joblib')}")
    return xgb, mae


def main():
    print("=" * 60)
    print("NOOR-E-SHIFA  —  TF-IDF ML TRAINING  (torch-free)")
    print("=" * 60)

    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: {DATASET_PATH} not found. Run create_dataset.py first.")
        return

    df = pd.read_csv(DATASET_PATH, encoding="utf-8-sig")
    df = df.dropna(subset=["text", "condition", "severity_score"])
    print(f"\nLoaded {len(df)} samples")
    print(df["condition"].value_counts().to_string())

    # ---- Vectorize text once; reuse features for both models ----
    print("\nFitting TF-IDF vectorizer...")
    vectorizer = build_vectorizer()
    X = vectorizer.fit_transform(df["text"].tolist()).toarray()
    print(f"Feature matrix: {X.shape}")

    joblib.dump(vectorizer, os.path.join(
        MODELS_DIR, "tfidf_vectorizer.joblib"))
    print(f"Saved -> {os.path.join(MODELS_DIR, 'tfidf_vectorizer.joblib')}")

    # ---- Random Forest: condition ----
    le = LabelEncoder()
    y_cond = le.fit_transform(df["condition"])
    Xtr, Xte, ytr, yte = train_test_split(
        X, y_cond, test_size=0.2, random_state=42, stratify=y_cond
    )
    rf, rf_acc = train_random_forest(Xtr, Xte, ytr, yte, le)
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.joblib"))
    print(f"Saved -> {os.path.join(MODELS_DIR, 'label_encoder.joblib')}")

    # ---- XGBoost: severity ----
    y_sev = df["severity_score"].values.astype(float)
    Xtr2, Xte2, ytr2, yte2 = train_test_split(
        X, y_sev, test_size=0.2, random_state=42
    )
    xgb, xgb_mae = train_xgboost(Xtr2, Xte2, ytr2, yte2)

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"Random Forest accuracy: {rf_acc * 100:.2f}%")
    print(f"XGBoost severity MAE  : {xgb_mae:.2f} points")
    print(f"\nModels saved in: {os.path.abspath(MODELS_DIR)}")
    print("  - tfidf_vectorizer.joblib")
    print("  - random_forest.joblib")
    print("  - label_encoder.joblib")
    print("  - xgboost_severity.joblib")


if __name__ == "__main__":
    main()
