cat > ~/bootstrap-dev.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# ---------- config ----------
DOMAIN="dev.clintonprime.com"
EMAIL="you@example.com"  # <-- change this
DEPLOY_USER="ubuntu"
WEB_ROOT="/var/www/html/clintonprime"
RELEASES_DIR="/opt/clintonprime-site/releases"
CURRENT_API="/opt/clintonprime-site/current-api"
PM2_NAME="clintonprime-api-dev"
# ----------------------------

echo "[1/6] apt & base packages"
sudo apt-get update -y
sudo apt-get install -y nginx git curl rsync ufw

echo "[2/6] node 20 + pm2 (global)"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2
# pm2 boot on restart for ubuntu user
pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" >/dev/null

echo "[3/6] filesystem layout"
sudo mkdir -p "$WEB_ROOT"
sudo mkdir -p "$RELEASES_DIR"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$(dirname "$RELEASES_DIR")" "$RELEASES_DIR"

echo "[4/6] nginx site (HTTP only first, for ACME)"
sudo tee /etc/nginx/sites-available/clintonprime-dev >/dev/null <<NGX
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  # ACME challenge
  location ^~ /.well-known/acme-challenge/ { root ${WEB_ROOT}; }

  root ${WEB_ROOT};
  index index.html;

  # SPA
  location / {
    try_files \$uri \$uri/ /index.html;
  }

  # API proxy
  location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # Media proxy
  location /media/ {
    proxy_pass http://localhost:3000/media/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # basic headers
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  add_header X-XSS-Protection "1; mode=block";
}
NGX

sudo ln -sf /etc/nginx/sites-available/clintonprime-dev /etc/nginx/sites-enabled/clintonprime-dev
sudo nginx -t
sudo systemctl reload nginx

echo "[5/6] placeholder index so you get 200"
echo '<!doctype html><meta charset="utf-8"><title>clintonprime dev</title><h1>dev env up ✅</h1>' | sudo tee "${WEB_ROOT}/index.html" >/dev/null
sudo systemctl reload nginx

echo "[6/6] HTTPS via certbot (auto redirect)"
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect

# Firewall (optional but nice)
sudo ufw allow 'Nginx Full' || true

echo "All done 🎉
- Web root: ${WEB_ROOT}
- Releases dir: ${RELEASES_DIR}
- Current API symlink: ${CURRENT_API}
- Nginx site: /etc/nginx/sites-available/clintonprime-dev
Next:
- Run your GitHub deploy to publish web and API
- API will listen on :3000 (proxied at https://${DOMAIN}/api/*)
"
EOF

bash ~/bootstrap-dev.sh
