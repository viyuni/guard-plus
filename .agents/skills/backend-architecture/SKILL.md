---
name: backend-architecture
description: Backend architecture rules for this repo's Elysia + Drizzle backend. Use when creating, reviewing, or refactoring code under server/**, especially app routes, shared modules, context/container wiring, repositories, use cases, database schema, auth guards, transactions, and module boundaries.
---

# Backend Architecture

Use these rules for backend work in this repo. Prefer the current lightweight module style over textbook Clean Architecture ceremony.

## Stack

- Elysia
- Drizzle ORM
- Bun runtime APIs where already used
- Valibot schemas from `@shared/schema`
- One backend workspace package: `@server/app` in `server/`
- Lightweight module architecture
- Background workers use Bunqueue and live under `server/src/queues`

## Current Layout

```txt
server/
  src/
    apps/
      admin/          admin HTTP app, app context, env, routes
        modules/      admin-only route modules and app-only use cases
        utils/        admin env/helpers
      event/          event ingestion app
      user/           user HTTP app, app context, env, routes
        modules/      user-only route modules and app-only use cases
        env.ts        user env
    db/               Drizzle client, schema, relations, seed/migrate helpers
    modules/          reusable backend modules shared by admin/user apps
    queues/           Bunqueue job definitions and queue exports
    redis/            Redis client lifecycle helpers
    utils/            shared backend utilities, errors, logger, env helpers
    context.ts        shared container and Elysia context wiring
    eden.ts           Eden type export surface
```

Use `server/src/modules/*` for reusable business capability code. Use `server/src/apps/{admin,user}/modules/*` for HTTP routes and app-specific orchestration. Use `server/src/apps/event` only for event ingestion/runtime concerns. Use `server/src/queues` for background queue definitions.

Use `server/src/redis` for the Redis client lifecycle (`createRedisClient`, `redis`, `closeRedis`, `pingRedis`). Keep Redis-backed business persistence rules, keys, and serializers inside the owning module repositories, such as `server/src/modules/auth/repository/*`.

## Core Flow

```txt
App route module(index.ts) -> appContext/appRuntimeContext -> shared createAppContext/createContainer -> UseCase -> Repository -> DB
Event app/queue -> createEventContainer/createContainer -> UseCase -> Repository -> DB
```

Use a small `domain/` folder for reusable business rules, errors, and domain-only types. Keep domain code dependency-light: no Elysia, env/config, route schemas, context imports, or database client instances.

## Module Shape

Reusable modules under `server/src/modules/{module}` should follow this shape when the capability needs persistence and business rules:

```txt
modules/{module}/
  domain/
    {module}.policy.ts
    errors.ts
    types.ts       optional, domain-only derived types
    index.ts       barrel export
  repository/
    {module}.repo.ts
    index.ts       barrel export
  usecase/
    {module}.usecase.ts
    index.ts       barrel export
  index.ts         barrel export for domain, repository, usecase
```

Small capability modules may expose only the folders/files they need. Keep each `index.ts` as a barrel export; do not hide dependency construction in module barrels.

App route modules under `server/src/apps/{admin,user}/modules/{module}` usually expose an Elysia plugin from `index.ts`. If an app-only flow needs extra logic, keep its app-only errors/use cases beside the route module.

## Shared Module Rules

Modules under `server/src/modules/*` are reusable backend building blocks, not HTTP entrypoints.

Shared modules should:

- Export domain policies, errors, repositories, use cases, and helpers that can be reused by both app servers.
- Accept dependency instances through constructors or dependency objects.
- Keep environment-specific choices in the caller or in `server/src/context.ts`.
- Be wired together from `server/src/context.ts` via `createContainer({ db, env })`.
- Be exposed to routes through `createAppContext({ db, env })`, which returns `{ container, context }`.
- Be exposed to event ingestion through `createEventContainer({ db, env })` when the event runtime needs a smaller dependency graph.

Shared modules must not:

- Create or expose admin/user business routes.
- Create or export per-module Elysia app instances for business APIs.
- Import app-specific infrastructure such as `#apps/admin/env`, `#apps/user/env`, or app route modules.
- Decide URL prefixes, route metadata, or app-specific auth policy.
- Instantiate app-specific dependencies when those instances can be passed in by the consuming app.

## App Context Rules

`server/src/context.ts` owns shared dependency wiring:

- Instantiate reusable repositories and use cases once per app DB/env.
- Return a plain `container` with repositories and use cases for tests and app-specific use cases.
- Return one shared Elysia `context` plugin that installs common guards/macros and decorates shared use cases.
- Return a separate `createEventContainer` for event ingestion when auth/app HTTP decoration is not needed.
- Keep app route paths and app-specific route metadata out of shared context.

