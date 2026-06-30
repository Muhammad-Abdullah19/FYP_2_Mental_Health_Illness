"""
clean_kaggle.py
---------------
Cleans the raw Kaggle text BEFORE splitting/translation/training.

The Suchintika Sarkar dataset is aggregated from Reddit and similar sources,
so the text contains URLs, markdown link syntax, HTML entities, Reddit
age/gender tags (e.g. "20M", "23F"), excessive whitespace, and some
incoherent fragments. Training on that noise hurts accuracy and produces
nonsense translations.

This applies standard text-normalisation and drops rows that are too short
or too noisy to be useful, then re-writes the balanced splits.

Run AFTER process_kaggle.py, BEFORE translate_kaggle.py / training:
    python clean_kaggle.py
Produces cleaned kaggle_train.csv / kaggle_test.csv (originals backed up).
"""

import os
import re
import shutil
import pandas as pd

URL_RE = re.compile(r"http\S+|www\.\S+")
MD_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")     # [text](url) -> text
MD_LEFTOVER_RE = re.compile(r"[\[\]\(\)]")
HTML_ENT_RE = re.compile(r"&[a-z]+;")                 # &amp; &gt; etc.
AGEGENDER_RE = re.compile(r"\b\d{1,2}\s?[MmFf]\b")    # 20M, 23 F
MULTISPACE_RE = re.compile(r"\s+")
NONWORD_RUN_RE = re.compile(r"[^\w\s.,!?'\"-]{2,}")   # runs of symbols


def clean_text(t: str) -> str:
    t = str(t)
    t = MD_LINK_RE.sub(r"\1", t)      # keep link label, drop url
    t = URL_RE.sub(" ", t)
    t = HTML_ENT_RE.sub(" ", t)
    t = AGEGENDER_RE.sub(" ", t)
    t = MD_LEFTOVER_RE.sub(" ", t)
    t = NONWORD_RUN_RE.sub(" ", t)
    t = MULTISPACE_RE.sub(" ", t).strip()
    return t


def looks_coherent(t: str) -> bool:
    """Heuristic: enough real words, reasonable length, not symbol soup."""
    if len(t) < 15:
        return False
    words = t.split()
    if len(words) < 4:
        return False
    # ratio of alphabetic tokens
    alpha = sum(1 for w in words if any(c.isalpha() for c in w))
    if alpha / len(words) < 0.6:
        return False
    return True


def clean_split(path):
    if not os.path.exists(path):
        print(f"  (skip, not found: {path})")
        return None
    df = pd.read_csv(path, encoding="utf-8-sig")
    before = len(df)
    df["text"] = df["text"].apply(clean_text)
    df = df[df["text"].apply(looks_coherent)].copy()
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    after = len(df)

    # back up original once, then overwrite
    bak = path.replace(".csv", "_raw.csv")
    if not os.path.exists(bak):
        shutil.copy(path, bak)
    df.to_csv(path, index=False, encoding="utf-8-sig")
    print(
        f"  {os.path.basename(path)}: {before} -> {after}  ({before-after} dropped)")
    print(f"    per class: {df['condition'].value_counts().to_dict()}")
    return df


def main():
    print("=" * 60)
    print("  CLEANING KAGGLE TEXT (URLs, markdown, Reddit tags, noise)")
    print("=" * 60)

    # show before/after on a few rows from train
    if os.path.exists("kaggle_train.csv"):
        sample = pd.read_csv("kaggle_train.csv", encoding="utf-8-sig").head(4)
        print("\nBefore -> after examples:")
        for _, r in sample.iterrows():
            c = clean_text(r["text"])
            print(f"  RAW : {str(r['text'])[:80]}")
            print(f"  CLEAN: {c[:80]}")
            print(f"  keep? {looks_coherent(c)}")
            print()

    print("Cleaning splits (originals backed up as *_raw.csv):")
    clean_split("kaggle_test.csv")
    clean_split("kaggle_train.csv")
    print("\nDone. Re-run train_and_compare.py for cleaned English results,")
    print("and translate_kaggle.py for cleaned Urdu.")


if __name__ == "__main__":
    main()
