---
title: About Guard Plus
description: Learn about the Guard Plus project architecture, packages, and technology choices.
---

# About Guard Plus

Guard Plus is a **rewards management and fulfillment system** for [Bilibili Live](https://live.bilibili.com) Guard memberships. It helps streamers, operators, and administrators manage reward rules, fulfillment records, and claim flows for Guard members such as Captain, Admiral, and Governor supporters.

## Project Overview

The project is a **Vite+ TypeScript monorepo** containing:

- **Nuxt admin, user, and documentation apps** for frontend interfaces
- A **shared Vue UI package** consumed by all three web apps
- An **Elysia backend** for API services
- **Background queues** for async processing
- **Shared cross-package TypeScript contracts** for type safety

---

## Architecture

```text
Admin SPA ── Admin API ─┐
User SPA  ── User API  ─┼── PostgreSQL / Redis
Bilibili  ── Event app ─┘

Admin / User / Docs ── @web/base + @web/ui
```

---

The user API runs embedded bunqueue email workers. Bilibili event jobs are persisted in PostgreSQL and processed by the event app.

## Packages

### `@server/app` — Backend

Elysia API apps for admin and user clients, event ingestion, background queues, shared backend modules, Drizzle schema, migrations, and Eden type exports.

- `server/src/apps/admin` — Admin HTTP app (config, composition root, `http/` routes, app-only features)
- `server/src/apps/user` — User HTTP app (same layout)
- `server/src/apps/event` — Event ingestion runtime
- `server/src/modules` — Reusable business modules, each default-exporting a Ripple Manifest object
- `server/src/infrastructure` — db, redis, queue, logger, mail, storage, and HTTP adapters
- `server/src/config` — Env schema fragments plus shared config ripples and the capability ripples derived from them
- `server/src/shared` — Business-agnostic errors and utilities

### `@shared/schema` — Shared Contracts

Valibot API schemas, request/response types, and cross-package contracts shared between frontend and backend.

### `@web/admin` — Admin Console

Nuxt admin console for reward configuration and operations management.

### `@web/user` — User Portal

Nuxt user-facing app for reward lookup and claiming by Guard members.

### `@web/ui` — UI Library

Shared Vue components, styles, Nuxt module integration, and component metadata used across all frontend apps.

### `@web/base` — Shared Base

Shared Nuxt base app and static brand assets used by web apps and documentation.

### `webs/docs` — Documentation

Bilingual Nuxt Content site for project, architecture, release, and deployment documentation. It
extends `@web/base` and consumes `@web/ui`, so its components, theme, fonts, and frontend tooling
stay aligned with the admin and user apps.

---

## Technology Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Runtime    | [Bun](https://bun.sh)                                  |
| Frontend   | [Nuxt 4](https://nuxt.com), [Vue 3](https://vuejs.org) |
| Docs       | [Nuxt Content](https://content.nuxt.com)               |
| Backend    | [Elysia](https://elysiajs.com)                         |
| Database   | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)   |
| Cache      | Redis                                                  |
| Styling    | [Tailwind CSS](https://tailwindcss.com), shadcn-vue    |
| Validation | [Valibot](https://valibot.dev)                         |
| Monorepo   | [Vite+](https://viteplus.dev)                          |
| CI/CD      | GitHub Actions                                         |

---

## Development

Use the Vite+ CLI (`vp` / `vpr`), Bun **1.4.2**, and Docker Compose for local infrastructure. Run the following commands from the repository root.

### 1. Prepare the workspace

```bash
vp install
vp config
cp server/.env.example server/.env
cp webs/admin/.env.example webs/admin/.env
cp webs/user/.env.example webs/user/.env
```

The backend example starts with production settings. Before local use, set `NODE_ENV=development`, replace the secrets, and use these local endpoints in `server/.env`:

```dotenv
DATABASE_URL=postgresql://admin:guard_plus@localhost:8699/guard-plus
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
ADMIN_API_ORIGIN=http://localhost:3600
ADMIN_WEB_ORIGINS=http://localhost:3000
USER_API_ORIGIN=http://localhost:3800
USER_WEB_ORIGINS=http://localhost:3001
```

Configure `BILI_ROOM` and the login-sync service before running event ingestion. Start the local database and Redis, then apply the schema:

```bash
docker compose -f server/compose.dev.yml up -d --wait
vpr @server/app#db:push
vpr @server/app#db:seed
vpr @server/app#build:types
```

`db:seed` populates development data; use it only against your local development database.

### 2. Start the apps

Run each command in a separate terminal:

| App           | Command                          | Default address         |
| ------------- | -------------------------------- | ----------------------- |
| Admin API     | `vpr @server/app#dev:admin`      | `http://localhost:3600` |
| User API      | `vpr @server/app#dev:user`       | `http://localhost:3800` |
| Event runtime | `vpr @server/app#dev:event`      | `http://localhost:3700` |
| Admin web     | `vpr @web/admin#dev --port 3000` | `http://localhost:3000` |
| User web      | `vpr @web/user#dev --port 3001`  | `http://localhost:3001` |
| Docs          | `vpr docs#dev --port 3002`       | `http://localhost:3002` |

Email workers run inside the user API; event jobs run inside the event runtime. There is no separate `queue` command.

### 3. Validate and build

```bash
vpr check
vpr test
vpr @server/app#build
vpr @server/app#build:types
vpr @web/admin#build
vpr @web/user#build
vpr docs#build
```

`vpr check` generates Eden types, formats, lints, and type checks the workspace. Backend tests use Docker services and `server/.env.test`; see [backend guide](https://github.com/viyuni/guard-plus/blob/main/server/README.md).

[Back to Home](/)
