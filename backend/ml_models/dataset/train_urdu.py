"""
train_urdu.py
-------------
Trains a condition classifier on the TRANSLATED-URDU Kaggle training split and
evaluates it on the translated-Urdu test split (consistent translation regime).

Also reports two reference points for the paper:
  * the English Kaggle model's accuracy on the Urdu test set -> cross-lingual
    transfer, CLEARLY labelled as confounded by translation (for discussion only)
  * leaves the English and synthetic results untouched

Saves the Urdu model to ../saved_models_kaggle_ur/ (separate; nothing overwritten).

Run from backend/ml_models/dataset/ (venv active), AFTER translate_kaggle.py:
    python train_urdu.py
"""

import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import warnings
warnings.filterwarnings("ignore")

TRAIN_UR = "kaggle_train_ur.csv"
TEST_UR = "kaggle_test_ur.csv"
# English Kaggle model (for cross-lingual ref)
EN_DIR = os.path.join("..", "saved_models_kaggle")
UR_DIR = os.path.join("..", "saved_models_kaggle_ur")     # new Urdu model
os.makedirs(UR_DIR, exist_ok=True)
CLASSES = ["Anxiety", "Depression", "Stress"]


def build_vectorizer():
    # char_wb n-grams handle Urdu script directly
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5),
                           min_df=2, max_features=20000, lowercase=True)


def report(name, y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    print(f"\n--- {name} ---")
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print(classification_report(y_true, y_pred, labels=CLASSES,
                                target_names=CLASSES, zero_division=0))
    print("Confusion (rows=actual, cols=pred):", CLASSES)
    print(confusion_matrix(y_true, y_pred, labels=CLASSES))
    return acc


def main():
    if not os.path.exists(TRAIN_UR) or not os.path.exists(TEST_UR):
        print("ERROR: run translate_kaggle.py first to create the Urdu CSVs.")
        return

    print("=" * 60)
    print("  TRAIN ON TRANSLATED-URDU KAGGLE DATA")
    print("=" * 60)
    train = pd.read_csv(TRAIN_UR, encoding="utf-8-sig")
    test = pd.read_csv(TEST_UR, encoding="utf-8-sig")
    print(f"Train: {len(train)} | Test: {len(test)}")

    vec = build_vectorizer()
    Xtr = vec.fit_transform(train["text"].astype(str))
    le = LabelEncoder().fit(CLASSES)
    ytr = le.transform(train["condition"])
    rf = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=42,
                                class_weight="balanced")
    rf.fit(Xtr, ytr)
    joblib.dump(vec, os.path.join(UR_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(rf, os.path.join(UR_DIR, "random_forest.joblib"))
    joblib.dump(le, os.path.join(UR_DIR, "label_encoder.joblib"))
    print(f"Saved Urdu model -> {UR_DIR}")

    Xte = vec.transform(test["text"].astype(str))
    pred = le.inverse_transform(rf.predict(Xte))
    acc_ur = report(
        "Urdu-trained, tested on Urdu (machine-translated)", test["condition"], pred)

    # Cross-lingual reference (CONFOUNDED — discussion only)
    acc_cross = None
    try:
        evec = joblib.load(os.path.join(EN_DIR, "tfidf_vectorizer.joblib"))
        erf = joblib.load(os.path.join(EN_DIR, "random_forest.joblib"))
        ele = joblib.load(os.path.join(EN_DIR, "label_encoder.joblib"))
        pred_x = ele.inverse_transform(erf.predict(
            evec.transform(test["text"].astype(str))))
        acc_cross = report(
            "English model on Urdu test (cross-lingual, CONFOUNDED)", test["condition"], pred_x)
    except FileNotFoundError:
        pass

    print("\n" + "=" * 60)
    print("  URDU RESULTS SUMMARY")
    print("=" * 60)
    print(
        f"  Urdu-trained on Urdu test            {acc_ur*100:.2f}%   <- report this")
    if acc_cross is not None:
        print(
            f"  English model on Urdu test           {acc_cross*100:.2f}%   (confounded; discussion only)")
    print("=" * 60)
    print("Note: Urdu data is machine-translated Kaggle text. State this clearly.")
    print("Native-Urdu data collection remains the key future-work step.")


if __name__ == "__main__":
    main()