`server/src/apps/{admin,user}/context.ts` owns app dependency wiring:

- Import app-local env and root `db`.
- Call `createAppContext({ db, env })`.
- Create app-only repositories/use cases such as admin auth.
- Export `appRuntimeContext` for the root app to mount exactly once.
- Export type-only `appContext` for business route modules to get decorated context inference.
- Register app-only startup hooks or error maps when needed.

Route modules should use the type-only `appContext` and be mounted by the root app after `appRuntimeContext`.

`server/src/apps/event` owns event HTTP/runtime wiring. It should import only the env, root `db`, shared container factory, queue/use case dependencies, and event-specific route/runtime setup it needs.

## Database Rules

Database client creation, Drizzle schema definitions, relations, migrations, seed scripts, and inferred table types live in `server/src/db`.

Use local aliases inside the server package:

- Import `db`, `createDatabase`, `DbClient`, `DbTransaction`, and `DbExecutor` from `#db`.
- Import table objects and Drizzle inferred table types from `#db/schema`.
- Add new tables, enums, relations, and inferred table types in `server/src/db/schema/*`, export them from `server/src/db/schema/index.ts`, and update `server/src/db/relations.ts` when relations are needed.
- Reusable modules should accept `DbExecutor`, `DbClient`, or `DbTransaction` from callers instead of importing the root `db` singleton.

Do not define Drizzle schemas, database clients, or table model types inside app modules when they belong to the shared database schema.

## Queue Rules

Queue definitions live in `server/src/queues`.

Queues should:

- Keep queue names, payload typing, and processor registration close to the queue file.
- Delegate business behavior to use cases from `createContainer` or `createEventContainer`.
- Accept env, logger, and use case dependencies through explicit setup functions when practical.
- Use shared schemas/types for queue payloads when the payload is also an external contract.

Queues must not:

- Import app route modules.
- Reimplement business rules that already belong to domain/use case code.
- Open independent database transactions when the called use case owns the consistency boundary.

## Route Rules

Routes live in app-server module `index.ts` files under `server/src/apps/{admin,user}/modules/*`. Event app routes, if any, live under `server/src/apps/event`.

Routes should:

- Define Elysia route paths and HTTP schemas.
- Call decorated use cases, for example `({ body, userUseCase }) => userUseCase.update(body)`.
- Use shared request/response schemas from `@shared/schema`.
- Use route metadata such as `details.summary` when useful.
- Use auth guards/macros such as `{ requiredAuth: true }` when the route requires identity.

Routes must not:

- Access `db` directly.
- Open transactions.
- Hash passwords, sign tokens, or run multi-step business flows.
- Contain business branching beyond simple request adaptation.

## Shared Schema Rules

Request/response schemas used by routes, use cases, events, or queue payloads must live in `packages/schema/src/*` and be imported from `@shared/schema` or a specific subpath such as `@shared/schema/product`.

Routes should import schema values and attach them to Elysia route options.

Use cases should import the corresponding input/output types from `@shared/schema`.

Repositories should not import shared request schemas or shared input types. Convert or pass use case inputs into repository methods whose parameters are typed with local Drizzle-inferred model types.

## UseCase Rules

Use one UseCase class per module by default, such as `UserUseCase` or `RewardRuleUseCase`.

UseCases should:

- Accept required collaborators through the constructor, usually as a dependency object.
- Accept `DbClient` only when the use case itself must open transactions or construct transaction-scoped repositories.
- Own transactions for business actions that write or require consistency.
- Prefer passing `tx` as the final optional `db` parameter to repositories/use cases inside transactions.
- Receive normal repositories, policies, cross-module use cases, logger instances, and helpers from a `deps` object.
- Coordinate repository calls and application services.
- Accept route input types from shared schemas in `@shared/schema`.
- Throw shared or module-specific `AppError` subclasses.
- Return API-ready plain objects when that keeps routes thin.
- Use instance methods only. Do not add static use case methods.
- When a method can optionally accept an override `DbExecutor`, place that optional dependency at the end of the parameter list.
- When a method must run inside a transaction, make `tx` the first required parameter and do not provide a root-db default.

Avoid creating separate service classes unless a collaborator has a real independent responsibility, such as auth token handling, data crypto, image storage, or logging.

## Repository Rules

Repositories wrap Drizzle access only.

Repositories should:

- Accept `DbExecutor` from `#db` when the repository can run against either the root client or a transaction client.
- Accept `DbTransaction` from `#db` when the repository must only be used inside a transaction.
- Use Drizzle query builders and schema objects from `#db/schema`.
- Use repository parameter types from `#db/schema` when those types directly describe table insert/update/select shapes.
- Encapsulate common persistence filters such as `isNull(deletedAt)`.
- Return database records, `null`, or simple persistence results.
- Use instance methods only. Do not add static repository methods.
- Put optional `db` override parameters last and default them to `this.db` when the repository stores a default executor.
- For repository methods that require row locks or transactional consistency, make `tx` the first required parameter.

