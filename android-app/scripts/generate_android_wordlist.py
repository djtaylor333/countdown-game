#!/usr/bin/env python3
"""
generate_android_wordlist.py

Filters the web-app wordlist.json to words of 2-9 alphabetic characters
and writes them as uppercase, one per line, to the Android assets folder.

Usage:
    python android-app/scripts/generate_android_wordlist.py

Must be run from the repository root.
"""

import json
import os
import sys

SRC  = os.path.join("web-app", "public", "data", "wordlist.json")
DST  = os.path.join("android-app", "app", "src", "main", "assets", "wordlist.txt")


def main() -> None:
    if not os.path.exists(SRC):
        print(f"ERROR: Source file not found: {SRC}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading wordlist from {SRC} …")
    with open(SRC, encoding="utf-8") as f:
        words: list[str] = json.load(f)

    filtered = sorted(
        {w.upper() for w in words if w.isalpha() and 2 <= len(w) <= 9}
    )

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    with open(DST, "w", encoding="utf-8") as f:
        f.write("\n".join(filtered))

    print(f"Written {len(filtered):,} words → {DST}")


if __name__ == "__main__":
    main()
