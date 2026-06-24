#!/usr/bin/env python3
"""
Convert k6 --summary-export output to the nested-values shape
that src/test/proof-loadtest.test.ts expects.

Usage:
  k6 run --summary-export=scripts/.proof-loadtest.raw.json scripts/load-test.js
  python3 scripts/convert-loadtest-proof.py
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RAW = Path("scripts/.proof-loadtest.raw.json")
OUT = Path("scripts/.proof-loadtest.json")


def main() -> int:
    if not RAW.exists():
        print(f"missing {RAW}; run k6 --summary-export first", file=sys.stderr)
        return 1

    src = json.loads(RAW.read_text())

    branch = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    commit = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()

    out = {
        "_meta": {
            "captured_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "base_url": "https://sales-call-notes.vercel.app",
            "branch": branch,
            "commit": commit,
            "note": (
                "Live Vercel production measurement. Refresh with: "
                "BASE_URL=https://sales-call-notes.vercel.app k6 run "
                "--summary-export=scripts/.proof-loadtest.raw.json scripts/load-test.js "
                "&& python3 scripts/convert-loadtest-proof.py"
            ),
        },
        "metrics": {k: {"values": v} for k, v in src.get("metrics", {}).items()},
    }

    OUT.write_text(json.dumps(out, indent=2))
    home = out["metrics"].get("home_latency", {}).get("values", {}).get("p(95)")
    demo = out["metrics"].get("demo_latency", {}).get("values", {}).get("p(95)")
    print(f"wrote {OUT}  home_p95={home}ms  demo_p95={demo}ms")
    return 0


if __name__ == "__main__":
    sys.exit(main())