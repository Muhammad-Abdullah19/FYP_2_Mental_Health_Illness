"""
translate_kaggle.py
-------------------
Translates the filtered Kaggle splits (kaggle_train.csv / kaggle_test.csv)
into Urdu using Google Translate (deep-translator, free, no API key).

Key feature: PROGRESS-SAVING + RESUME. Translation of thousands of rows over
the network can fail partway. This script saves after every batch and, if
re-run, resumes from where it left off instead of starting over.

Both train and test are translated with the SAME translator so they live in
one consistent translation regime (this is what makes the later Urdu accuracy
number interpretable rather than confounded).

Output: kaggle_train_ur.csv, kaggle_test_ur.csv  (columns: text, condition)

Run:
    python translate_kaggle.py
    python translate_kaggle.py            # re-run to resume if it stopped
    python translate_kaggle.py --sample 20  # just preview 20 translations to eyeball quality
"""

import argparse
import os
import sys
import time
import pandas as pd


def get_translator():
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="en", target="ur")
    except ImportError:
        print("ERROR: deep-translator not installed. Run: pip install deep-translator")
        sys.exit(1)


def translate_one(translator, text, retries=3):
    """Translate a single string with retries. Truncate very long text to
    stay within the service limit (~5000 chars; we cap lower for safety)."""
    t = str(text).strip()
    if not t:
        return ""
    t = t[:1500]
    for attempt in range(retries):
        try:
            out = translator.translate(t)
            return out if out else t
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
            else:
                print(
                    f"    (failed after {retries} tries: {str(e)[:60]}) -> keeping English")
                return t
    return t


def translate_file(in_csv, out_csv, batch_size=25):
    """Translate one CSV with resume support."""
    src = pd.read_csv(in_csv, encoding="utf-8-sig")
    n = len(src)

    # Resume: if partial output exists, load it and continue
    if os.path.exists(out_csv):
        done = pd.read_csv(out_csv, encoding="utf-8-sig")
        start = len(done)
        translated = done["text"].tolist()
        conditions = done["condition"].tolist()
        print(
            f"  Resuming {os.path.basename(in_csv)}: {start}/{n} already done")
    else:
        start = 0
        translated = []
        conditions = []
        print(f"  Starting {os.path.basename(in_csv)}: {n} rows")

    if start >= n:
        print(f"  Already complete: {out_csv}")
        return

    translator = get_translator()
    t0 = time.time()

    for i in range(start, n):
        row = src.iloc[i]
        ur = translate_one(translator, row["text"])
        translated.append(ur)
        conditions.append(row["condition"])
        time.sleep(0.25)  # gentle rate-limit

        # Save after each batch so a crash loses at most batch_size rows
        if (i + 1) % batch_size == 0 or (i + 1) == n:
            pd.DataFrame({"text": translated, "condition": conditions}).to_csv(
                out_csv, index=False, encoding="utf-8-sig")
            elapsed = time.time() - t0
            rate = (i + 1 - start) / max(elapsed, 1)
            remaining = (n - (i + 1)) / max(rate, 0.01)
            print(f"    {i+1}/{n}  (~{remaining/60:.1f} min left)")

    print(f"  Done -> {out_csv}")


def sample_preview(in_csv, k):
    """Translate a few rows and print EN/UR side by side to eyeball quality."""
    src = pd.read_csv(in_csv, encoding="utf-8-sig").head(k)
    translator = get_translator()
    print(f"\nPreview of {k} translations from {os.path.basename(in_csv)}:\n")
    for _, row in src.iterrows():
        ur = translate_one(translator, row["text"])
        print(f"  [{row['condition']}]")
        print(f"    EN: {str(row['text'])[:90]}")
        print(f"    UR: {ur[:90]}")
        print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch-size", type=int, default=25)
    ap.add_argument("--sample", type=int, default=0,
                    help="If >0, only preview N translations (quality check, no full run)")
    args = ap.parse_args()

    if not os.path.exists("kaggle_train.csv") or not os.path.exists("kaggle_test.csv"):
        print("ERROR: run process_kaggle.py first to create kaggle_train.csv / kaggle_test.csv")
        sys.exit(1)

    if args.sample > 0:
        sample_preview("kaggle_train.csv", args.sample)
        return

    print("=" * 60)
    print("  TRANSLATING KAGGLE SPLITS -> URDU (with resume)")
    print("=" * 60)
    translate_file("kaggle_test.csv", "kaggle_test_ur.csv",
                   args.batch_size)   # smaller, do first
    translate_file("kaggle_train.csv", "kaggle_train_ur.csv", args.batch_size)
    print("\nAll done. Next: spot-check a few rows, then train on the Urdu files.")


if __name__ == "__main__":
    main()