Repositories must not import Elysia, app env, route schemas, JWT/auth route code, or request input types from `@shared/schema`. Repositories must not open transactions, make permission decisions, hash passwords, sign tokens, or orchestrate business workflows.

## Domain Rules

Domain files contain reusable business rules, policies, errors, and domain-only derived types.

Domain code should:

- Prefer instance methods over static methods.
- Keep pure business logic close to the module.
- Throw module-specific errors from `domain/errors.ts`.
- Accept plain domain/database records and primitive values.
- Export through `domain/index.ts`, then through the module root `index.ts`.

Domain code must not import Elysia, app env, app-local infrastructure, route schemas, context, or DB clients. It must not open transactions or query the database.

## Error Rules

Shared module errors live in `domain/errors.ts`. App-only module errors may live beside the app module.

Create specific errors by extending shared base errors from `#utils/errors`, override `code`, and provide a useful Chinese default message when the user-facing API needs one.

Register error maps in the app context or root app where Elysia needs to know about them. Use shared errors directly for generic cases.

## Auth Rules

Use the shared auth module and app context instead of implementing auth in routes.

- Shared auth helpers live in `server/src/modules/auth`.
- Shared context installs the auth guard with `createAuthGuard(authUseCase)`.
- Protect routes with `{ requiredAuth: true }`.
- Read the resolved identity from route context according to the guard contract.
- Keep admin/user login differences in app-specific auth modules.

## Transaction Rules

Open transactions in UseCase methods, not routes or repositories.

For multiple repository operations in one business action, create all transaction-scoped repositories with the same `tx` inside the transaction callback or pass `tx` to transaction-aware methods. For cross-module workflows, prefer a higher-level use case that owns one transaction and passes `tx` through.

Do not call another use case that opens a nested transaction unless the behavior is intentional and verified.

## Import Rules

Inside `server/`, use the server aliases from `server/tsconfig.json`:

- `#apps/*` for app-local code.
- `#context` for the shared app context/container.
- `#db` and `#db/*` for database client, schema, relations, and helpers.
- `#modules/*` for reusable backend modules.
- `#redis` and `#redis/*` for Redis client lifecycle helpers.
- `#utils` and `#utils/*` for backend utilities.

Use `@shared/schema` or its package subpath exports for shared request/response schemas and types across packages.

Use `@server/app` from web packages when consuming Eden app types. Do not import server source files from web packages.

Use `#...` imports only inside the current package. Do not use deep relative paths to cross workspace package boundaries.

Prefer type-only imports for types. Keep local module imports relative when importing siblings within the same module folder.

## Naming

```txt
Route/plugin export: camelCase module name, e.g. admin, user
Context exports: appRuntimeContext and appContext
Shared container exports: createContainer and createAppContext
UseCase class: {Module}UseCase
Repository class: {Module}Repository
Policy class: {Module}Policy
Error class: Specific PascalCase + Error
Decorate key: camelCase and explicit use case name when clearer, e.g. userUseCase
Elysia name: PascalCase descriptive name, e.g. AdminAppContextTypeOnly, SharedContext
```

## Decision Heuristics

- If code is HTTP-specific, keep it in `server/src/apps/{admin,user}/modules/{module}/index.ts`.
- If code wires app env, root db, app-only use cases, or app-only startup hooks, keep it in `server/src/apps/{admin,user}/context.ts`.
- If code wires event ingestion or event runtime dependencies, keep it in `server/src/apps/event`.
- If code defines a background job/queue processor, keep it in `server/src/queues`.
- If code wires reusable repositories/use cases, keep it in `server/src/context.ts`.
- If code describes a business action, keep it in `usecase/{module}.usecase.ts`.
- If code is a Drizzle read/write, keep it in `repository/{module}.repo.ts`.
- If code is a reusable business rule with no DB/HTTP dependency, keep it in `domain/{module}.policy.ts`.
- If code is shared schema or API contract, keep it in `packages/schema/src/*`.

## Validation

After backend changes, run the repo's Vite+ commands from the project root:

```txt
vpr check
vpr test
```

For targeted backend checks, use:

```txt
vpr @server/app#typecheck
vpr @server/app#test
```

Useful backend tasks:

```txt
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @server/app#queue
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:seed
vpr @server/app#db:studio
vpr @server/app#db:studio:test
```

Use `vp`/`vpr` commands rather than calling package-manager tools directly.
