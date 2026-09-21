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
- Cyrene (`cyrenejs`) for the explicit dependency graph
- Background workers use Bunqueue and live under `server/src/infrastructure/queue`

## Current Layout

Layering is `apps → modules → infrastructure → composition → shared`. The
`guard-plus/architecture-import-boundary` lint rule enforces it, including the
"cross-module imports go through the module public entry" rule.

```txt
server/
  src/
    apps/
      admin/          admin HTTP app
        http/         auth guard, root ripple, routes/
        features/     admin-only capabilities (admin, auth, user)
        config.ts     ADMIN_* env -> AdminConfig
        composition.ts createAdminApp() (Composition Root + Cyrene runtime)
        server.ts     Elysia assembly (createAdminServer)
      user/           user HTTP app (same layout)
      event/          event ingestion runtime (config/composition/handler/server)
      seed/           development seed script + its own runtime
    modules/          reusable business capabilities
      <name>/         domain/, repository/, usecase/, index.ts (Ripple Manifest)
    infrastructure/   db/, redis/, queue/, logger/, mail/, storage/, http/
    composition/      tokens.ts (infrastructure + config tokens), bindings.ts
    shared/           errors/, utils/  (business-agnostic)
    env/              createEnv fragments, read only at app boundaries
    eden.ts           Eden type export surface
```

Use `server/src/modules/*` for reusable business capability code. Use
`server/src/apps/{admin,user}/http/routes/*` for Elysia route ripples and
`server/src/apps/{admin,user}/features/*` for app-only capabilities. Use
`server/src/apps/event` only for event ingestion/runtime concerns. Use
`server/src/infrastructure/queue` for background queue definitions.

`server/src/infrastructure/redis` exposes `createRedisClient(options, logger?)`; the
client instance is created and owned by the app composition root, and Redis-backed
business persistence rules, keys, and serializers stay inside the owning module
repositories, such as `server/src/modules/auth/repository/*`.

## Core Flow

```txt
App route ripple -> Composition Root (create*App) -> Cyrene runtime -> UseCase -> Repository -> DB
Event app -> createEventApp() -> EventHandler ripple -> RewardProcessor/queue -> UseCase -> Repository -> DB
```

Use a small `domain/` folder for reusable business rules, errors, and domain-only
types. Keep domain code dependency-light: no Elysia, env/config, route schemas, or
database client instances.

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
  index.ts         Ripple Manifest (default export) + static domain API (named exports)
```

Small capability modules may expose only the folders/files they need.

Each module has exactly one public entry, `modules/{module}/index.ts`:

```ts
export default defineRipples({
  UserBasicInfoCrypto,
  UserRepo,
  UserUseCase,
});
```

The default export is the only way another module reaches its injectable
capabilities (`User.UserUseCase`); named exports carry the static domain API. Deep
imports (`#modules/user/repository`) are rejected by lint. Do not add provider
discovery helpers such as `providersOf` or `Object.entries(module)` scanning.

App route ripples live under `server/src/apps/{admin,user}/http/routes/*` and are
composed by the app's `http/root.ts` (`AdminHttp` / `UserHttp`). App-only business
capabilities live under `server/src/apps/{admin,user}/features/*`, each with its own
`index.ts` manifest.

## Shared Module Rules

Modules under `server/src/modules/*` are reusable backend building blocks, not HTTP entrypoints.

Shared modules should:

- Export domain policies, errors, repositories, use cases, and helpers that can be reused by more than one app.
- Declare dependencies as `ripple` inputs using composition tokens (`#composition/tokens`) and other modules' manifest entries.
- Stay HTTP-free and env-free: no Elysia, no `process.env`, no `Bun.env`.
- Be composed by each app's Composition Root, which binds the concrete implementations.

Shared modules must not:

- Create or expose app business routes.
- Create or export per-module Elysia app instances.
- Import `#apps/*`.
- Read environment variables directly.
- Favour `token<X | undefined>` to paper over different app dependency graphs; split the capability instead (for example `PointTypeQuery` vs `PointTypeAdminUseCase`).

## Composition Root Rules

Each runnable app owns one Composition Root and one Cyrene runtime, created in
`server/src/apps/<app>/composition.ts`:

- Read the app config from `apps/<app>/config.ts` (the only place that knows the env prefix).
- Create the infrastructure the app owns (`createDatabase`, `createRedisClient`) and close it if startup fails.
- Bind one token at a time with the per-token factories from `#composition`
  (`databaseBinding`, `redisBinding`, `jwtSecretBinding`, ...); list exactly the tokens
  this app's graph needs. Do not add grouping helpers such as `createBaseBindings` —
  a group forces every app to prepare values for tokens it never resolves.
