#!/usr/bin/env bash
# Regenerate scripts/.proof-bundle.txt from the current `next build`
# output. Called by CI after the build step; called locally to refresh
# the bundle gate proof.
#
# Usage:
#   ./scripts/refresh-bundle-proof.sh
set -euo pipefail

OUT=scripts/.proof-bundle.txt
TMP=$(mktemp)

trap 'rm -f "$TMP"' EXIT

# Build the app. REDIS_HOST=disabled prevents BullMQ from trying to
# connect at build time (matches the workaround used everywhere else).
REDIS_HOST=disabled REDIS_PORT=0 npx next build 2>&1 > "$TMP"

# Extract the Route table lines only.
grep -E '^[\xe2\x94\x9c\xe2\x94\x94\xe2\x94\x8c]\s*[\xef\xac\x80\xe2\x88\x86\xce\x9b]\s+' "$TMP" > "$OUT"

LINE_COUNT=$(wc -l < "$OUT" | tr -d ' ')
if [ "$LINE_COUNT" -lt 10 ]; then
  echo "❌ proof extraction got only $LINE_COUNT lines — build output format may have changed"
  cat "$TMP" | tail -20
  exit 1
fi

echo "✓ wrote $OUT ($LINE_COUNT routes)"
head -5 "$OUT"