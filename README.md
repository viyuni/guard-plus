<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

<h1 align="center" style="margin-top: 2rem">Guard Plus - Bilibili Live Guard Rewards System</h1>

<p align="center">
  <a href="./package.json"> 
    <img src="https://img.shields.io/github/package-json/v/viyuni/guard-plus?filename=package.json&label=version" alt="Version" />
  </a> 
  <a href="https://github.com/viyuni/guard-plus/actions/workflows/ci.yml">
    <img src="https://github.com/viyuni/guard-plus/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/viyuni/guard-plus" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-runtime-000000?logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white" alt="Nuxt" />
  <img src="https://img.shields.io/badge/Elysia-backend-7C3AED" alt="Elysia" />
</p>

<p align="center">
  <strong>English</strong>
  ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

Guard Plus is a rewards management and fulfillment system for Bilibili Live Guard memberships. It helps streamers, operators, and administrators manage reward rules, fulfillment records, and claim flows for Guard members such as Captain, Admiral, and Governor supporters.

The project is a Vite+ TypeScript monorepo containing Nuxt admin and user apps, a shared Vue UI package, an Elysia backend, background queues, and shared cross-package TypeScript contracts.

## Features

- Guard rewards management: configure and operate rewards around Bilibili Live Guard membership tiers.
- Admin console: review, configure, and process reward-related data for operators.
- User claim portal: let Guard members look up and claim available rewards.
- Event and queue processing: handle asynchronous reward workflows through event ingestion and background jobs.
- Type-safe collaboration: keep backend, frontend, and shared schemas aligned through TypeScript contracts.

## Packages

- `@server/app` in `server/`: Elysia API apps for admin and user clients, event ingestion, background queues, shared backend modules, Drizzle schema, migrations, and Eden type exports for the Bilibili live guard rewards workflow.
- `@shared/schema` in `packages/schema/`: Valibot API schemas, request/response types, and cross-package contracts.
- `@web/admin` in `webs/admin/`: Nuxt admin console for reward configuration and operations.
- `@web/user` in `webs/user/`: Nuxt user-facing app for reward lookup and claiming.
- `@web/ui` in `webs/ui/`: shared Vue components, styles, Nuxt module integration, and component metadata.
- `@web/base` in `webs/base/`: shared Nuxt base app and static brand assets used by the web apps and documentation.

## Directory Structure

```text
.
├── server/           # @server/app: Elysia apps, event runtime, queues, shared backend modules, DB schema
├── packages/schema/           # @shared/schema: shared schemas and types
├── webs/
│   ├── admin/        # @web/admin: admin Nuxt app
│   ├── base/         # @web/base: shared base app and brand/static assets
│   ├── user/         # @web/user: user Nuxt app
│   └── ui/           # @web/ui: shared UI package
├── AGENTS.md         # Agent and project workflow notes
├── package.json      # Workspace scripts and package catalog
└── vite.config.ts    # Root Vite+ configuration
```

## Development

Install dependencies and configure hooks:

```bash
vp install
vp config
```

Run checks across the workspace. This formats, lints, and type checks:

```bash
vpr check
```

Run tests across the workspace:

```bash
vpr test
```

Start a specific app or service with its workspace script:

```bash
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @server/app#queue
vpr @web/admin#dev
vpr @web/user#dev
```

Build backend binaries and generated Eden types:

```bash
vpr @server/app#build
vpr @server/app#build:types
```

Run targeted type checks:

```bash
vpr typecheck
vpr typecheck:schema
vpr typecheck:server
vpr typecheck:web
vpr @server/app#typecheck
```

## Backend

The backend package is `@server/app` in `server/`.

- `server/src/apps/admin`: admin API app, admin context, env helpers, and admin-only route modules.
- `server/src/apps/user`: user API app, user context/env, and user-only route modules.
- `server/src/apps/event`: event ingestion runtime.
- `server/src/modules`: reusable backend modules shared by apps and queues.
- `server/src/queues`: Bunqueue job definitions.
- `server/src/db`: Drizzle client, schema, relations, migrations, and seed scripts.
- `server/src/context.ts`: shared dependency container, Elysia context wiring, and event container wiring.
- `server/src/eden.ts`: Eden type export surface consumed by web packages.

## Database tasks

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:seed
vpr @server/app#db:studio
```

Use `.env` for local development commands and `.env.test` for test database commands.

## UI Component Manifest

`@web/ui` exposes components through package subpath exports and a Nuxt component resolver. When adding, removing, or renaming components under `webs/ui/src/components`, run:

```bash
vpr @web/ui#generate:manifest
```

This updates `webs/ui/package.json`, `webs/ui/nuxt/components.json`, and `webs/ui/types.d.ts`.
