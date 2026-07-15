#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Gauge - Auto Deploy${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ── Verify prerequisites ─────────────────────────────────
if ! command -v "vercel" &>/dev/null; then
  warn "Installing Vercel CLI..."
  npm i -g vercel
fi

if ! command -v "gh" &>/dev/null; then
  err "GitHub CLI required. Install: brew install gh"
  exit 1
fi

# ── Git push ──────────────────────────────────────────────
echo ""
info "Pushing to GitHub (this triggers CI/CD)..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  warn "Not on main branch. Current: $BRANCH"
  read -p "  Push to main anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
fi

git push origin "$BRANCH"
log "Pushed! CI/CD pipeline will:"
echo "  1. Install dependencies"
echo "  2. Run Prisma migrations"
echo "  3. Run all tests"
echo "  4. Build the project"
echo "  5. Deploy to Vercel"
echo ""
echo "  Watch progress: gh run watch"

# ── Deploy from CLI as fallback ────────────────────────────
echo ""
info "Also deploying directly via Vercel CLI..."
if vercel --prod --yes 2>&1 | tail -5; then
  DEPLOY_URL=$(vercel ls 2>/dev/null | grep -oE 'https?://[^ ]+' | head -1)
  log "Deployed: ${DEPLOY_URL:-done}"
else
  warn "Direct deploy failed. CI/CD will handle it."
fi

echo ""
log "Done."
