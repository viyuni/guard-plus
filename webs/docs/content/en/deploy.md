---
title: Deployment Guide
description: Deploy the Guard Plus backend and static web apps independently with Docker Compose.
---

# Deployment Guide

Guard Plus has two independent Docker Compose projects: the backend in `server/` and the static admin/user web apps in `webs/`. A host reverse proxy provides HTTPS and routes each public domain to the appropriate published port.

## Docker file map

| File                      | Responsibility                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| `server/Dockerfile`       | Bun backend targets: schema push, admin API, user API, event runtime |
| `server/compose.dev.yml`  | Local PostgreSQL and Redis                                           |
| `server/compose.test.yml` | Test PostgreSQL and Redis                                            |
| `server/compose.prod.yml` | Backend production stack and Uptime Kuma                             |
| `webs/Dockerfile`         | Shared admin/user static build, then Nginx runtime                   |
| `webs/compose.prod.yml`   | Independent frontend project with both web services                  |
| `webs/nginx.conf`         | Static assets and SPA fallback                                       |

The previous per-app `Dockerfile`, `compose.example.yml`, and `compose.build.yml` files are replaced by the shared Web files. Use `docker compose ... build admin-web` or `build user-web` to build an image without starting it.

## Prerequisites

- A Linux server with Docker and Docker Compose
- Domains and TLS certificates for both web apps and APIs
- Access to the Bilibili live room and Viyuni login-sync service

Docker builds install dependencies using the repository's Bun version. No host Bun installation is required for container deployment. Run all commands below from the repository root.

## 1. Configure the backend

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
cp server/.env.example server/.env.prod
```

Replace every `change-me` value and configure:

```dotenv
ADMIN_API_ORIGIN=https://api.admin.example.com
ADMIN_WEB_ORIGINS=https://admin.example.com
USER_API_ORIGIN=https://api.shop.example.com
USER_WEB_ORIGINS=https://shop.example.com
BILI_ROOM=<bilibili-room-id>
DATA_SECRET=<long-random-secret>
ADMIN_JWT_SECRET=<different-long-random-secret>
USER_JWT_SECRET=<different-long-random-secret>
REDIS_PASSWORD=<long-random-password>
SUPER_ADMIN_PASSWORD=<secure-password>
LOGIN_SYNC_URL=<sync-service-url>
LOGIN_SYNC_PASSWORD=<sync-service-password>
```

Set one exact HTTPS API origin per app. Web origins accept comma-separated values; each API hostname must equal or be a subdomain of a corresponding Web hostname. Authentication uses credentialed requests and cookies.

Configure SMTP and `NOTIFY_EMAILS` for order notifications. The email worker runs inside the user API; there is no separate queue container. Event jobs run inside the event service.

## 2. Start the backend

```bash
docker compose --env-file server/.env.prod -f server/compose.prod.yml config --quiet
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build
docker compose --env-file server/.env.prod -f server/compose.prod.yml ps
```

| Service        | Purpose                                         | Default published port |
| -------------- | ----------------------------------------------- | ---------------------- |
| `db`           | PostgreSQL 18                                   | `39699`                |
| `redis`        | Redis 7.2 with password and AOF                 | `39679`                |
| `db-push`      | One-shot schema push and event-job data upgrade | —                      |
| `admin-server` | Admin API                                       | `39960`                |
| `user-server`  | User API and email worker                       | `39980`                |
| `event-server` | Bilibili ingestion and event jobs               | `39970`                |
| `uptime-kuma`  | Uptime monitoring                               | `39901`                |

Backend application services wait for successful `db-push` and healthy database/Redis services.

### Persistent data

Existing host paths remain under `/home/guard-plus-data`: PostgreSQL in `postgres/`, Redis in `redis/`, uploaded resources in `public/`, and Uptime Kuma in `uptime-kuma/`. Logs use per-service directories below `LOG_PATH` (default `logs/` under the same root).

Back up the database and data directories before upgrades. `db-push` applies schema changes directly. See the [logging guide](https://github.com/viyuni/guard-plus/blob/main/server/docs/log-troubleshooting.md) for retention and troubleshooting.

### Monitoring

Open port `39901` to initialize Uptime Kuma. Configure HTTP monitors accepting `200-299`:

| Name          | Internal URL                       |
| ------------- | ---------------------------------- |
| Admin API     | `http://admin-server:3600/health/` |
| User API      | `http://user-server:3800/health/`  |
| Event runtime | `http://event-server:3700/health`  |

Kuma shares the backend Docker network; use service names and container ports. Restrict database, Redis, and monitoring ports to the intended clients with your host firewall or reverse proxy.

## 3. Configure and start the frontend

The frontend has its own environment file and Compose project (`guard-plus-web`), and can run on a different host from the backend:

```bash
cp webs/.env.example webs/.env.prod
```

Set the public API origins in `webs/.env.prod` to the same URLs advertised by the backend:

```dotenv
ADMIN_API_ORIGIN=https://api.admin.example.com
USER_API_ORIGIN=https://api.shop.example.com
ADMIN_WEB_PUBLISHED_PORT=3996
USER_WEB_PUBLISHED_PORT=3998
```

```bash
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml config --quiet
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

`ADMIN_API_ORIGIN` and `USER_API_ORIGIN` are passed as `NUXT_PUBLIC_API_BASE_URL` during each image build. Nginx serves `.output/public` on container port `80`, with `index.html` fallback for browser routes. Changing API origins requires rebuilding the corresponding web image; container runtime environment variables cannot update generated SPA configuration.

To deploy just one frontend, append `admin-web` or `user-web` to the `up` command. Alternatively, build locally with `vpr @web/admin#build` / `vpr @web/user#build` and host `.output/public` with a static server supporting SPA fallback.

## 4. Configure HTTPS reverse proxies

Use `server/nginx.prod.conf` as the API proxy template and replace its domains and certificate paths. Add frontend virtual hosts targeting `3996` (admin) and `3998` (user) on the frontend host:

```nginx
location / {
  proxy_pass http://127.0.0.1:3996;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Use `3998` for the user virtual host. Validate and reload with `nginx -t` and `nginx -s reload`.

## Updates and operations

Backend and frontend update independently:

```bash
# Backend logs and rebuild
docker compose --env-file server/.env.prod -f server/compose.prod.yml logs -f
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build --force-recreate

# Re-run schema push/data upgrade explicitly
docker compose --env-file server/.env.prod -f server/compose.prod.yml up --force-recreate db-push

# Frontend rebuild
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

`vpr @server/app#deploy` is the backend-only deployment task and reads `server/.env.prod`. Existing root `.env.prod` files can still be selected explicitly with `--env-file .env.prod`; the recommended layout keeps each stack's configuration next to its Compose file.

If Redis is unhealthy, check that Redis and the apps receive the same password. If login fails, check HTTPS, API build arguments, Web Origins, CORS, and cookies together. A missing route after refreshing a web page usually means the static host lacks SPA fallback.

[Back to Home](/)
