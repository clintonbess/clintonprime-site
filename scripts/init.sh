#!/usr/bin/env bash
set -euo pipefail

# ── customize these 3 if needed ───────────────────────────────────────────────
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REPO_URL="${REPO_URL:-https://github.com/clintonbess/clintonprime-site}"
BRANCH="${BRANCH:-origin/dev-deploy}"  # or origin/dev
# ───────────────────────────────────────────────────────────────────────────────

SITE_ROOT="/opt/clintonprime-site"
REPO_DIR="$SITE_ROOT/repo"
SCRIPTS_DIR="$REPO_DIR/scripts"

echo "[init] ensure base directories"
sudo mkdir -p "$SITE_ROOT"
sudo chown -R "$REMOTE_USER:$REMOTE_USER" "$SITE_ROOT"

echo "[init] install minimal deps for cloning"
sudo apt-get update -y
sudo apt-get install -y git ca-certificates

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "[init] cloning repo: $REPO_URL → $REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
else
  echo "[init] repo already present; fetching"
  git -C "$REPO_DIR" fetch --all --tags
fi

echo "[init] checking out $BRANCH"
cd "$REPO_DIR"
git checkout -q "${BRANCH#origin/}" || git checkout -q -B "${BRANCH#origin/}" "$BRANCH"
git reset --hard "$BRANCH" || true
git config core.fileMode false || true

echo "[init] ensure scripts are executable"
chmod +x "$SCRIPTS_DIR"/*.sh || true

# If env not present, seed from sample and let you edit later
if [ ! -f "$SCRIPTS_DIR/env.server" ]; then
  echo "[init] creating scripts/env.server from sample"
  cp "$SCRIPTS_DIR/env.server.sample" "$SCRIPTS_DIR/env.server"
  # Quick defaults (edit later if you want)
  sed -i "s|^export REMOTE_USER=.*|export REMOTE_USER=\"$REMOTE_USER\"|" "$SCRIPTS_DIR/env.server"
fi

echo "[init] bootstrap (idempotent)"
bash "$SCRIPTS_DIR/bootstrap.sh"

echo "[init] deploy branch $BRANCH"
export BRANCH="$BRANCH"
bash "$SCRIPTS_DIR/deploy.sh"

echo "[init] done ✅"
