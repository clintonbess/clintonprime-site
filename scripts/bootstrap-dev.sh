#!/usr/bin/env bash
set -euo pipefail

# Inputs via env:
#   WEB_ROOT, CURRENT_API, REPO_DIR, DOMAIN, EMAIL, DEPLOY_USER
: "${WEB_ROOT:?}" "${CURRENT_API:?}" "${REPO_DIR:?}" "${DOMAIN:?}" "${EMAIL:?}" "${DEPLOY_USER:?}"

MARKER="/opt/clintonprime-site/.bootstrapped"
if [ -f "$MARKER" ]; then
  echo "[bootstrap] already done."
  exit 0
fi

echo "[bootstrap] apt + base"
sudo apt-get update -y
sudo apt-get install -y nginx git curl rsync build-essential

echo "[bootstrap] node 20 + pnpm + pm2"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
corepack enable || true
sudo npm i -g pm2
sudo pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" --silent || true

echo "[bootstrap] fs layout"
sudo mkdir -p "$WEB_ROOT" "$CURRENT_API" "$REPO_DIR"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "/opt/clintonprime-site" "$REPO_DIR"
sudo chown -R www-data:www-data "$WEB_ROOT"

echo "[bootstrap] nginx site"
sudo tee /etc/nginx/sites-available/clintonprime-dev >/dev/null <<'NGX'
server {
  listen 80;
  listen [::]:80;
  server_name dev.clintonprime.com;

  # ACME
  location ^~ /.well-known/acme-challenge/ { root /var/www/html/clintonprime; }

  root /var/www/html/clintonprime;
  index index.html;

  # SPA
  location / { try_files $uri $uri/ /index.html; }

  # API proxy
  location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Media proxy
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

echo "[bootstrap] optional TLS"
sudo apt-get install -y certbot python3-certbot-nginx || true
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect || true
sudo nginx -t && sudo systemctl reload nginx || true

echo "[bootstrap] placeholder page"
[ -f "${WEB_ROOT}/index.html" ] || echo '<!doctype html><meta charset="utf-8"><title>clintonprime dev</title><h1>dev env up ✅</h1>' | sudo tee "${WEB_ROOT}/index.html" >/dev/null

date -Iseconds | sudo tee "$MARKER" >/dev/null
echo "[bootstrap] complete"
