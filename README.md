# clintonprime-site

A small mono-style project with:

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

### System service

Run the API with a process manager (PM2/systemd):

```bash
cd libs/api
pnpm build
pm2 start dist/index.js --name clintonprime-api
```

Serve the frontend as static files from `apps/web/dist` behind your reverse proxy.

## Troubleshooting

- 400 on Spotify endpoints after deploy: complete `/api/spotify/login` once to seed tokens.
- Check that `SPOTIFY_REDIRECT_URI` in `.env` exactly matches your Spotify app settings.
- Ensure `.env` is readable and writable by the API process if persisting tokens to file.
