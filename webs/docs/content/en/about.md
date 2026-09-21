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

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Admin App│  │ User App │  │ Docs App │          │
│  │ (Nuxt 4) │  │ (Nuxt 4) │  │ (Nuxt 4) │          │
│  └────┬─────┘  └────┬─────┘  └──────────┘          │
│       └─────────────┼─────────────┘                  │
│             ┌───────┴────────┐                       │
│             │ Shared UI (Vue)│                       │
│             └────────────────┘                       │
├─────────────────────────────────────────────────────┤
│                    API Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Admin   │  │   User   │  │  Event   │          │
│  │  Server  │  │  Server  │  │  Server  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │                  │
├───────┴─────────────┴─────────────┴─────────────────┤
│                  Data Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │ Background Queue │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Packages

### `@server/app` — Backend

Elysia API apps for admin and user clients, event ingestion, background queues, shared backend modules, Drizzle schema, migrations, and Eden type exports.

- `server/src/apps/admin` — Admin HTTP app (config, composition root, `http/` routes, app-only features)
- `server/src/apps/user` — User HTTP app (same layout)
- `server/src/apps/event` — Event ingestion runtime
- `server/src/modules` — Reusable business modules, each default-exporting a `defineRipples(...)` manifest
- `server/src/infrastructure` — db, redis, queue, logger, mail, storage, and HTTP adapters
- `server/src/composition` — Infrastructure/config tokens and binding helpers
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

```bash
# Install dependencies and configure hooks
vp install
vp config

# Run checks across the workspace (format, lint, typecheck)
vpr check

# Run tests
vpr test

# Start specific services
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @web/admin#dev
vpr @web/user#dev
vpr docs#dev
```

---

[Back to Home](/)
