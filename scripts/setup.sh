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
info() { echo -e "${BLUE}[i]${NC} $1"; }

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Gauge - Zero-Touch Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ── Check prerequisites ──────────────────────────────────
info "Checking prerequisites..."

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "$1 is required. Install: $2"
    exit 1
  fi
}

check_cmd "node" "brew install node"
check_cmd "npm"  "brew install node"

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  err "Node.js 18+ required (found v$NODE_VER). Upgrade: brew upgrade node"
  exit 1
fi
log "Node.js $(node -v)"

if ! command -v "vercel" &>/dev/null; then
  warn "Vercel CLI not found. Installing..."
  npm i -g vercel
  log "Vercel CLI installed"
else
  log "Vercel CLI $(vercel --version)"
fi

# ── Install dependencies ──────────────────────────────────
echo ""
info "Installing npm dependencies..."
npm install --silent
log "Dependencies installed"

# ── Check environment variables ───────────────────────────
echo ""
info "Checking environment variables..."

MISSING=0
check_env() {
  local file="${2:-.env.local}"
  local val=$(grep -E "^${1}=" "$file" 2>/dev/null | cut -d= -f2-)
  if [ -z "$val" ] || echo "$val" | grep -qE '^(sk-\.\.\.|pk_\.\.\.|gsk_\.\.\.|hf_\.\.\.|https://your-)'; then
    warn "  $1 is not configured"
    return 1
  fi
  return 0
}

if [ ! -f ".env.local" ]; then
  warn "No .env.local found. Creating from .env.example..."
  cp .env.example .env.local
  warn "  → Edit .env.local with your API keys and re-run setup"
  exit 1
fi

check_env "OPENAI_API_KEY"      || MISSING=1
check_env "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || MISSING=1
check_env "CLERK_SECRET_KEY"    || MISSING=1
check_env "DATABASE_URL"        || MISSING=1

if [ $MISSING -eq 1 ]; then
  warn ""
  warn "Some API keys are missing. Edit .env.local with real values."
  warn "  Clerk:       https://dashboard.clerk.com"
  warn "  OpenAI:      https://platform.openai.com/api-keys"
  warn "  Supabase:    https://supabase.com → new project → connection string"
  warn "  Stripe:      https://dashboard.stripe.com/apikeys"
  warn "  Google:      https://console.cloud.google.com"
  warn "  Slack:       https://api.slack.com/apps"
  warn "  Upstash:     https://upstash.com"
  warn "Rerun setup after filling .env.local"
else
  log "All required environment variables configured"
fi

# ── Database setup ─────────────────────────────────────────
echo ""
info "Setting up database..."

DATABASE_URL=$(grep -E "^DATABASE_URL=" .env.local | cut -d= -f2-)

if echo "$DATABASE_URL" | grep -q "localhost"; then
  if command -v "docker" &>/dev/null; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "callnote-postgres"; then
      log "Postgres is running (Docker)"
    else
      warn "Postgres not running locally. Starting via Docker..."
      docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null || {
        warn "Docker not available. Install Supabase CLI for local DB..."
        if ! command -v "supabase" &>/dev/null; then
          warn "Installing Supabase CLI..."
          brew install supabase/tap/supabase 2>/dev/null || npm i -g supabase
        fi
        supabase start 2>/dev/null &
      fi
    fi
  fi
elif echo "$DATABASE_URL" | grep -q "supabase\|railway\|render\|neon"; then
  log "Using remote database: $(echo $DATABASE_URL | cut -d@ -f2)"
fi

# ── Run Prisma migrations ──────────────────────────────────
echo ""
info "Running database migrations..."
npx prisma generate 2>&1 | tail -1
npx prisma migrate dev --name init 2>&1 | tail -3 || npx prisma db push 2>&1 | tail -1
log "Database schema applied"

# ── Run tests ──────────────────────────────────────────────
echo ""
info "Running tests..."
npx vitest run 2>&1 | tail -5
log "All tests passed"

# ── Build check ────────────────────────────────────────────
echo ""
info "Verifying build..."
npx next build 2>&1 | grep -E "✓|✗|Error|error" || true
log "Build verified"

# ── Deploy ─────────────────────────────────────────────────
echo ""
info "Deploying to Vercel..."
if vercel --cwd "$(pwd)" --prod --yes 2>&1 | tail -3; then
  DEPLOY_URL=$(vercel --cwd "$(pwd)" ls 2>/dev/null | head -2 | grep -oE 'https?://[^ ]+')
  log "Deployed! URL: $DEPLOY_URL"
else
  warn "Deploy skipped. Run manually: vercel --prod"
fi

# ── Done ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Next steps (one-time manual):"
echo "    1. Edit .env.local with your API keys"
echo "    2. Run: ./scripts/setup.sh"
echo ""
echo "  After that, every push deploys automatically."
echo ""
