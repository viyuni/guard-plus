<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

<hr />

<p align="center">Bilibili Live Guard Rewards System</p>

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

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#development">Development</a> ·
  <a href="./webs/docs/content/en/deploy.md">Deployment</a> ·
  <a href="./webs/docs/content/en/about.md">Documentation</a>
</p>

Guard Plus helps streamers and operators manage rewards for Bilibili Live Guard members — from membership events and reward rules to claims, points, orders, and fulfillment records.

The admin console handles day-to-day operations; the user portal gives Captain, Admiral, and Governor supporters a place to check and claim their rewards.

## Features

| Area                | What it provides                                                           |
| ------------------- | -------------------------------------------------------------------------- |
| 🎁 Rewards          | Reward rules and fulfillment for Guard membership tiers                    |
| 🛡️ Admin console    | Users, products, inventory, orders, rewards, and points management         |
| 👥 User portal      | Reward lookup, claims, point balances, and order history                   |
| ⚡ Events and jobs  | Bilibili event ingestion, persisted event jobs, and embedded email workers |
| 🧩 Shared contracts | Valibot schemas and Eden types shared by API and web apps                  |

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

`vpr check` generates Eden types, formats, lints, and type checks the workspace. Backend tests use Docker services and `server/.env.test`; see [server/README.md](./server/README.md).

## Deployment

Deploy the backend and frontend with separate Compose projects and environment files:

```bash
cp server/.env.example server/.env.prod
cp webs/.env.example webs/.env.prod
# Configure production domains and secrets before starting.
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

The web images serve generated SPAs through Nginx. `ADMIN_API_ORIGIN` and `USER_API_ORIGIN` are passed into their builds, so changing an API address requires rebuilding its web image.

See the [deployment guide](./webs/docs/content/en/deploy.md) for ports, persistent data, reverse proxies, updates, and the Docker file map.

## Packages

| Package          | Responsibility                                        | Guide                                  |
| ---------------- | ----------------------------------------------------- | -------------------------------------- |
| `@server/app`    | Elysia APIs, events, jobs, database, and Eden types   | [Backend](./server/README.md)          |
| `@shared/schema` | Valibot schemas and shared request/response contracts | [Schemas](./packages/schema/README.md) |
| `@web/admin`     | Nuxt admin console                                    | [Admin](./webs/admin/README.md)        |
| `@web/user`      | Nuxt user portal                                      | [User](./webs/user/README.md)          |
| `@web/ui`        | Vue components, styles, fonts, and Nuxt integration   | [UI](./webs/ui/README.md)              |
| `@web/base`      | Shared Nuxt layer and brand assets                    | [Base](./webs/base/README.md)          |
| `docs`           | English and Chinese Nuxt Content documentation        | [Docs](./webs/docs/README.md)          |

## Project map

```text
.
├── server/                 # APIs, event runtime, business modules, and infrastructure
├── packages/schema/        # Cross-package contracts
├── webs/
│   ├── admin/              # Admin SPA
│   ├── user/               # User SPA
│   ├── docs/               # Bilingual documentation site
│   ├── base/               # Shared Nuxt layer
│   ├── ui/                 # Shared UI components
│   ├── Dockerfile          # Shared static web image build
│   └── compose.prod.yml    # Independent frontend production stack
├── tools/oxlint-plugin/    # Dependency naming and architecture lint rules
├── AGENTS.md               # Contribution conventions and commands
└── vite.config.ts          # Vite+ tasks, formatting, and lint configuration
```

## Contributing

Read [AGENTS.md](./AGENTS.md) for import boundaries, checks, and commit conventions. Build Eden types before checking web consumers. Keep the English and Chinese README and docs pages aligned.

When adding, removing, or renaming shared UI components, regenerate their metadata:

```bash
vpr @web/ui#generate:manifest
```

<details>
<summary>Database and targeted checks</summary>

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:studio
vpr @server/app#db:studio:test
vpr typecheck:schema
vpr typecheck:server
vpr typecheck:web
```

Database tasks read `server/.env`; test tasks read `server/.env.test`. Schema Push changes the selected database directly.

</details>

## License

See [LICENSE](./LICENSE).
