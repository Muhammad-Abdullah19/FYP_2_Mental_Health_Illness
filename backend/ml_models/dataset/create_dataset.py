"""
create_dataset.py  (expanded)
-----------------------------
Generates a synthetic Urdu / Roman-Urdu / English mental-health dataset
for training the condition classifier (Random Forest) and severity
regressor (XGBoost).

Design goals for honest results:
  * Maximise DISTINCT phrasings per (condition, severity), not raw count.
  * Build sentences compositionally from many parts so variety is real,
    not template-cloning.
  * De-duplicate, then report how unique the final set is so you can SEE
    whether the data is genuinely varied (and quote that in your paper).

Run from inside the dataset/ folder:
    python create_dataset.py
    python create_dataset.py --target 1200      # optional: pick a size
"""

import argparse
import random
import os
import pandas as pd

random.seed(42)  # reproducible dataset (important to state in your paper)

# ===========================================================================
# Building blocks.
# Each condition x severity has multiple CORE expressions plus interchangeable
# openers / intensifiers / endings, so combinations create genuine variety.
# Urdu, Roman-Urdu, and English are all included to match real user input.
# ===========================================================================

OPENERS = {
    "ur": ["", "آج کل ", "کچھ دنوں سے ", "سچ کہوں تو ", "پتا نہیں کیوں ", "اکثر ", "ان دنوں ", "بس "],
    "roman": ["", "aaj kal ", "kuch dino se ", "sach kahun to ", "pata nahi kyun ", "aksar ", "in dino "],
    "en": ["", "lately ", "these days ", "honestly ", "for some reason ", "often ", "recently "],
}

CONNECTORS = {
    "ur": [" اور ", " اس لیے ", " کیونکہ ", "، "],
    "roman": [" aur ", " is liye ", " kyunke ", ", "],
    "en": [" and ", " so ", " because ", ", "],
}

