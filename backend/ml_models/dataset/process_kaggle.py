"""
process_kaggle.py
-----------------
Processes Suchintika Sarkar's "Sentiment Analysis for Mental Health" Kaggle
dataset (Combined Data.csv) into clean train/test splits for CONDITION
classification only.

What it does:
  * keeps Depression / Anxiety / Stress
  * drops Bipolar, Personality disorder, Suicidal, Normal, and anything else
  * cleans empty / very short rows and duplicates
  * balances the three classes
  * splits 80/20 into kaggle_train.csv and kaggle_test.csv

Deliberately NObody manufactures a severity score here: the Kaggle data has
real human-assigned CONDITION labels but no severity labels, so we use it only
for condition classification. Severity stays on the synthetic model.

Output columns: text, condition
Run:
    python process_kaggle.py --input "Combined Data.csv"
    python process_kaggle.py --input "Combined Data.csv" --per-class 6000
"""

import argparse
import sys
import pandas as pd
from sklearn.model_selection import train_test_split

# Map raw Kaggle labels -> our three conditions. None = drop.
CONDITION_MAP = {
    "depression": "Depression",
    "anxiety": "Anxiety",
    "stress": "Stress",
    # explicitly dropped
    "normal": None,
    "bipolar": None,
    "personality disorder": None,
    "suicidal": None,   # suicidality is not a synonym for depression -> drop, keep classes clean
}


def detect_columns(df):
    text_col = cond_col = None
    for c in df.columns:
        cl = c.lower()
        if text_col is None and ("text" in cl or "statement" in cl or "post" in cl):
            text_col = c
        if cond_col is None and ("status" in cl or "condition" in cl or "label" in cl or "mental" in cl):
            cond_col = c
    return text_col, cond_col


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Path to Combined Data.csv")
    ap.add_argument("--per-class", type=int, default=6000,
                    help="Max samples per condition after balancing (default 6000)")
    ap.add_argument("--test-size", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    print("=" * 60)
    print("  KAGGLE PROCESSING  (condition-only, no manufactured severity)")
    print("=" * 60)

    # ---- load ----
    try:
        df = pd.read_csv(args.input, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(args.input, encoding="latin-1")
    print(f"\nLoaded {len(df)} rows. Columns: {list(df.columns)}")

    text_col, cond_col = detect_columns(df)
    if not text_col or not cond_col:
        print(
            f"ERROR: could not detect text/condition columns. Found: {list(df.columns)}")
        sys.exit(1)
    print(f"Text column: '{text_col}'  |  Condition column: '{cond_col}'")

    print("\nOriginal label distribution:")
    print(df[cond_col].astype(str).value_counts().to_string())

    # ---- map + filter ----
    df["condition"] = df[cond_col].astype(
        str).str.lower().str.strip().map(CONDITION_MAP)
    df = df[df["condition"].notna()].copy()
    df = df[df[text_col].notna()].copy()
    df["text"] = df[text_col].astype(str).str.strip()
    df = df[df["text"].str.len() > 10].copy()
    df = df.drop_duplicates(subset=["text"]).copy()

    print("\nAfter filtering to Depression/Anxiety/Stress + cleaning:")
    print(df["condition"].value_counts().to_string())

    if df.empty:
        print("ERROR: no rows left after filtering.")
        sys.exit(1)

    # ---- balance ----
    per_class = min(args.per_class, df["condition"].value_counts().min())
    print(f"\nBalancing to {per_class} per class...")
    parts = []
    for cond, g in df.groupby("condition"):
        parts.append(g.sample(min(len(g), per_class), random_state=args.seed))
    df_bal = pd.concat(parts).sample(
        frac=1, random_state=args.seed).reset_index(drop=True)
    print("Balanced distribution:")
    print(df_bal["condition"].value_counts().to_string())
    print(f"Total balanced: {len(df_bal)}")

    df_bal = df_bal[["text", "condition"]]

    # ---- split ----
    train_df, test_df = train_test_split(
        df_bal, test_size=args.test_size, random_state=args.seed,
        stratify=df_bal["condition"]
    )
    train_df.to_csv("kaggle_train.csv", index=False, encoding="utf-8-sig")
    test_df.to_csv("kaggle_test.csv", index=False, encoding="utf-8-sig")

    print(
        f"\nWrote kaggle_train.csv ({len(train_df)} rows) and kaggle_test.csv ({len(test_df)} rows)")
    print("Train per class:")
    print(train_df["condition"].value_counts().to_string())
    print("Test per class:")
    print(test_df["condition"].value_counts().to_string())
    print("\nDone. Columns in both files: text, condition")


if __name__ == "__main__":
    main()
