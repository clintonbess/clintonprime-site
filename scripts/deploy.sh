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

require_env REMOTE_USER WEB_ROOT SITE_ROOT REPO_DIR CURRENT_API PM2_NAME REPO_URL

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

# ------------------- API DEPLOY -------------------
log "prepare API runtime"

PRESERVE_ENV="/tmp/.env.keep"
[ -f "$CURRENT_API/.env" ] && sudo cp "$CURRENT_API/.env" "$PRESERVE_ENV" || true

sudo mkdir -p "$CURRENT_API"

sudo rsync -a --delete --exclude='.env' --exclude='.env.*' \
  "$REPO_DIR/libs/api/dist/" "$CURRENT_API/dist/"

if [ -d "$REPO_DIR/libs/api/public" ]; then
  sudo rsync -a "$REPO_DIR/libs/api/public/" "$CURRENT_API/public/"
fi

sudo install -m 644 "$REPO_DIR/libs/api/package.json" "$CURRENT_API/package.json"

# Copy full node_modules (dev mode, includes all workspace deps)
sudo rsync -a --delete "$REPO_DIR/node_modules/" "$CURRENT_API/node_modules/"

sudo chown -R "$REMOTE_USER:$REMOTE_USER" "$CURRENT_API"

# Restore or create .env
if [ -f "$PRESERVE_ENV" ]; then
  sudo install -m 600 -o "$REMOTE_USER" -g "$REMOTE_USER" "$PRESERVE_ENV" "$CURRENT_API/.env"
elif [ ! -f "$CURRENT_API/.env" ]; then
  warn "creating basic .env (add secrets manually)"
  cat > /tmp/.env.new <<'ENVV'
NODE_ENV=development
PORT=3000
PUBLIC_BASE_URL=https://dev.clintonprime.com
ENVV
  sudo install -m 600 -o "$REMOTE_USER" -g "$REMOTE_USER" /tmp/.env.new "$CURRENT_API/.env"
fi
ok "api runtime staged"

# ------------------- SMOKE TEST -------------------
log "smoke test API (one-shot)"
( PORT=3000 NODE_ENV=development node "$CURRENT_API/dist/index.js" & echo $! > /tmp/cp-test.pid )
sleep 2
if curl -fsS "http://127.0.0.1:3000/" >/dev/null; then
  ok "api responded"
else
  kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true
  err "api did not respond on localhost:3000"
  exit 1
fi
kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true

# ------------------- PM2 RELOAD -------------------
log "pm2 reload"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
PORT=3000 NODE_ENV=development pm2 start "$CURRENT_API/dist/index.js" --name "$PM2_NAME" --time --cwd "$CURRENT_API"
sleep 2
pm2 save || true
pm2 describe "$PM2_NAME" || true
ok "deploy complete @ $(git rev-parse --short HEAD)"
