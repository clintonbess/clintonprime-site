#!/usr/bin/env bash
set -euo pipefail

# Inputs via env:
#   REPO_URL, REPO_DIR, WEB_ROOT, CURRENT_API, PM2_NAME, SHA
: "${REPO_URL:?}" "${REPO_DIR:?}" "${WEB_ROOT:?}" "${CURRENT_API:?}" "${PM2_NAME:?}" "${SHA:?}"
export NODE_ENV=production

echo "[deploy] checkout $SHA"
mkdir -p "$REPO_DIR"
if [ -d "$REPO_DIR/.git" ]; then
  cd "$REPO_DIR"
  git fetch --all --tags
else
  git clone "$REPO_URL" "$REPO_DIR"
  cd "$REPO_DIR"
fi

# make git ignore file mode changes and force-clean the worktree
git config core.fileMode false || true
git reset --hard HEAD
git clean -fd
git checkout -f -q "$SHA"

echo "[deploy] node + pnpm"
# ensure pnpm is available without corepack; install globally if missing
export PATH="/usr/local/bin:/usr/bin:$PATH"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[deploy] pnpm not found; installing globally..."
  sudo npm i -g pnpm@9
  hash -r
fi

echo "[deploy] install & build (monorepo)"
pnpm install --frozen-lockfile
pnpm --filter @clintonprime/api exec prisma generate --schema=../../libs/db/prisma/schema.prisma
pnpm run build:all

echo "[deploy] web → $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "apps/web/dist/" "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo nginx -t && sudo systemctl reload nginx || true

echo "[deploy] api runtime prep"
pushd libs/api >/dev/null
  pnpm prune --prod || true
  pnpm install --prod --no-optional
popd >/dev/null

PRESERVE_ENV="/tmp/.env.keep"
[ -f "$CURRENT_API/.env" ] && sudo cp "$CURRENT_API/.env" "$PRESERVE_ENV" || true

sudo mkdir -p "$CURRENT_API"
sudo rsync -a --delete --exclude='.env' --exclude='.env.*' \
  "$REPO_DIR/libs/api/dist/" "$CURRENT_API/dist/"
if [ -d "$REPO_DIR/libs/api/public" ]; then
  sudo rsync -a "$REPO_DIR/libs/api/public/" "$CURRENT_API/public/"
fi
sudo install -m 644 "$REPO_DIR/libs/api/package.json" "$CURRENT_API/package.json"
sudo rsync -a --delete "$REPO_DIR/libs/api/node_modules/" "$CURRENT_API/node_modules/"
sudo chown -R "$(whoami):$(whoami)" "$CURRENT_API"

if [ -f "$PRESERVE_ENV" ]; then
  sudo install -m 600 -o "$(whoami)" -g "$(whoami)" "$PRESERVE_ENV" "$CURRENT_API/.env"
elif [ ! -f "$CURRENT_API/.env" ]; then
  cat > /tmp/.env.new <<'ENVV'
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://dev.clintonprime.com
# add app secrets here or manage on the box
ENVV
  sudo install -m 600 -o "$(whoami)" -g "$(whoami)" /tmp/.env.new "$CURRENT_API/.env"
fi

echo "[deploy] health check"
( PORT=3000 NODE_ENV=production node "$CURRENT_API/dist/index.js" & echo $! > /tmp/cp-test.pid )
sleep 2
curl -fsS "http://127.0.0.1:3000/" >/dev/null || (kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true; exit 1)
kill "$(cat /tmp/cp-test.pid)" 2>/dev/null || true

echo "[deploy] pm2 reload"
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
PORT=3000 NODE_ENV=production pm2 start "$CURRENT_API/dist/index.js" --name "$PM2_NAME" --time --cwd "$CURRENT_API"
sleep 2
pm2 save || true
pm2 describe "$PM2_NAME" || true

echo "[deploy] complete @ $SHA"
