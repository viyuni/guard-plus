# @server/app

Elysia backend package for Guard Plus.

This package contains the admin and user API apps, event ingestion runtime, background queues, shared backend modules, Drizzle schema and relations, migrations, seed scripts, and Eden type exports used by the Nuxt apps.

## Structure

- `src/apps/admin`: admin API app, app context, env, and route modules.
- `src/apps/user`: user API app, app context, env, and route modules.
- `src/apps/event`: event ingestion runtime.
- `src/modules`: reusable backend modules shared by admin and user apps.
- `src/queues`: Bunqueue job definitions and queue exports.
- `src/db`: Drizzle client, schema, relations, migrations, and seed helpers.
- `src/utils`: shared backend utilities, errors, logger, and env helpers.
- `src/context.ts`: shared dependency container, Elysia context wiring, and event container wiring.
- `src/eden.ts`: exported Eden app types.

## Development

### Dependency injection

Module `context.ts` files declare individual Repository and UseCase providers with
`cyrenejs` `ripple`. Business classes keep ordinary constructor dependencies.
`src/context/tokens.ts` holds only infrastructure and optional-capability tokens
(`Database`, `Redis`, `PointImageUseCase`, `RewardLogger`).

### Environment and configuration

Env validation lives in `src/env/*`, one file per concern. Each file owns both its
`createEnv` schema and the config `token` that modules inject, so a module never
imports an env singleton:

- `src/env/shared.ts`: `NODE_ENV`, `LOG_LEVEL`, `DATA_SECRET` (`DataSecret`)
- `src/env/bili.ts`: `BILI_ROOM`, `BILI_REGISTER_CODE_TTL_SECONDS` (`BiliRoom`, `RegisterCodeTtl`)
- `src/env/db.ts`, `src/env/redis.ts`: infrastructure clients, read once at the process edge
- `src/env/image.ts`: `IMAGE_SAVE_PATH` (`ImageSavePath`)
- `src/env/smtp.ts`: SMTP settings (`SmtpConfig`, `undefined` when unconfigured)
- `src/env/config.ts`: the normalized `AppConfig` / `EventConfig` contract plus the
  app-level `JwtSecret`, `ApiOrigin`, and `WebOrigins` tokens

Modules request config exactly like any other dependency:

```ts
export const imageUseCase = ripple({ imageSavePath: ImageSavePath }, ({ imageSavePath }) => {
  // ...
});
```

Each app maps its prefixed env to the normalized config once, in
`src/apps/<app>/env.ts` (for example `ADMIN_JWT_SECRET -> jwtSecret`), and exports
`adminAppConfig` / `userAppConfig` / `eventAppConfig`. Only that mapping knows the
env prefixes; downstream code depends on generic tokens.

`createContainer({ db, redis, config })`, `createEventContainer({ db, redis, config })`,
and `createAppContext(...)` are asynchronous and bind the config fields to tokens.
Each call owns an isolated Cyrene runtime; providers share instances only within that
runtime. The returned container exposes `repositories`, `useCases`, and `runtime`.
HTTP contexts dispose the runtime on Elysia stop; scripts and tests must dispose it
explicitly or use `await using`. Externally bound DB/Redis clients remain owned by the
caller. `src/utils/logger.ts`, `src/db`, and `src/redis` still read their env at the
process edge, before any container exists.

Event and seed entrypoints use smaller graphs without HTTP authentication or image
configuration. Add new providers to the owning module and compose them at the app
boundary; routes consume decorated instances instead of creating UseCases.

```bash
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @server/app#queue
```

## Validation

```bash
vpr @server/app#typecheck
vpr @server/app#test
```

The package-level check also runs formatting and linting:

```bash
vpr @server/app#check
```

Build backend binaries and Eden type declarations:

```bash
vpr @server/app#build
vpr @server/app#build:types
```

## Database

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:seed
vpr @server/app#db:studio
vpr @server/app#db:studio:test
```

Use `.env` for local development and `.env.test` for test database commands.