# CORE phrases: the heart of the variety. Many distinct ways to say each thing.
CORE = {
    "Depression": {
        "low": {
            "ur": ["میں آج کچھ اداس ہوں", "دل تھوڑا بھاری ہے", "کسی کام میں دل نہیں لگ رہا", "تھوڑی اداسی ہے", "آج موڈ ٹھیک نہیں", "دل بجھا بجھا سا ہے", "کچھ کھویا کھویا محسوس کر رہا ہوں", "تھوڑا تنہا محسوس ہو رہا ہے", "دل اداس ہے مگر سنبھل جاؤں گا", "آج خوشی محسوس نہیں ہو رہی"],
            "roman": ["main thora udaas hoon", "dil thora bhari hai", "kisi kaam mein dil nahi lag raha", "aaj mood theek nahi", "thori udaasi hai", "dil bujha bujha sa hai", "khud ko akela mehsoos kar raha hoon"],
            "en": ["i feel a little sad today", "feeling a bit down", "not really in the mood for anything", "feeling slightly low", "today feels grey", "feeling a little empty", "feeling somewhat lonely"],
        },
        "medium": {
            "ur": ["کئی دنوں سے بہت اداس ہوں", "کسی سے ملنے کا دل نہیں کرتا", "رات کو نیند نہیں آتی", "کھانے کا بھی دل نہیں کرتا", "زندگی میں خوشی نہیں رہی", "روزانہ رونے کو دل کرتا ہے", "مجھے لگتا ہے میں کسی کام کا نہیں", "ہر چیز بے معنی لگتی ہے", "خود سے نفرت سی ہونے لگی ہے", "دن بھر بستر سے نکلنے کا دل نہیں"],
            "roman": ["kai dino se bohot udaas hoon", "kisi se milne ka dil nahi karta", "raat ko neend nahi aati", "khane ka bhi dil nahi karta", "zindagi mein khushi nahi rahi", "rozana rone ko dil karta hai", "khud bekaar lagta hoon", "har cheez bemaani lagti hai"],
            "en": ["i have been very sad for days", "i dont feel like meeting anyone", "i cant sleep at night", "i have lost my appetite", "nothing brings me joy anymore", "i cry almost every day", "i feel worthless", "everything feels meaningless"],
        },
        "high": {
            "ur": ["مجھے جینے کا کوئی مقصد نظر نہیں آتا", "میں اس زندگی سے تھک چکا ہوں", "کاش میں یہاں نہ ہوتا", "مجھے لگتا ہے میں سب کے لیے بوجھ ہوں", "اب اور برداشت نہیں ہوتا", "ہر طرف اندھیرا لگتا ہے", "سب کچھ بے سود لگتا ہے", "میں اب اور نہیں چل سکتا"],
            "roman": ["mujhe jeene ka koi maqsad nazar nahi aata", "main is zindagi se thak chuka hoon", "kaash main yahan na hota", "main sab ke liye bojh hoon", "ab aur bardasht nahi hota", "har taraf andhera lagta hai"],
            "en": ["i see no reason to live", "i am so tired of this life", "i wish i was not here", "i feel like a burden to everyone", "i cant take it anymore", "everything feels dark and hopeless"],
        },
    },
    "Anxiety": {
        "low": {
            "ur": ["مجھے کل کی تھوڑی فکر ہے", "ہلکی سی گھبراہٹ ہو رہی ہے", "تھوڑا نروس محسوس کر رہا ہوں", "امتحان کی تھوڑی پریشانی ہے", "دل تھوڑا بے چین ہے", "کچھ کھٹکا سا لگا ہوا ہے"],
            "roman": ["mujhe kal ki thori fikr hai", "halki si ghabrahat ho rahi hai", "thora nervous mehsoos kar raha hoon", "exam ki thori pareshani hai", "dil thora bechain hai"],
            "en": ["im a little worried about tomorrow", "feeling slightly anxious", "a bit nervous about the exam", "feeling a little on edge", "slightly uneasy today"],
        },
        "medium": {
            "ur": ["میں ہر وقت پریشان رہتا ہوں", "دل بہت زور سے دھڑکتا ہے", "فکروں کی وجہ سے نیند نہیں آتی", "ہر وقت ڈر لگا رہتا ہے", "جب گھبراتا ہوں تو سانس پھولنے لگتی ہے", "لگتا ہے کچھ برا ہونے والا ہے", "دماغ میں فکریں رکتی ہی نہیں", "ہاتھ کانپنے لگتے ہیں"],
            "roman": ["main har waqt pareshan rehta hoon", "dil bohot zor se dharakta hai", "fikron ki wajah se neend nahi aati", "har waqt darr laga rehta hai", "saans phoolne lagti hai", "lagta hai kuch bura hone wala hai", "dimagh mein fikrein rukti hi nahi"],
            "en": ["i feel anxious all the time", "my heart races constantly", "worry keeps me up at night", "i live with constant fear", "i get short of breath when nervous", "i feel like something bad will happen", "my mind never stops worrying"],
        },
        "high": {
            "ur": ["مجھے پینک اٹیک آتے ہیں", "خوف کی وجہ سے گھر سے نہیں نکل سکتا", "دل اتنا تیز دھڑکتا ہے کہ لگتا ہے مر جاؤں گا", "میں بالکل بے قابو ہو جاتا ہوں", "ہر چیز سے ڈر لگنے لگا ہے", "گھبراہٹ میں ہاتھ پاؤں سن ہو جاتے ہیں"],
            "roman": ["mujhe panic attack aate hain", "khauf ki wajah se ghar se nahi nikal sakta", "dil itna tez dharakta hai ke lagta hai mar jaunga", "main bilkul beqaboo ho jata hoon", "har cheez se darr lagne laga hai"],
            "en": ["i get panic attacks regularly", "i cant leave home because of fear", "my heart pounds so hard i feel like im dying", "i completely lose control", "i am afraid of everything now"],
        },
    },
    "Stress": {
        "low": {
            "ur": ["آج کام کچھ زیادہ ہے", "تھوڑا دباؤ محسوس ہو رہا ہے", "ڈیڈ لائن قریب آ رہی ہے", "آج کا دن کافی مصروف تھا", "کام سے تھوڑا تھکا ہوا ہوں"],
            "roman": ["aaj kaam kuch zyada hai", "thora dabao mehsoos ho raha hai", "deadline qareeb aa rahi hai", "aaj ka din kaafi masroof tha", "kaam se thora thaka hua hoon"],
            "en": ["work is a bit heavy today", "feeling some pressure", "a deadline is coming up", "today was quite busy", "a little worn out from work"],
        },
        "medium": {
            "ur": ["کام کا بوجھ بہت بڑھ گیا ہے", "سب کچھ ایک ساتھ سنبھالنا مشکل ہو رہا ہے", "گھر اور کام دونوں کا دباؤ ہے", "ہر وقت سر درد رہتا ہے", "بہت زیادہ تھکاوٹ محسوس ہوتی ہے", "کام کی فکر میں نیند خراب رہتی ہے", "لگتا ہے وقت کم پڑ رہا ہے"],
            "roman": ["kaam ka bojh bohot barh gaya hai", "sab kuch ek saath sambhalna mushkil ho raha hai", "ghar aur kaam dono ka dabao hai", "har waqt sar dard rehta hai", "bohot thakawat mehsoos hoti hai", "kaam ki fikr mein neend kharab rehti hai"],
            "en": ["my workload has become too much", "its hard to manage everything at once", "pressure from both home and work", "i have constant headaches", "i feel exhausted all the time", "worry about work ruins my sleep"],
        },
        "high": {
            "ur": ["میں بالکل ٹوٹ چکا ہوں", "اب مجھ سے کچھ نہیں ہوتا", "میری زندگی میں سب کچھ بکھر رہا ہے", "اب اور برداشت نہیں ہوتا", "ہر طرف سے مسائل گھیرے ہوئے ہیں", "ایسا لگتا ہے میں بکھرنے والا ہوں"],
            "roman": ["main bilkul toot chuka hoon", "ab mujhse kuch nahi hota", "meri zindagi mein sab kuch bikhar raha hai", "ab aur bardasht nahi hota", "har taraf se masail ghere hue hain"],
            "en": ["i am completely broken", "i cant do this anymore", "everything in my life is falling apart", "im at my breaking point", "problems are closing in from every side"],
        },
    },
}

