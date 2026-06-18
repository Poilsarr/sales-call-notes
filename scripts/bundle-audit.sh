#!/usr/bin/env bash
set -euo pipefail

BUDGET=250
FAILED=0

echo "=== Bundle Size Audit ==="
echo ""

BUILD_OUTPUT=$(npx next build 2>&1)

TABLE=$(echo "$BUILD_OUTPUT" | awk '/^.*Route \(.*\)/,/^\+ First Load JS shared by all/' | head -n -1)

echo "$TABLE"
echo ""

echo "=== Budget Check (max ${BUDGET}kB First Load JS) ==="
echo ""

while IFS= read -r line; do
  FIRST_LOAD=$(echo "$line" | awk '{print $NF}')
  ROUTE=$(echo "$line" | awk '{print $2}')

  if [[ "$FIRST_LOAD" =~ ^[0-9]+(\.[0-9]+)? ]]; then
    SIZE=$(echo "$FIRST_LOAD" | sed 's/ kB//;s/ kB//')
    if (echo "$SIZE > $BUDGET" | bc -l 2>/dev/null | grep -q "^1$") || [ "$(printf "%.0f" "$SIZE" 2>/dev/null)" -gt "$BUDGET" ] 2>/dev/null; then
      echo "❌  OVER BUDGET: ${ROUTE} — ${SIZE} kB (limit: ${BUDGET} kB)"
      FAILED=1
    else
      echo "✅  ${ROUTE} — ${SIZE} kB"
    fi
  fi
done <<< "$(echo "$TABLE" | grep '│')"

echo ""
if [ "$FAILED" -eq 1 ]; then
  echo "❌ Some routes exceed budget of ${BUDGET} kB First Load JS"
  exit 1
else
  echo "✅ All routes within budget of ${BUDGET} kB First Load JS"
fi
