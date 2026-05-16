.PHONY: setup test build deploy migrate lint dev icon clean

# ── One-command setup (runs everything) ────────────────────
setup:
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

# ── Development ────────────────────────────────────────────
dev:
	npm run dev

lint:
	npm run lint

build:
	npm run build

start:
	npm run start

# ── Testing ────────────────────────────────────────────────
test:
	npx vitest run

test-watch:
	npx vitest

test-coverage:
	npx vitest run --coverage

# ── Database ───────────────────────────────────────────────
migrate:
	npx prisma generate
	npx prisma migrate dev

migrate-prod:
	npx prisma generate
	npx prisma migrate deploy

studio:
	npx prisma studio

db-reset:
	npx prisma migrate reset --force

# ── Docker ─────────────────────────────────────────────────
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ── Deployment ─────────────────────────────────────────────
deploy:
	@./scripts/deploy.sh

deploy-vercel:
	vercel --prod --yes

# ── Chrome Extension ──────────────────────────────────────
icon:
	@cd extension && bash generate-icons.sh

# ── Cleanup ────────────────────────────────────────────────
clean:
	rm -rf .next node_modules
	rm -f prisma/dev.db*
	npm install

# ── Full Pipeline (one command to rule them all) ───────────
all: clean setup test build deploy
