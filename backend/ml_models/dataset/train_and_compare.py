"""
train_and_compare.py
--------------------
Trains a NEW condition classifier on the real Kaggle training split, then
compares it against your EXISTING synthetic-trained model on the SAME real
Kaggle test split. Produces the comparison table for the paper.

Outputs new model files into ../saved_models_kaggle/ (kept SEPARATE so your
synthetic models in ../saved_models/ are never overwritten until you choose).

Run from backend/ml_models/dataset/ (venv active):
    python train_and_compare.py

Severity is untouched — this only concerns CONDITION classification.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import warnings
warnings.filterwarnings("ignore")

TRAIN_CSV = "kaggle_train.csv"
TEST_CSV = "kaggle_test.csv"
# your existing synthetic models
SYNTH_DIR = os.path.join("..", "saved_models")
KAGGLE_DIR = os.path.join("..", "saved_models_kaggle")  # new real-data models
os.makedirs(KAGGLE_DIR, exist_ok=True)

CLASSES = ["Anxiety", "Depression", "Stress"]


def build_vectorizer():
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5),
                           min_df=2, max_features=20000, lowercase=True)


def report(name, y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    print(f"\n--- {name} ---")
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print(classification_report(y_true, y_pred, labels=CLASSES,
                                target_names=CLASSES, zero_division=0))
    print("Confusion matrix (rows=actual, cols=predicted):", CLASSES)
    print(confusion_matrix(y_true, y_pred, labels=CLASSES))
    return acc


def main():
    print("=" * 60)
    print("  TRAIN ON REAL KAGGLE DATA  +  COMPARE WITH SYNTHETIC MODEL")
    print("=" * 60)

    train = pd.read_csv(TRAIN_CSV, encoding="utf-8-sig")
    test = pd.read_csv(TEST_CSV, encoding="utf-8-sig")
    print(f"\nTrain: {len(train)} rows | Test: {len(test)} rows")

    # ---------- Model A: train fresh on real Kaggle data ----------
    print("\n[1] Training NEW model on real Kaggle training data...")
    vec = build_vectorizer()
    Xtr = vec.fit_transform(train["text"].astype(str))
    le = LabelEncoder().fit(CLASSES)
    ytr = le.transform(train["condition"])

    rf = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=42,
                                class_weight="balanced")
    rf.fit(Xtr, ytr)

    joblib.dump(vec, os.path.join(KAGGLE_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(rf, os.path.join(KAGGLE_DIR, "random_forest.joblib"))
    joblib.dump(le, os.path.join(KAGGLE_DIR, "label_encoder.joblib"))
    print(f"Saved Kaggle-trained model -> {KAGGLE_DIR}")

    # Evaluate Model A on real test set
    Xte = vec.transform(test["text"].astype(str))
    pred_a = le.inverse_transform(rf.predict(Xte))
    acc_a = report(
        "Model A: Kaggle-trained, tested on real Kaggle test", test["condition"], pred_a)

    # ---------- Model B: existing synthetic model on same real test ----------
    print("\n[2] Evaluating EXISTING synthetic-trained model on the same real test...")
    acc_b = None
    try:
        svec = joblib.load(os.path.join(SYNTH_DIR, "tfidf_vectorizer.joblib"))
        srf = joblib.load(os.path.join(SYNTH_DIR, "random_forest.joblib"))
        sle = joblib.load(os.path.join(SYNTH_DIR, "label_encoder.joblib"))
        Xte_s = svec.transform(test["text"].astype(str))
        pred_b = sle.inverse_transform(srf.predict(Xte_s))
        acc_b = report(
            "Model B: Synthetic-trained, tested on real Kaggle test", test["condition"], pred_b)
    except FileNotFoundError:
        print(
            f"  (synthetic model not found in {SYNTH_DIR} — skipping comparison)")

    # ---------- Comparison table ----------
    print("\n" + "=" * 60)
    print("  COMPARISON SUMMARY (on the SAME real Kaggle test set)")
    print("=" * 60)
    print(f"  {'Model':<38}{'Real-data accuracy'}")
    print(f"  {'-'*56}")
    print(f"  {'Kaggle-trained (real data)':<38}{acc_a*100:.2f}%")
    if acc_b is not None:
        print(f"  {'Synthetic-trained (710 samples)':<38}{acc_b*100:.2f}%")
    print("=" * 60)
    print("\nFor the demo, deploy the Kaggle-trained model by copying the three")
    print("files from saved_models_kaggle/ into saved_models/ (severity untouched).")


if __name__ == "__main__":
    main()
