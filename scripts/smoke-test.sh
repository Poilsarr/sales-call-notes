#!/usr/bin/env bash
# scripts/smoke-test.sh — Level 6.7 post-deploy smoke test.
#
# Hits 20 critical endpoints and asserts each returns 2xx (or expected
# 401/302 for auth-gated routes). Used:
#   - In CI after deploy (blocks bad deploys)
#   - Manually after Vercel preview deploys
#
# Usage:  BASE_URL=https://usegauge.vercel.app bash scripts/smoke-test.sh
# Exit:   0 if all critical endpoints OK, 1 otherwise.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
EXPECTED_AUTH=("401" "302" "307")  # acceptable for protected routes when unauth

passed=0
failed=0
warnings=0
declare -a results

check() {
  local name="$1"
  local path="$2"
  local expected="${3:-200}"  # default expects 200

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}${path}" 2>/dev/null)
  local rc=$?

  if [ $rc -ne 0 ]; then
    results+=("FAIL  ${name}  ${path}  curl-error")
    failed=$((failed + 1))
    return
  fi

  if [ "$response" = "$expected" ]; then
    results+=("PASS  ${name}  ${path}  ${response}")
    passed=$((passed + 1))
  else
    # check if it's an expected auth response
    local is_auth=0
    for want in "${EXPECTED_AUTH[@]}"; do
      if [ "$response" = "$want" ]; then
        is_auth=1
        break
      fi
    done
    if [ $is_auth -eq 1 ] && [ "$expected" = "200-or-auth" ]; then
      results+=("PASS  ${name}  ${path}  ${response} (auth-gated)")
      passed=$((passed + 1))
    else
      results+=("FAIL  ${name}  ${path}  got ${response}, expected ${expected}")
      failed=$((failed + 1))
    fi
  fi
}

# --- Public pages (must return 200) ---
check "landing"              "/"                          "200"
check "demo"                 "/demo"                      "200"
check "pricing"              "/pricing"                   "200"
check "features"             "/features"                  "200"
check "integrations"         "/integrations"              "307"  # auth-gated, redirect to sign-in
check "sign-in"              "/sign-in"                   "200"
check "sign-up"              "/sign-up"                   "200"
check "privacy"              "/privacy"                   "200"
check "terms"                "/terms"                     "200"
check "refund"               "/refund"                    "200"

# --- Auth-gated (expect 200-or-auth since no cookies in curl) ---
check "dashboard"            "/dashboard"                 "200-or-auth"
check "team"                 "/team"                      "200-or-auth"
check "billing"              "/billing"                   "200-or-auth"
check "settings"             "/settings"                  "200-or-auth"
check "app"                  "/app"                       "200-or-auth"
check "app-calls"            "/app/calls"                 "200-or-auth"
check "app-intelligence"     "/app/intelligence"          "200-or-auth"
check "app-live"             "/app/live"                  "200-or-auth"
check "app-record"           "/app/record"                "200-or-auth"

# --- API routes ---
check "health"               "/api/health"                "200"
check "calls"                "/api/calls"                 "200-or-auth"
check "competitive-intel"    "/api/competitive-intelligence" "200-or-auth"

# --- Summary ---
total=$((passed + failed))
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  smoke test — ${BASE_URL}"
echo "═══════════════════════════════════════════════════════════════════════"
for r in "${results[@]}"; do
  echo "  ${r}"
done
echo "═══════════════════════════════════════════════════════════════════════"
echo "  ${passed}/${total} passed, ${failed} failed"
echo "═══════════════════════════════════════════════════════════════════════"

if [ $failed -gt 0 ]; then
  exit 1
fi
exit 0