SEVERITY_BASE = {"low": 25, "medium": 55, "high": 80}
LANGS = ["ur", "roman", "en"]


def make_sentence(condition, level):
    """Compose one sentence from interchangeable parts to maximise variety."""
    lang = random.choice(LANGS)
    core_pool = CORE[condition][level][lang]
    base = random.choice(core_pool)

    parts = []
    # ~50% chance of an opener
    if random.random() < 0.5:
        parts.append(random.choice(OPENERS[lang]))
    parts.append(base)
    # ~35% chance to chain a second core phrase from the SAME bucket
    if random.random() < 0.35:
        second = random.choice(core_pool)
        if second != base:
            parts.append(random.choice(CONNECTORS[lang]) + second)

    text = "".join(parts).strip()
    # tidy double spaces
    text = " ".join(text.split())
    return text, lang


def build(target):
    rows = []
    conditions = list(CORE.keys())
    levels = ["low", "medium", "high"]

    # round-robin so classes stay balanced regardless of target size
    attempts = 0
    max_attempts = target * 40
    while len(rows) < target and attempts < max_attempts:
        attempts += 1
        condition = conditions[len(rows) % len(conditions)]
        level = random.choice(levels)
        text, lang = make_sentence(condition, level)
        sev = round(
            max(5, min(95, SEVERITY_BASE[level] + random.uniform(-9, 9))), 1)
        rows.append({
            "text": text,
            "condition": condition,
            "severity_level": level,
            "severity_score": sev,
            "language": "ur" if lang == "ur" else ("roman" if lang == "roman" else "en"),
        })

    df = pd.DataFrame(rows)

    # ---- De-duplicate: keep results honest ----
    before = len(df)
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    after = len(df)
    return df, before, after


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", type=int, default=1000,
                    help="number of samples to generate before de-duplication")
    ap.add_argument("--out", type=str,
                    default="urdu_mental_health_dataset.csv")
    args = ap.parse_args()

    df, before, after = build(args.target)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

    df.to_csv(args.out, index=False, encoding="utf-8-sig")

    dup_removed = before - after
    uniq_pct = (after / before * 100) if before else 0

    print("=" * 55)
    print("DATASET CREATED")
    print("=" * 55)
    print(f"File              : {args.out}")
    print(f"Requested target  : {args.target}")
    print(f"Unique samples    : {after}")
    print(
        f"Duplicates removed: {dup_removed}  ({100 - uniq_pct:.1f}% of generated)")
    print()
    print("Condition balance:")
    print(df["condition"].value_counts().to_string())
    print()
    print("Severity levels:")
    print(df["severity_level"].value_counts().to_string())
    print()
    print("Language mix:")
    print(df["language"].value_counts().to_string())
    print()
    # Honesty check the examiner will love you for reporting:
    if uniq_pct < 70:
        print("⚠  NOTE: high duplication — the template variety is the ceiling.")
        print("   Raising --target much higher will mostly add duplicates, not")
        print("   genuine variety. Add more CORE phrases to grow further honestly.")
    else:
        print(f"✓ {uniq_pct:.0f}% of generated rows were unique — healthy variety.")
    print()
    print("Sample rows:")
    print(df.head(8).to_string())


if __name__ == "__main__":
    main()
