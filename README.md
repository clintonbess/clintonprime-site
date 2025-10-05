# clintonprime-site

A small mono-style project with:

Live site: [clintonprime.com](https://clintonprime.com)

- `libs/api`: Node/Express API with Spotify integration and local media serving
- `apps/web`: Vite + React frontend styled with a Monokai-inspired theme

## Prerequisites

- Node.js 20+
- pnpm 9+
- A Spotify Developer App (client id/secret + redirect URI)

## Directory layout

```
clintonprime-site/
  apps/web/            # Vite React app (frontend)
  libs/api/            # Express API (backend)
  libs/api/public/     # Public assets (e.g., media/*)
```

## Environment variables (API)

Create `libs/api/.env` with at least:

```
PORT=3000
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/spotify/callback
# optional at first boot; will be filled after login flow
SPOTIFY_REFRESH_TOKEN=
SPOTIFY_ACCESS_TOKEN=
```

Notes:

- The API loads `.env` using a resolver so it works regardless of current working directory.
- After completing the Spotify login flow in production, the API persists the refresh/access tokens into `.env`.

## Install

```bash
pnpm i --filter "./libs/api" --filter "./apps/web"
```

## Develop

API (watch):

```bash
cd libs/api
pnpm dev
```

Web (Vite dev):

```bash
cd apps/web
pnpm dev
```

If the API runs on a different origin in dev, set `VITE_API_BASE` before `pnpm dev` and use it in client calls (or run behind a reverse proxy as in deploy Option A below).

## Build

API:

```bash
cd libs/api
pnpm build
```

Web:

```bash
cd apps/web
pnpm build
# output in apps/web/dist
```

Deploy static frontend to your Nginx web root:

```bash
cd apps/web
sudo rm -rf /var/www/html/clintonprime/*
sudo cp -r dist/* /var/www/html/clintonprime/
sudo chown -R www-data:www-data /var/www/html/clintonprime
sudo nginx -t
sudo systemctl reload nginx
```

## API endpoints (subset)

- `GET /api/spotify/recent` – last 5 recently played tracks
- `GET /api/spotify/current` – current playback or last played
- `GET /api/spotify/login` – start OAuth; redirects to Spotify
- `GET /api/spotify/callback` – OAuth callback to exchange code for tokens
- `GET /media/...` – static media serving from `libs/api/public/media`

## Spotify setup

1. In the Spotify Developer Dashboard, set the app's Redirect URI to:
   - Same-origin (recommended): `https://yourdomain.com/api/spotify/callback`
   - Separate API domain: `https://api.yourdomain.com/api/spotify/callback`
2. Put `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REDIRECT_URI` in `libs/api/.env`.
3. After deploy, visit `https://yourdomain.com/api/spotify/login` once to seed tokens.

## Deploy

Two simple approaches:

### Option A: Same-origin (recommended)

- Serve the frontend at `https://yourdomain.com`
- Reverse-proxy `/api/*` and `/media/*` to the API service (e.g., `http://127.0.0.1:3000`)
- No frontend code changes needed; relative paths continue to work

Note: You already implemented this reverse-proxy. For new deployments, rebuild the frontend and run the commands above to publish the new files, then reload Nginx.

Example Nginx server block:

```nginx
server {
  server_name yourdomain.com www.yourdomain.com;
  root /var/www/clintonprime-site/apps/web/dist;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /media/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  listen 80;
}
```

### Option B: Separate frontend and API domains

- Add CORS to the API, e.g. `app.use(cors({ origin: process.env.WEB_ORIGIN }))`
- Use `VITE_API_BASE` in the frontend to prefix API and media URLs

### DNS (Namecheap)

- A record for root `@` → server IP
- CNAME for `www` → `yourdomain.com`
- If using `api.yourdomain.com`, add an A record for `api` → server IP

### SSL

- After DNS propagates, issue certs (e.g., Certbot for Nginx or use Caddy)
- Update your server block to listen on 443 and redirect HTTP → HTTPS

### System service (PM2)

Run the API with PM2 and enable restart on reboot:

```bash
# Install PM2 (once)
sudo npm install -g pm2
pm2 -v

# Build and start API
cd libs/api
pnpm build
pm2 start dist/index.js --name clintonprime-api

# Verify status
pm2 ls

# Enable startup on boot (follow the printed command)
pm2 startup systemd
pm2 save

# Useful
pm2 restart clintonprime-api   # restart after deploying new build
pm2 logs clintonprime-api --lines 100
```

Serve the frontend as static files from `apps/web/dist` behind your reverse proxy (see deploy section above for Nginx).

## Troubleshooting

- 400 on Spotify endpoints after deploy: complete `/api/spotify/login` once to seed tokens.
- Check that `SPOTIFY_REDIRECT_URI` in `.env` exactly matches your Spotify app settings.
- Ensure `.env` is readable and writable by the API process if persisting tokens to file.

### Example Nginx site config (/etc/nginx/sites-available/clintonprime)

```nginx
# Redirect all HTTP to HTTPS
server {
  listen 80;
  listen [::]:80;
  server_name clintonprime.com www.clintonprime.com;

  location /.well-known/acme-challenge/ { root /var/www/html/clintonprime; }
  location / { return 301 https://$host$request_uri; }
}

# Main HTTPS server
server {
  server_name clintonprime.com www.clintonprime.com;

  root /var/www/html/clintonprime;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Backend API proxy
  location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Media proxy
  location /media/ {
    proxy_pass http://localhost:3000/media/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  listen 443 ssl; # managed by Certbot
  ssl_certificate /etc/letsencrypt/live/clintonprime.com/fullchain.pem; # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/clintonprime.com/privkey.pem; # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
  if ($host = www.clintonprime.com) { return 301 https://$host$request_uri; }
  if ($host = clintonprime.com) { return 301 https://$host$request_uri; }
  listen 80;
  server_name clintonprime.com www.clintonprime.com;
  return 404; # managed by Certbot
}
```

Validate and reload Nginx after changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
