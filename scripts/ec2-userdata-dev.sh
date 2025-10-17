#!/usr/bin/env bash
set -euxo pipefail

# ── tune swap to avoid OOM on builds ────────────────────────────────
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

# ── base packages ───────────────────────────────────────────────────
apt-get update -y
apt-get install -y nginx git curl rsync build-essential ca-certificates

# ── Node 20 + pnpm + pm2 ────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm i -g pnpm@9 pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu --silent || true

# ── folders ─────────────────────────────────────────────────────────
SITE_ROOT="/opt/clintonprime-site"
REPO_DIR="$SITE_ROOT/repo"
WEB_ROOT="/var/www/html/clintonprime"
CURRENT_API="$SITE_ROOT/current-api"
mkdir -p "$SITE_ROOT" "$REPO_DIR" "$CURRENT_API" "$WEB_ROOT"
chown -R ubuntu:ubuntu "$SITE_ROOT"
chown -R www-data:www-data "$WEB_ROOT"

# ── clone repo ──────────────────────────────────────────────────────
sudo -u ubuntu bash -lc "
  set -euxo pipefail
  if [ ! -d '$REPO_DIR/.git' ]; then
    git clone https://github.com/clintonbess/clintonprime-site '$REPO_DIR'
  else
    git -C '$REPO_DIR' fetch --all --tags
  fi
  git -C '$REPO_DIR' checkout -q dev-deploy
  git -C '$REPO_DIR' config core.fileMode false || true
"

# ── seed env.server for scripts ─────────────────────────────────────
cat >/opt/clintonprime-site/repo/scripts/env.server <<'ENVV'
export REMOTE_USER="ubuntu"
export WEB_ROOT="/var/www/html/clintonprime"
export SITE_ROOT="/opt/clintonprime-site"
export REPO_DIR="/opt/clintonprime-site/repo"
export CURRENT_API="/opt/clintonprime-site/current-api"
export RELEASES_DIR="/opt/clintonprime-site/releases"
export DOMAIN="dev.clintonprime.com"
export EMAIL="clintonbess3@gmail.com"
export PM2_NAME="clintonprime-api-dev"
export REPO_URL="https://github.com/clintonbess/clintonprime-site"
# Choose one:
export BRANCH="origin/dev-deploy"
# export SHA=""   # (optional pin)
ENVV
chown ubuntu:ubuntu /opt/clintonprime-site/repo/scripts/env.server

# ── run your scripts ────────────────────────────────────────────────
sudo -u ubuntu bash -lc "
  set -euxo pipefail
  cd '$REPO_DIR/scripts'
  chmod +x ./*.sh || true
  bash bootstrap.sh
  bash deploy.sh
"

# ── optional TLS via certbot (DNS must point first) ─────────────────
apt-get install -y certbot python3-certbot-nginx || true
certbot --nginx -d dev.clintonprime.com --non-interactive --agree-tos -m clintonbess3@gmail.com --redirect || true
nginx -t && systemctl reload nginx || true
