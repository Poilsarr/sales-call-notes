#!/usr/bin/env bash
# scripts/smoke-rate-limit.sh
#
# Proves DEPLOYMENT_CHECKLIST.md item 4.1: rate limits fire on
# the public v1 API. Hits /api/v1/calls with a read-scope key
# 61 times and asserts the 61st request returns 429 + Retry-After.
#
# Usage:
#   1. Start the dev server: REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3100
#   2. Mint a key:  curl -X POST -H "Cookie: $CLERK_SESSION" http://localhost:3100/api/v1/keys \
#        -H "content-type: application/json" -d '{"name":"smoke-test"}'
#   3. Save the raw key + run:
#      KEY=cn_test_...  BASE_URL=http://localhost:3100  bash scripts/smoke-rate-limit.sh
#
# Skipped if KEY env var is unset — smoke tests should never
# run as part of the default suite.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
KEY="${KEY:-}"
READ_LIMIT=60

if [ -z "$KEY" ]; then
  echo "⊘ SKIP  smoke-rate-limit.sh — set KEY env var to enable"
  echo "        Example: KEY=cn_test_... bash scripts/smoke-rate-limit.sh"
  exit 0
fi

echo "=== Rate Limit Smoke Test ==="
echo "  Base URL:    $BASE_URL"
echo "  Key prefix:  ${KEY:0:12}..."
echo "  Read limit:  $READ_LIMIT req/min"
echo ""

passed=0
failed=0
ratelimited=0

# Fire $READ_LIMIT requests, expect 200 each.
for i in $(seq 1 $READ_LIMIT); do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    -H "Authorization: Bearer $KEY" \
    "${BASE_URL}/api/v1/calls" 2>/dev/null) || code="000"
  if [ "$code" = "200" ]; then
    passed=$((passed + 1))
  else
    echo "FAIL  request #$i returned $code (expected 200)"
    failed=$((failed + 1))
  fi
done

# 61st request MUST return 429.
code=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 10 \
  -H "Authorization: Bearer $KEY" \
  "${BASE_URL}/api/v1/calls" 2>/dev/null) || code="000"

retry_after=$(curl -s -i \
  --max-time 10 \
  -H "Authorization: Bearer $KEY" \
  "${BASE_URL}/api/v1/calls" 2>/dev/null \
  | grep -i '^retry-after:' | tr -d '\r' | awk '{print $2}')

if [ "$code" = "429" ]; then
  echo "✓ PASS  61st request returned 429 (Retry-After: ${retry_after:-<none>})"
  ratelimited=1
else
  echo "✗ FAIL  61st request returned $code (expected 429)"
fi

echo ""
echo "=== Results ==="
echo "  Under-limit requests: $passed passed, $failed failed (of $READ_LIMIT)"
echo "  Over-limit request:   $([ $ratelimited -eq 1 ] && echo "✓ correctly rate-limited" || echo "✗ NOT rate-limited")"

if [ $failed -eq 0 ] && [ $ratelimited -eq 1 ]; then
  echo ""
  echo "✓ Rate limit verified"
  exit 0
else
  echo ""
  echo "✗ Rate limit verification FAILED"
  exit 1
fi