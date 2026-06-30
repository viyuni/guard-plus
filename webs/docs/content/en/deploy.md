---
title: Deployment Guide
description: Deploy the Guard Plus APIs, event worker, and static web apps with Docker Compose and Nginx.
---

# Deployment Guide

Guard Plus is deployed in two parts: the backend stack in `server/compose.prod.yml`, and the admin
and user Nuxt SPAs. Nginx terminates TLS and routes each public domain to the matching service.

---

## Prerequisites

- A Linux server with Docker and Docker Compose
- Domains and TLS certificates for both web apps and APIs
- Access to the configured Bilibili live room and Viyuni login-sync service

The Docker builds install project dependencies, so Bun is only required for local development.

---

## 1. Configure the backend

Clone the repository and create a production environment file from the maintained example:

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
cp server/.env.example .env.prod
```

At minimum, replace every `change-me` value and configure these deployment-specific values:

```bash
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

VIYUNI_LOGIN_SYNC_URL=<sync-service-url>
VIYUNI_LOGIN_SYNC_PASSWORD=<sync-service-password>
```

Set one exact HTTPS API origin for each application. Web origins accept comma-separated values; each
API hostname must equal or be a subdomain of one corresponding Web hostname. The APIs use
credentialed requests and authentication cookies.

---

## 2. Start the backend stack

```bash
docker compose -f server/compose.prod.yml --env-file .env.prod up -d --build
docker compose -f server/compose.prod.yml --env-file .env.prod ps
```

| Service        | Purpose                           | Published port |
| -------------- | --------------------------------- | -------------- |
| `db`           | PostgreSQL 18                     | `39699`        |
| `redis`        | Password-protected Redis with AOF | `39679`        |
| `db-push`      | One-shot Drizzle schema push      | —              |
| `admin-server` | Admin Elysia API                  | `39960`        |
| `user-server`  | User Elysia API                   | `39980`        |
| `event-server` | Bilibili event ingestion and jobs | —              |

PostgreSQL, Redis, uploaded assets, and images persist under `/home/guard-plus-data`.

---

## 3. Configure and build the web apps

The admin and user apps are static SPAs. Their API base URLs must be available **when the image or
static output is built**:

```bash
cp webs/admin/.env.example webs/admin/.env.prod
cp webs/user/.env.example webs/user/.env.prod
```

Set the public API endpoints:

```bash
# webs/admin/.env.prod
NUXT_PUBLIC_API_BASE_URL=https://api.admin.example.com

# webs/user/.env.prod
NUXT_PUBLIC_API_BASE_URL=https://api.shop.example.com
```

Use the supplied container examples:

```bash
docker compose -f webs/admin/compose.example.yml up -d --build
docker compose -f webs/user/compose.example.yml up -d --build
```

Both examples publish port `3996` by default. Change one `published` value when both apps run on the
same host. Alternatively, build with `vpr @web/admin#build` and `vpr @web/user#build`, then serve
each app's `.output/public` directory from a static host with SPA fallback to `index.html`.

---

## 4. Configure Nginx

Use `server/nginx.prod.conf` as the API reverse-proxy template. Replace domain names and certificate
paths, then add equivalent virtual hosts for the admin and user web containers. A web-app location
looks like this:

```nginx
location / {
  proxy_pass http://127.0.0.1:3996;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
}
```

Validate and reload Nginx:

```bash
nginx -t
nginx -s reload
```

---

## Operations

```bash
# Follow backend logs
docker compose -f server/compose.prod.yml --env-file .env.prod logs -f

# Re-run the one-shot schema push
docker compose -f server/compose.prod.yml --env-file .env.prod up db-push

# Rebuild after an application update
docker compose -f server/compose.prod.yml --env-file .env.prod up -d --build
```

If Redis is unhealthy, verify that the same `REDIS_PASSWORD` reaches both the Redis container and
the application services. If browser login fails, check the exact frontend origin, HTTPS, API base
URL, CORS configuration, and authentication cookies together.

---

[Back to Home](/)
