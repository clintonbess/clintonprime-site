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

log "build monorepo (types, db, os-core, os-ui, os-image, web, api)"
pnpm run build:all

# ------------------- WEB DEPLOY -------------------
log "deploy web → $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "apps/web/dist/" "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo nginx -t && sudo systemctl reload nginx || true
ok "web deployed"

# ------------------- API (run from repo) -------------------
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
log "smoke test API (one-shot)"
( PORT=3000 NODE_ENV=development node "$REPO_DIR/libs/api/dist/index.js" & echo $! > /tmp/cp-test.pid )
sleep 2
if curl -fsS "http://127.0.0.1:3000/" >/dev/null; then
  ok "api responded"
else
  kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true
  err "api did not respond on localhost:3000"
  exit 1
fi
kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true

# ------------------- PM2 -------------------
log "pm2 reload (running API directly from repo)"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
PORT=3000 NODE_ENV=development pm2 start "$REPO_DIR/libs/api/dist/index.js" \
  --name "$PM2_NAME" --time --cwd "$REPO_DIR"
sleep 2
pm2 save || true
pm2 describe "$PM2_NAME" || true
ok "deploy complete @ $(git rev-parse --short HEAD)"
