#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

# Load env (from file or pre-exported)
if [ -f "$SCRIPT_DIR/env.server" ]; then
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/env.server"
fi

require_env REMOTE_USER WEB_ROOT SITE_ROOT REPO_DIR PM2_NAME REPO_URL

# choose ref: SHA > BRANCH > origin/dev
REF="${SHA:-}"
if [ -z "$REF" ]; then
  REF="${BRANCH:-origin/dev}"
fi

path_add /usr/local/bin
path_add /usr/bin

log "ensure pnpm exists"
if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm not found; installing"
  sudo npm i -g pnpm@9
  hash -r
fi

# ---- network hardening + persistent store ----
log "configure pnpm retries/timeouts"
pnpm config set registry https://registry.npmjs.org/
pnpm config set fetch-retries 5
pnpm config set fetch-retry-factor 10
pnpm config set fetch-retry-mintimeout 20000
pnpm config set fetch-retry-maxtimeout 120000
pnpm config set fetch-timeout 600000

if ! pnpm config get store-dir >/dev/null 2>&1; then
  pnpm config set store-dir /opt/pnpm-store
fi
sudo mkdir -p /opt/pnpm-store
sudo chown -R "$REMOTE_USER:$REMOTE_USER" /opt/pnpm-store

# ------------------- REPO -------------------
log "prepare repo"
mkdir -p "$REPO_DIR"
if [ -d "$REPO_DIR/.git" ]; then
  git -C "$REPO_DIR" fetch --all --tags
else
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
git config core.fileMode false || true
git reset --hard HEAD
git clean -fd -e scripts/env.server

# checkout desired ref
if [[ "$REF" =~ ^[0-9a-f]{7,40}$ ]]; then
  log "checkout SHA $REF"
  git checkout -q "$REF"
else
  log "checkout branch $REF"
  git checkout -q "${REF#origin/}" || git checkout -q -B "${REF#origin/}" "$REF"
  git reset --hard "$REF"
fi

git --no-pager log -1 --oneline
ok "checked out $(git rev-parse --short HEAD)"

# ------------------- INSTALL -------------------
log "install all workspace deps (dev mode)"
unset NODE_ENV
if [ -f pnpm-lock.yaml ]; then
  pnpm install --prod=false --frozen-lockfile || pnpm install --prod=false
else
  pnpm install --prod=false
fi

log "generate prisma client for API"
pnpm --filter @clintonprime/api exec prisma generate --schema=../../libs/db/prisma/schema.prisma

# ------------------- BUILD (PROJECT REFERENCES, NO META SCRIPTS) -------------------
log "build (production, TypeScript project references via tsc -b)"
export NODE_ENV=production

# clear stale vite cache to respect new @source globs
rm -rf apps/web/node_modules/.vite apps/web/.vite || true

# Clean old declaration outputs (prevents TS6305 from stale d.ts)
rm -rf libs/types/dist packages/os-core/dist packages/os-ui/dist libs/api/dist apps/web/tsconfig.tsbuildinfo || true

# IMPORTANT: Build in dependency order using TS build mode
# 1) libs/types (produces dist/*.d.ts for downstream)
pnpm -C libs/types exec tsc -b

# 2) packages/os-core (depends on types)
pnpm -C packages/os-core exec tsc -b

# 3) packages/os-ui (depends on types + possibly os-core)
pnpm -C packages/os-ui exec tsc -b

# 4) libs/api (depends on types)
pnpm -C libs/api exec tsc -b

# 5) apps/web (depends on types, os-ui, etc.)
pnpm -C apps/web exec tsc -b

# 6) Vite bundle (after TS references are satisfied)
pnpm -C apps/web exec vite build

# ------------------- POST-BUILD ASSERTS -------------------
log "assert Tailwind output contains window styles"
if ! grep -q "monokai-border" apps/web/dist/assets/*.css 2>/dev/null; then
  err "Tailwind CSS missing 'monokai-border' in build output. Check @source paths & build order."
  exit 1
fi
if ! grep -q "window-drag" apps/web/dist/assets/*.css 2>/dev/null; then
  warn "Could not find 'window-drag' in final CSS. If intentional, ignore; otherwise verify os-ui classes."
fi

# ------------------- WEB DEPLOY -------------------
log "deploy web → $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "apps/web/dist/" "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo nginx -t && sudo systemctl reload nginx || true
ok "web deployed"

# ------------------- API ENV -------------------
log "prepare API env"
ENV_FILE="$REPO_DIR/libs/api/.env"
if [ ! -f "$ENV_FILE" ]; then
  warn "creating default .env in libs/api"
  cat > "$ENV_FILE" <<'ENVV'
NODE_ENV=development
PORT=3000
PUBLIC_BASE_URL=https://dev.clintonprime.com
ENVV
fi
ok "api env ready @ $ENV_FILE"

# ------------------- SMOKE TEST -------------------
log "smoke test API (workspace-aware)"
( cd "$REPO_DIR" && PORT=3000 NODE_ENV=development pnpm --filter @clintonprime/api exec node dist/index.js & echo $! > /tmp/cp-test.pid )
sleep 3
if curl -fsS "http://127.0.0.1:3000/" >/dev/null; then
  ok "api responded"
else
  kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true
  err "api did not respond on localhost:3000"
  exit 1
fi
kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true

# ------------------- PM2 -------------------
log "pm2 reload (run API via pnpm workspace)"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
cd "$REPO_DIR"
PORT=3000 NODE_ENV=development \
  pm2 start pnpm --name "$PM2_NAME" --time -- run --filter @clintonprime/api start
sleep 2
pm2 save || true
pm2 describe "$PM2_NAME" || true
ok "deploy complete @ $(git rev-parse --short HEAD)"
