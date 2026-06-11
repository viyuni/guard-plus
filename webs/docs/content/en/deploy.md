---
title: Deployment Guide
description: How to deploy Guard Plus to production using Docker Compose and Nginx.
---

# Deployment Guide

This guide covers deploying Guard Plus to a production server using **Docker Compose** and **Nginx** as a reverse proxy.

---

## Prerequisites

- A Linux server with **Docker** and **Docker Compose** installed
- **Bun** runtime for local build tasks
- A domain name with DNS configured (e.g., `api.example.com`, `api-admin.example.com`)
- SSL certificates for your domains

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment

Create a `.env.prod` file in the project root with the following required variables:

```bash
# Required — will cause errors if not set
DATA_SECRET=<your-secret-key>
BILI_ROOM=<your-bilibili-room-id>
ADMIN_ORIGINS=https://admin.example.com
USER_ORIGINS=https://example.com
ADMIN_JWT_SECRET=<your-admin-jwt-secret>
USER_JWT_SECRET=<your-user-jwt-secret>
SUPER_ADMIN_PASSWORD=<secure-admin-password>
VIYUNI_LOGIN_SYNC_URL=<sync-service-url>
VIYUNI_LOGIN_SYNC_PASSWORD=<sync-service-password>

# Optional — defaults are shown
NODE_ENV=production
LOG_LEVEL=info
POSTGRES_USER=admin
POSTGRES_PASSWORD=guard_plus
POSTGRES_DB=guard-plus
PASSWORD_HASH_COST=12
BILI_REGISTER_CODE_TTL_SECONDS=300
REDIS_CONNECTION_TIMEOUT_MS=5000
REDIS_IDLE_TIMEOUT_MS=0
REDIS_MAX_RETRIES=100
SUPER_ADMIN_UID=0721
SUPER_ADMIN_USERNAME=Admin

# Optional — SMTP for email notifications
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NOTIFY_EMAILS=
```

---

## Docker Deployment

### 4. Start Services

The production Docker Compose file defines the following services:

| Service        | Description                       | Default Port |
| -------------- | --------------------------------- | ------------ |
| `db`           | PostgreSQL 18 (Alpine)            | `39699`      |
| `redis`        | Redis 7.2 with AOF persistence    | `39679`      |
| `db-push`      | One-shot Drizzle schema migration | —            |
| `admin-server` | Admin API (Elysia)                | `39960`      |
| `user-server`  | User API (Elysia)                 | `39980`      |
| `event-server` | Event ingestion runtime           | —            |

```bash
# Start all services
docker compose -f server/compose.prod.yml --env-file .env.prod up -d
```

### 5. Verify Services

```bash
# Check service status
docker compose -f server/compose.prod.yml ps

# Check logs
docker compose -f server/compose.prod.yml logs -f
```

### Data Persistence

Persistent data is stored in:

- `/home/guard-plus-data/postgres` — PostgreSQL data
- `/home/guard-plus-data/redis` — Redis AOF data
- `/home/guard-plus-data/public` — Uploaded images and assets

---

## Nginx Reverse Proxy

### 6. Configure Nginx

Use the provided Nginx config as a template (`server/nginx.prod.conf`). Update the `server_name` and SSL certificate paths:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name api-admin.example.com api.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name api-admin.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  location / {
    proxy_pass http://127.0.0.1:39960;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name api.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  location / {
    proxy_pass http://127.0.0.1:39980;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### 7. Apply Nginx Config

```bash
# Test configuration
nginx -t

# Reload Nginx
nginx -s reload
```

---

## Frontend Deployment

### 8. Build the Frontend Apps

```bash
# Build admin app
vpr @web/admin#build

# Build user app
vpr @web/user#build
```

The built files will be in each app's `.output/public` directory. Serve them with Nginx or your preferred static file server.

### 9. Example Static Site Nginx Config

```nginx
server {
  listen 443 ssl;
  server_name admin.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  root /path/to/webs/admin/.output/public;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Port Mapping Reference

| Service      | Internal Port | Default Published Port | Env Override                         |
| ------------ | ------------- | ---------------------- | ------------------------------------ |
| PostgreSQL   | `5432`        | `39699`                | `GUARD_PLUS_POSTGRES_PUBLISHED_PORT` |
| Redis        | `6379`        | `39679`                | `GUARD_PLUS_REDIS_PUBLISHED_PORT`    |
| Admin Server | `3600`        | `39960`                | `GUARD_PLUS_ADMIN_PUBLISHED_PORT`    |
| User Server  | `3800`        | `39980`                | `GUARD_PLUS_USER_PUBLISHED_PORT`     |

---

## Health Checks

All services include Docker health checks:

- **PostgreSQL**: `pg_isready` every 10s
- **Redis**: `redis-cli ping` every 10s
- **API servers**: depend on healthy DB + Redis before starting

---

## Troubleshooting

### Database migration fails

Ensure PostgreSQL is healthy before the migration runs. Check with:

```bash
docker compose -f server/compose.prod.yml logs db
```

### API server can't connect to database

Verify `DATABASE_URL` in your `.env.prod` matches the service names in `compose.prod.yml`. The hostnames are `db` and `redis` (Docker Compose service names).

### SSL certificate issues

Ensure your certificate files exist at the paths specified in the Nginx config. For Let's Encrypt:

```bash
certbot certonly --nginx -d api.example.com -d api-admin.example.com
```

---

[Back to Home](/)
