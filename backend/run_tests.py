"""
run_tests.py
------------
Run from backend/ folder:
    python run_tests.py
"""

import os
import sys

# Already in backend/ so no path manipulation needed
from ml_models.pipeline import run_pipeline

TEST_CASES = [
    {
        "input": "میں کئی دنوں سے بہت اداس ہوں",
        "expected_condition": "Depression",
        "expected_severity": "medium",
        "description": "Urdu — Depression medium"
    },
    {
        "input": "مجھے جینے کا کوئی مقصد نظر نہیں آتا",
        "expected_condition": "Depression",
        "expected_severity": "high",
        "description": "Urdu — Depression CRISIS"
    },
    {
        "input": "i feel worthless and i cry every day",
        "expected_condition": "Depression",
        "expected_severity": "medium",
        "description": "English — Depression medium"
    },
    {
        "input": "مجھے بہت گھبراہٹ ہو رہی ہے",
        "expected_condition": "Anxiety",
        "expected_severity": "medium",
        "description": "Urdu — Anxiety medium"
    },
    {
        "input": "main har waqt pareshan rehta hoon",
        "expected_condition": "Anxiety",
        "expected_severity": "medium",
        "description": "Roman Urdu — Anxiety"
    },
    {
        "input": "I have panic attacks regularly",
        "expected_condition": "Anxiety",
        "expected_severity": "high",
        "description": "English — Anxiety high"
    },
    {
        "input": "کام کا بوجھ بہت زیادہ ہو گیا ہے",
        "expected_condition": "Stress",
        "expected_severity": "medium",
        "description": "Urdu — Stress medium"
    },
    {
        "input": "I am completely overwhelmed",
        "expected_condition": "Stress",
        "expected_severity": "high",
        "description": "English — Stress high"
    },
    {
        "input": "آج کام بہت زیادہ ہے",
        "expected_condition": "Stress",
        "expected_severity": "medium",
        "description": "Urdu — Stress low"
    },
    {
        "input": "میں آج تھوڑا اداس ہوں",
        "expected_condition": "Depression",
        "expected_severity": "low",
        "description": "Urdu — Depression low"
    },
    {
        "input": "main marna chahta hoon",
        "expected_condition": "any",
        "expected_severity": "crisis",
        "description": "Roman Urdu — CRISIS TEST"
    },
    {
        "input": "i see no reason to live anymore",
        "expected_condition": "any",
        "expected_severity": "crisis",
        "description": "English — CRISIS TEST"
    },
]


def run_tests():
    print("\n" + "=" * 60)
    print("  NOOR-E-SHIFA ML PIPELINE TEST SUITE")
    print("=" * 60)

    passed = 0
    failed = 0
    crisis_passed = 0
    crisis_total = 0

    severity_ranges = {
        'low':    (0,  40),
        'medium': (35, 70),
        'high':   (60, 100)
    }

    for i, test in enumerate(TEST_CASES, 1):
        print(f"\nTest {i}/{len(TEST_CASES)}: {test['description']}")
        print(f"  Input: {test['input'][:55]}...")

        try:
            result = run_pipeline(test['input'])

            condition = result['condition']
            sev_score = result['severity_score']
            sev_level = result['severity_level']
            is_crisis = result['is_crisis']
            source = result.get('model_source', 'unknown')
            conf = result.get('condition_confidence', 0)

            print(f"  Condition:  {condition} ({conf*100:.0f}%)")
            print(f"  Severity:   {sev_score:.1f} — {sev_level}")
            print(f"  Crisis:     {is_crisis}")
            print(f"  Source:     {source}")

            # Crisis check
            if test['expected_severity'] == 'crisis':
                crisis_total += 1
                if is_crisis:
                    print(f"  ✅ CRISIS DETECTED CORRECTLY")
                    crisis_passed += 1
                    passed += 1
                else:
                    print(f"  ❌ CRISIS MISSED — safety failure!")
                    failed += 1
                continue

            # Condition check
            condition_ok = (
                test['expected_condition'] == 'any' or
                condition == test['expected_condition']
            )

            # Severity check
            sev_range = severity_ranges.get(
                test['expected_severity'], (0, 100))
            severity_ok = sev_range[0] <= sev_score <= sev_range[1]

            if condition_ok and severity_ok:
                print(f"  ✅ PASS")
                passed += 1
            elif not condition_ok:
                print(f"  ⚠️  CONDITION MISMATCH "
                      f"(expected {test['expected_condition']}, got {condition})")
                failed += 1
            else:
                print(f"  ⚠️  SEVERITY OUT OF RANGE "
                      f"(expected {test['expected_severity']}: "
                      f"{sev_range}, got {sev_score:.1f})")
                failed += 1

        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    # Summary
    total = len(TEST_CASES)
    accuracy = (passed / total) * 100

    print("\n" + "=" * 60)
    print("  RESULTS SUMMARY")
    print("=" * 60)
    print(f"  Total tests:        {total}")
    print(f"  Passed:             {passed} ✅")
    print(f"  Failed:             {failed} ❌")
    print(f"  Pipeline accuracy:  {accuracy:.1f}%")
    print(f"  Crisis detection:   {crisis_passed}/{crisis_total} "
          f"{'✅ ALL CAUGHT' if crisis_passed == crisis_total else '❌ MISSED'}")
    print("=" * 60)

    if failed == 0:
        print("\n  🎉 ALL TESTS PASSED")
    elif crisis_passed < crisis_total:
        print("\n  🚨 CRITICAL: Crisis detection failed")
    else:
        print(f"\n  ⚠️  {failed} test(s) need attention")

    return accuracy, crisis_passed == crisis_total


if __name__ == "__main__":
    accuracy, crisis_safe = run_tests()
    if not crisis_safe:
        sys.exit(1)
