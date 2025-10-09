## CI/CD Proposal for clintonprime-site (Lightsail)

This proposal provides two production-ready CI/CD paths for AWS Lightsail:

- **Option A: Lightsail instance** using Nginx + PM2
- **Option B: Lightsail Container Service** with Docker images

Pick one. Option A aligns with your current instance/PM2 setup; Option B offers immutable builds and managed scaling.

---

### Common prerequisites

- GitHub Actions enabled on this repo
- Node.js 20 and pnpm 9 for builds
- Ensure `libs/api/.env` exists on the server (never committed); the API resolves the nearest `.env` via a path-walking helper

---

## Option A — Lightsail instance (Nginx + PM2)

High-level:

- Build frontend in CI and upload `apps/web/dist` to the server’s Nginx web root
- Deploy API by pulling this repo on the server, building `libs/api`, and (re)starting via PM2

### CI: Build (artifact)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build API
        working-directory: libs/api
        run: |
          pnpm install
          pnpm build

      - name: Build Web
        working-directory: apps/web
        run: |
          pnpm install
          pnpm build

      - name: Upload artifacts (web dist)
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: apps/web/dist
```

### CI/CD: Deploy to Lightsail instance

```yaml
# .github/workflows/deploy-lightsail-instance.yml
name: Deploy (Lightsail Instance)
on:
  workflow_dispatch:
  push:
    branches: [main]

env:
  WEB_ROOT: /var/www/html/clintonprime
  API_REPO_DIR: /opt/clintonprime-site # path to repo clone on server
  PM2_NAME: clintonprime-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (for SHA reference)
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build frontend
        working-directory: apps/web
        run: |
          pnpm install
          pnpm build

      - name: Package frontend
        run: |
          tar -C apps/web -czf web-dist.tar.gz dist

      - name: Copy frontend to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ${{ secrets.LIGHTSAIL_USER }}
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          source: web-dist.tar.gz
          target: /tmp/

      - name: Deploy frontend on server
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ${{ secrets.LIGHTSAIL_USER }}
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          script: |
            sudo mkdir -p $WEB_ROOT
            sudo rm -rf $WEB_ROOT/*
            sudo tar -xzf /tmp/web-dist.tar.gz -C $WEB_ROOT --strip-components=1
            sudo chown -R www-data:www-data $WEB_ROOT
            sudo nginx -t && sudo systemctl reload nginx || true

      - name: Deploy API (git pull + build + pm2 restart)
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.LIGHTSAIL_HOST }}
          username: ${{ secrets.LIGHTSAIL_USER }}
          key: ${{ secrets.LIGHTSAIL_SSH_KEY }}
          script: |
            # Ensure repo exists (first time)
            if [ ! -d "$API_REPO_DIR/.git" ]; then
              sudo mkdir -p $API_REPO_DIR
              sudo chown -R $USER:$USER $API_REPO_DIR
              git clone https://github.com/${{ github.repository }} $API_REPO_DIR
            fi

            cd $API_REPO_DIR
            git fetch --all --tags
            git checkout -f ${{ github.sha }}

            cd libs/api
            corepack enable || true
            pnpm -v || npm i -g pnpm && pnpm -v
            pnpm install
            pnpm build

            # Keep .env outside the repo or in libs/api/.env per your resolver
            pm2 describe $PM2_NAME >/dev/null 2>&1 && pm2 restart $PM2_NAME || pm2 start dist/index.js --name $PM2_NAME
            pm2 save
```

#### Required GitHub secrets (Settings → Secrets and variables → Actions)

- `LIGHTSAIL_HOST`: instance IP or hostname
- `LIGHTSAIL_USER`: e.g., `ubuntu`
- `LIGHTSAIL_SSH_KEY`: private key contents for SSH

#### One-time server bootstrap

```bash
# Node + pnpm + PM2 + Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
corepack enable
pnpm -v || npm i -g pnpm
sudo npm i -g pm2
pm2 startup systemd && pm2 save

# Nginx root for frontend (matches WEB_ROOT)
sudo mkdir -p /var/www/html/clintonprime
sudo chown -R www-data:www-data /var/www/html/clintonprime
sudo nginx -t && sudo systemctl reload nginx
```

Notes:

- Ensure `libs/api/.env` on the server contains Spotify creds and tokens as described in `README.md`.
- Your Nginx should reverse-proxy `/api/*` and `/media/*` to the API (see README).

---

## Option B — Lightsail Container Service (Docker)

High-level:

- CI builds Docker images for `api` and `web`, pushes them to Lightsail, then deploys a new revision
- Provides immutable, reproducible deployments

### Dockerfiles

```dockerfile
# libs/api/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY libs/api/package.json libs/api/pnpm-lock.yaml* ./
RUN corepack enable && pnpm i --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
COPY libs/api ./
COPY --from=deps /app/node_modules ./node_modules
RUN corepack enable && pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY libs/api/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY libs/api/public ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package.json apps/web/pnpm-lock.yaml* ./
RUN corepack enable && pnpm i --frozen-lockfile
COPY apps/web ./
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### CI/CD: Deploy to Lightsail Container Service

```yaml
# .github/workflows/deploy-lightsail-containers.yml
name: Deploy (Lightsail Containers)
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: ${{ secrets.AWS_REGION }}
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}

      - name: Build images
        run: |
          docker build -f libs/api/Dockerfile -t api:latest .
          docker build -f apps/web/Dockerfile -t web:latest .

      - name: Push to Lightsail
        run: |
          aws lightsail push-container-image --service-name ${{ secrets.LS_SERVICE_NAME }} --label api --image api:latest
          aws lightsail push-container-image --service-name ${{ secrets.LS_SERVICE_NAME }} --label web --image web:latest

      - name: Deploy containers
        run: |
          aws lightsail create-container-service-deployment \
            --service-name ${{ secrets.LS_SERVICE_NAME }} \
            --containers '{
              "api": {"image": ":api", "ports": {"3000": "HTTP"}},
              "web": {"image": ":web", "ports": {"80": "HTTP"}}
            }' \
            --public-endpoint '{
              "containerName": "web", "containerPort": 80,
              "healthCheck": {"path": "/", "healthyThreshold": 2, "unhealthyThreshold": 2, "timeoutSeconds": 5, "intervalSeconds": 10}
            }'
```

#### Required GitHub secrets

- `AWS_REGION`: e.g., `us-east-1`
- `AWS_ROLE_ARN` (recommended) or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
- `LS_SERVICE_NAME`: Lightsail Container Service name

Notes:

- Provide runtime env (Spotify secrets) via Lightsail service environment variables or a mounted secret file in the `api` container.
- If front and API are separate origins, enable CORS in the API and set `VITE_API_BASE` when building the web image.

---

## Choosing an option

- Choose **Option A** if you already run an instance with Nginx + PM2 and want minimal change.
- Choose **Option B** if you prefer immutable deployments and managed scaling on Lightsail.

## Next steps

1. Add the corresponding GitHub Actions workflows and secrets.
2. For Option A, run the one-time server bootstrap and verify Nginx reverse-proxy rules (see repo `README.md`).
3. Trigger a deploy (push to `main` or run the workflow manually).

