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

require_env REMOTE_USER WEB_ROOT SITE_ROOT REPO_DIR CURRENT_API DOMAIN EMAIL PM2_NAME REPO_URL

MARKER="$SITE_ROOT/.bootstrapped"
if [ -f "$MARKER" ]; then
  log "bootstrap already completed at: $(cat "$MARKER" || true)"
  exit 0
fi

log "apt packages"
sudo apt-get update -y
sudo apt-get install -y nginx git curl rsync build-essential ca-certificates

log "node 20 + pnpm + pm2"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pnpm@9 pm2
sudo pm2 startup systemd -u "$REMOTE_USER" --hp "/home/$REMOTE_USER" --silent || true

log "filesystem layout & ownership"
sudo mkdir -p "$WEB_ROOT" "$CURRENT_API" "$REPO_DIR" "$RELEASES_DIR"
sudo chown -R "$REMOTE_USER:$REMOTE_USER" "$SITE_ROOT"
sudo chown -R www-data:www-data "$WEB_ROOT"

log "nginx site"
sudo tee /etc/nginx/sites-available/clintonprime-dev >/dev/null <<'NGX'
server {
  listen 80;
  listen [::]:80;
  server_name dev.clintonprime.com;

  location ^~ /.well-known/acme-challenge/ { root /var/www/html/clintonprime; }

  root /var/www/html/clintonprime;
  index index.html;

  location / { try_files $uri $uri/ /index.html; }

  location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /media/ {
    proxy_pass http://localhost:3000/media/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  add_header X-XSS-Protection '1; mode=block';
}
NGX
sudo ln -sf /etc/nginx/sites-available/clintonprime-dev /etc/nginx/sites-enabled/clintonprime-dev
sudo nginx -t && sudo systemctl reload nginx

log "placeholder index (first time)"
[ -f "${WEB_ROOT}/index.html" ] || echo '<!doctype html><meta charset="utf-8"><title>clintonprime dev</title><h1>dev env up ✅</h1>' | sudo tee "${WEB_ROOT}/index.html" >/dev/null

# Optional TLS (safe if DNS not pointed yet)
if command -v certbot >/dev/null 2>&1; then
  warn "certbot already present, skipping install"
else
  warn "installing certbot (optional)"
  sudo apt-get install -y certbot python3-certbot-nginx || true
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect || true
  sudo nginx -t && sudo systemctl reload nginx || true
fi

date -Iseconds | sudo tee "$MARKER" >/dev/null
ok "bootstrap complete"