- List every ripple explicitly in a `defineRipples({...})` graph — no scanning.
- Run app-specific startup work (for example `initDefaultAdmin`) in the composition root.

`server/src/apps/<app>/server.ts` assembles Elysia (cors, error mapping, static
assets, OpenAPI, the `*Http` root ripple) and attaches `app.onStop(() => runtime.dispose())`.
`server/src/apps/event` uses its own minimal graph: only the ripples the event chain
needs, not whole module spreads.

## Database Rules

Database client creation, Drizzle schema definitions, relations, migrations, seed scripts, and inferred table types live in `server/src/infrastructure/db`.

Use local aliases inside the server package:

- Import `createDatabase`, `DbClient`, `DbTransaction`, and `DbExecutor` from `#infrastructure/db`.
- Import table objects and Drizzle inferred table types from `#infrastructure/db/schema`.
- Import query helpers from `#infrastructure/db/helper`.
- Add new tables, enums, relations, and inferred table types in `server/src/infrastructure/db/schema/*`, export them from `schema/index.ts`, and update `server/src/infrastructure/db/relations.ts` when relations are needed.
- Reusable modules receive `DbClient`/`DbTransaction` through the `Database` token or as method parameters; there is no root `db` singleton.

Do not define Drizzle schemas, database clients, or table model types inside app modules when they belong to the shared database schema.

## Queue Rules

Queue definitions live in `server/src/infrastructure/queue`.

Queues should:

- Keep queue names, payload typing, and processor registration close to the queue file.
- Delegate business behavior to module use cases (for example `RewardProcessor`).
- Use shared schemas/types for queue payloads when the payload is also an external contract.

Queues must not:

- Import app route modules.
- Reimplement business rules that already belong to domain/use case code.
- Open independent database transactions when the called use case owns the consistency boundary.

## Route Rules

Routes live in app HTTP route ripples under `server/src/apps/{admin,user}/http/routes/*`. Event app routes, if any, live under `server/src/apps/event`.

Routes should:

- Define Elysia route paths and HTTP schemas.
- Declare use cases as `ripple` dependencies and call them directly, for example `({ body, UserUseCase }) => UserUseCase.update(body)`.
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

Use one Ripple per cohesive dependency set, such as `UserUseCase` or `RewardRuleUseCase`.
Split when a single use case mixes reads, writes, event processing, admin operations,
manual operations, replay, and logging into one large dependency list — see
`RewardProcessor` / `RewardQuery` / `ManualRewardUseCase` / `RewardReplayUseCase` and
`PointTypeQuery` / `PointTypeAdminUseCase`.

UseCases should:

- Be defined with `ripple({ ...inputs }, ({ ...inputs }) => ({ ...methods }))`, taking collaborators through the injected inputs object.
- Take the `Database` token only when the use case itself must open transactions.
- Own transactions for business actions that write or require consistency.
- Prefer passing `tx` as the final optional `db` parameter to repositories/use cases inside transactions.
- Receive repositories, policies, cross-module use cases, and the `Logger` token from the inputs object.
- Coordinate repository calls and application services.
- Accept route input types from shared schemas in `@shared/schema`.
- Throw shared or module-specific `AppError` subclasses.
- Return API-ready plain objects when that keeps routes thin.
- Never read env; configuration arrives through composition tokens.
- When a method can optionally accept an override `DbExecutor`, place that optional dependency at the end of the parameter list.
- When a method must run inside a transaction, make `tx` the first required parameter and do not provide a root-db default.

Avoid creating separate service classes unless a collaborator has a real independent responsibility, such as auth token handling, data crypto, image storage, or logging.

## Repository Rules

Repositories wrap Drizzle access only.

Repositories should:

- Be defined with `ripple({ Database, ... }, ...)` and use the injected executor as the default.
- Accept `DbExecutor` when the repository can run against either the root client or a transaction client.
- Accept `DbTransaction` when the repository must only be used inside a transaction.
- Use Drizzle query builders and schema objects from `#infrastructure/db/schema`.
- Encapsulate common persistence filters such as `isNull(deletedAt)`.
- Return database records, `null`, or simple persistence results.
- Put optional `db` override parameters last and default them to the injected executor.
- For repository methods that require row locks or transactional consistency, make `tx` the first required parameter.

Repositories must not import Elysia, env, route schemas, JWT/auth route code, or request input types from `@shared/schema`. Repositories must not open transactions, make permission decisions, hash passwords, sign tokens, or orchestrate business workflows.

## Domain Rules

Domain files contain reusable business rules, policies, errors, and domain-only derived types.

Domain code should:

- Prefer instance methods over static methods.
- Keep pure business logic close to the module.
- Throw module-specific errors from `domain/errors.ts`.
- Accept plain domain/database records and primitive values.
- Export through `domain/index.ts`, then re-export statically from the module root `index.ts`.

Domain code must not import Elysia, env, infrastructure, route schemas, or DB clients. It must not open transactions or query the database.

## Error Rules

Shared module errors live in `domain/errors.ts`. App-only feature errors may live beside the app feature.

Create specific errors by extending shared base errors from `#shared`, override `code`, and provide a useful Chinese default message when the user-facing API needs one.

Register error maps in the route ripple where Elysia needs to know about them (`.error(AdminErrors)`). Use shared errors directly for generic cases.

## Auth Rules

Use the shared auth module plus the HTTP adapter kit instead of implementing auth in routes.

- Auth capabilities (session repo, JWT use cases, register/password-reset flows) live in `server/src/modules/auth`.
- `server/src/infrastructure/http/auth-guard.ts` provides `createAuthGuard(authUseCase, cookieOptions)`; cookie names and durations come from `auth-cookies.ts` and the auth module's static constants.
- Each app's `http/auth.ts` defines its guard ripple (and cookie-options ripple) by injecting `Auth.AuthUseCase`.
- Protect routes with `{ requiredAuth: true }` / `{ requiredAdminAuth: true }` / `{ requiredSuperAdminAuth: true }`.
- Keep admin/user login differences in the app features (`apps/*/features/auth`).

## Transaction Rules

Open transactions in UseCase methods, not routes or repositories.

For multiple repository operations in one business action, create all transaction-scoped repositories with the same `tx` inside the transaction callback or pass `tx` to transaction-aware methods. For cross-module workflows, prefer a higher-level use case that owns one transaction and passes `tx` through.

Do not call another use case that opens a nested transaction unless the behavior is intentional and verified.

## Import Rules

Inside `server/`, use the server aliases from `server/tsconfig.json`:

- `#apps/*` for app-local code.
- `#modules/*` for reusable backend modules (only the public entry `#modules/<name>` across module boundaries).
- `#infrastructure/*` for db, redis, queue, logger, mail, storage, and the HTTP adapter kit.
- `#composition` and `#composition/*` for tokens and binding helpers.
- `#shared` and `#shared/*` for business-agnostic errors and utilities.
- `#env/*` for env schema fragments (app boundaries, composition, and infra types only).

Use `@shared/schema` or its package subpath exports for shared request/response schemas and types across packages.

Use `@server/app` from web packages when consuming Eden app types. Do not import server source files from web packages.

Use `#...` imports only inside the current package. Do not use deep relative paths to cross workspace package boundaries.

Prefer type-only imports for types. Keep local module imports relative when importing siblings within the same module folder.

The lint rule `guard-plus/architecture-import-boundary` enforces the layer direction
(`apps → modules → infrastructure → composition → shared`), the module public entry,
app isolation, and "env only at app boundaries".

## Naming

```txt
Module manifest: default export of modules/<name>/index.ts (defineRipples)
Route ripple export: PascalCase + Routes, e.g. AdminRoutes, PointTypeRoutes
HTTP root ripple: PascalCase + Http, e.g. AdminHttp, UserHttp
Guard ripple: PascalCase + Guard, e.g. AdminAuthGuard
Composition root: create<App>App, e.g. createAdminApp
HTTP server factory: create<App>Server, e.g. createAdminServer
UseCase/Ripple: {Module}UseCase, {Module}Query, {Module}Processor, {Module}Repo
Policy: {Module}Policy
Error class: Specific PascalCase + Error
Elysia name: PascalCase descriptive and unique within the app, e.g. AdminAuthRoute
```

## Decision Heuristics

- If code is HTTP-specific, keep it in `server/src/apps/{admin,user}/http/` (routes, guard, root ripple).
- If code is app-only business logic, keep it in `server/src/apps/{admin,user}/features/*`.
- If code wires app config, the runtime graph, or app-only startup, keep it in `server/src/apps/<app>/composition.ts` / `config.ts`.
- If code defines a background job/queue processor payload, keep it in `server/src/infrastructure/queue`; the processing logic belongs to a module ripple (for example `RewardProcessor`).
- If code describes a business action, keep it in `modules/<name>/usecase/*`.
- If code is a Drizzle read/write, keep it in `modules/<name>/repository/*`.
- If code is a reusable business rule with no DB/HTTP dependency, keep it in `modules/<name>/domain/*`.
- If code is technical infrastructure, keep it in `server/src/infrastructure/*`.
- If code is an infrastructure or config token (or a shared binding helper), keep it in `server/src/composition/*`.
- If code is business-agnostic and widely shared, keep it in `server/src/shared/*`.
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
