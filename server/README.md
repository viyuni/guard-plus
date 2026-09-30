# @server/app

Elysia backend package for Guard Plus.

This package contains the admin and user API apps, event ingestion runtime, background queues, shared backend modules, Drizzle schema and relations, migrations, seed scripts, and Eden type exports used by the Nuxt apps.

## Structure

The layering is `apps → modules → infrastructure → composition → shared`, enforced by
the `guard-plus/architecture-import-boundary` lint rule.

- `src/apps/admin`: admin HTTP app — `config.ts`, `composition.ts`, `server.ts`,
  `http/` (auth guard, root ripple, route ripples), `features/` (app-only capabilities).
- `src/apps/user`: user HTTP app — same layout.
- `src/apps/event`: Bilibili event ingestion runtime plus its `EventHandler` ripple.
- `src/apps/seed`: development seed script; owns its own Cyrene runtime.
- `src/modules`: reusable business capabilities (`auth`, `bili-event`, `dashboard`,
  `order`, `point`, `product`, `reward`, `user`).
- `src/infrastructure`: `db`, `redis`, `queue`, `logger`, `mail`, `storage`, `http`.
- `src/composition`: infrastructure/config `token` ripples and shared binding helpers.
- `src/shared`: business-agnostic errors and utilities.
- `src/config`: pure env schema fragments, imported only by each app's `config.ts`.
- `src/eden.ts`: exported Eden app types.

## Development

### Modules, Ripples and Apps

Each module exposes exactly one public entry, `src/modules/<name>/index.ts`:

```ts
export default {
  UserBasicInfoCrypto,
  UserRepo,
  UserUseCase,
};
```

The default export is the module's Ripple Manifest — it is the only way another
module may reach its injectable capabilities:

```ts
import User, { UserNotFoundError } from '#modules/user';

export const OrderUseCase = ripple(
  'OrderUseCase',
  {
    UserUseCase: User.UserUseCase,
  },
  ({ UserUseCase }) => {
    // ...
  },
);
```

Named exports carry the static domain API (errors, policies, types). Deep imports
such as `#modules/user/repository` are rejected by lint, so module internals stay
refactorable.

Every runnable app owns one Composition Root and one Cyrene container:
`createAdminApp()`, `createUserApp()`, `createEventApp()`. The composition root lists
every node explicitly (no scanning, no `providersOf`) and registers it with
`new Cyrene().use(...Object.values(Manifest))`. The admin and user HTTP apps take their
container from `elysiaCyrene()`, so stopping Elysia disposes the graph.

### Dependency injection

Provider definitions use cyrenex `ripple(key, deps, factory)`. The declaration key is
PascalCase (`OrderUseCase`) and equals the exported definition name, so it doubles as
the `app.ripples` property; every dependency key is PascalCase too, so injections stay
shorthand (`{ Database, OrderRepo }`). `guard-plus/ripple-pascal-case` and
`guard-plus/ripple-deps-pascal-case` enforce both. Cross-module keys are qualified
through the manifest (`UserUseCase: User.UserUseCase`). Business classes keep ordinary
constructor dependencies.

`src/composition/tokens.ts` declares infrastructure and configuration tokens
(`Database`, `Redis`, `Logger`, `Mailer`, `ImageStorage`, `JwtSecret`, `ApiOrigin`,
`WebOrigins`, `DataSecret`, `BiliRoom`, `RegisterCodeTtl`, `ImageSavePath`) as ripples
whose factory throws until a composition root binds them.
`src/composition/bindings.ts` exposes **one factory per token**, each returning the
ripple that implements it; a graph binds only the tokens it actually reaches, because
cyrenex rejects unreachable overrides during graph validation:

```ts
const runtime = new Cyrene()
  .use(...Object.values(AdminAppRipples))
  .override(Database, databaseBinding(db))
  .override(Redis, redisBinding(redis))
  .override(Logger, loggerBinding(logger))
  .override(DataSecret, dataSecretBinding(config.dataSecret))
  .override(BiliRoom, biliRoomBinding(config.biliRoom))
  .override(RegisterCodeTtl, registerCodeTtlBinding(config.registerCodeTtlSeconds));
```

Config and environment values are ripples too: every binding factory closes over its
value (`ripple('DataSecret', () => secret, { ownership: 'borrowed' })`), so the graph
never carries untyped value bindings.

Optional capabilities are modelled as explicit implementations instead of
`T | undefined`: `Mailer` always resolves (an unconfigured SMTP degrades to a no-op
sender) and `PointTypeQuery` / `PointTypeAdminUseCase` split read-only from
admin-only needs.

### Environment and configuration

Environment schemas live in `src/config/*`, one pure field fragment per concern. They
do not read `process.env` or depend on infrastructure types. Each
`src/apps/<app>/config.ts` is the app's configuration boundary: it composes only the
fragments that app needs, validates `process.env`, and maps environment names to the
app's normalized infrastructure options and semantic config. Modules never read env;
they depend on tokens, and the composition root binds concrete values or
implementations.

Externally created DB/Redis clients are owned by the app composition root, which also
closes them if startup fails. The admin and user apps get their container from
`elysiaCyrene()`, whose `onStop` hook disposes the graph when Elysia stops; the event
app and scripts dispose their runtime explicitly / with `await using`. Disposable
resources declare `Symbol.asyncDispose` on the instance (for example `Mailer` and the
queue worker), which is also why bindings for externally owned instances are marked
`ownership: 'borrowed'`.

### HTTP layer

All Elysia code lives under `src/apps/*/http/` plus the shared adapter kit in
`src/infrastructure/http/` (auth guard, cookie helpers, error mapping, health, OpenAPI).
Route ripples declare their use cases as dependencies and are composed by the app's
`http/root.ts` (`AdminHttp` / `UserHttp`). Module code never imports Elysia.

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
