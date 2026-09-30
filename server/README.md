# @server/app

Elysia backend package for Guard Plus.

This package contains the admin and user API apps, event ingestion runtime, background queues, shared backend modules, Drizzle schema and relations, migrations, seed scripts, and Eden type exports used by the Nuxt apps.

## Structure

The layering is `apps → modules → infrastructure → config → shared`, enforced by
the `guard-plus/architecture-import-boundary` lint rule.

- `src/apps/admin`: admin HTTP app — `config.ts`, `auth.ts`, `server.ts`,
  `http/` (auth guard, root ripple, route ripples), `features/` (app-only capabilities).
- `src/apps/user`: user HTTP app — same layout.
- `src/apps/event`: Bilibili event ingestion runtime plus its `EventHandler` ripple.
- `src/apps/seed`: development seed script; owns its own Cyrene runtime.
- `src/modules`: reusable business capabilities (`auth`, `bili-event`, `dashboard`,
  `order`, `point`, `product`, `reward`, `user`).
- `src/infrastructure`: `db`, `redis`, `queue`, `logger`, `mail`, `storage`, `http`.
- `src/shared`: business-agnostic errors and utilities.
- `src/config`: one env schema fragment per concern plus the shared `Config` ripple and
  the fine-grained configuration ripples derived from it.
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
`createAdminServer()`, `createUserServer()`, `createEventApp()`. The HTTP apps
combine dependency initialization and Elysia assembly in `server.ts`; the event app
keeps its composition root in `composition.ts`. The composition root lists
every node explicitly (no scanning, no `providersOf`), registers it with
`new Cyrene().use(...Object.values(Manifest))`, and then `await runtime.init()` to
validate the graph and warm every reachable singleton before the app accepts work.
There is no `override()` in production wiring: configuration and infrastructure are
already declarations, so the graph is complete as registered.
The admin and user HTTP apps take their container from `elysiaCyrene()`, so stopping
Elysia disposes the graph.

### Dependency injection

Provider definitions use cyrenex `ripple(key, deps, factory)`. The declaration key is
PascalCase (`OrderUseCase`) and equals the exported definition name, so it doubles as
the `app.ripples` property; every dependency key is PascalCase too, so injections stay
shorthand (`{ Database, OrderRepo }`). `guard-plus/ripple-pascal-case` and
`guard-plus/ripple-deps-pascal-case` enforce both. Cross-module keys are qualified
through the manifest (`UserUseCase: User.UserUseCase`). Business classes keep ordinary
constructor dependencies.

Configuration and infrastructure are plain declarations, each owned by the layer that
implements it — "whatever you need, import that ripple":

```ts
// src/config/index.ts — 配置源头: env 解析结果就是一条 ripple
export const Config = ripple('Config', () => configEnv);
export const DataSecret = ripple('DataSecret', { Config }, ({ Config }) => Config.DATA_SECRET);

// src/infrastructure/db/client.ts — 能力由配置逐级派生, 生命周期归容器
export const Database = ripple('Database', { DatabaseUrl }, ({ DatabaseUrl }) => …);
```

Modules import exactly the declaration they need (`DataSecret`, `RegisterCodeTtl`,
`Database`, …) instead of receiving a whole config object, so no dependency couples to
configuration it does not use. Registration stays minimal:

```ts
const runtime = container.decorator.cyrene.use(
  ...Object.values(AdminAppRipples),
  Logger,
  ImageSavePath,
);

// 校验完整依赖图并初始化所有可达 singleton; 失败时直接抛错, 由 catch 释放资源。
await runtime.init();

const ripples = runtime.ripples;
```

`override()` is reserved for test doubles; the integration fixtures replace `Database`,
`Redis`, `Logger` and the configuration ripples with `stub(...)` replacements.

`init()` runs every reachable singleton factory concurrently and reports failures only
after all branches settle; `transient` declarations stay lazy. On-demand resolution
still works after `init()` and returns the already warmed instance.

Optional capabilities are modelled as explicit implementations instead of
`T | undefined`: `Mailer` always resolves (an unconfigured SMTP degrades to a no-op
sender) and `PointTypeQuery` / `PointTypeAdminUseCase` split read-only from
admin-only needs.

### Environment and configuration

`src/config/*` holds one env schema fragment per concern (`shared`, `database`,
`redis`, `bili`, `image`, `smtp`) and, in `src/config/index.ts`, the single
`createEnv` call that turns them into the `Config` ripple plus the fine-grained
configuration ripples derived from it (`DataSecret`, `AdminJwtSecret`, `UserJwtSecret`, `BiliRoom`,
`RegisterCodeTtl`, `ImageSavePath`, `DatabaseUrl`, `RedisOptions`, `LoggerConfig`,
`SmtpConfig`). It declares shared variables and optional JWT secrets for both apps;
each JWT secret is required only when its corresponding ripple is resolved.

Each `src/apps/<app>/config.ts` remains the app's configuration boundary: it validates
the app-only variables (`ADMIN_*`, `USER_*`, `EVENT_*`, SMTP) and exposes the ones
other app code needs as ripples too (`ApiOrigin`, `WebOrigins`). Modules never read
`process.env`; they depend on the configuration ripples they actually use.

Each HTTP app creates its authentication declarations once with `createAuth(key,
{ JwtSecret })`, passing `AdminJwtSecret` or `UserJwtSecret`. Guards, login, and
logout routes reuse that app's declarations. The event app uses only the shared
verification capabilities and does not require a JWT secret.

The container owns infrastructure lifetimes: `Database`/`Redis` return instances with
`Symbol.asyncDispose`, so a single `runtime.dispose()` closes them on shutdown and on
startup failure. The admin and user apps get their container from `elysiaCyrene()`,
whose `onStop` hook disposes the graph when Elysia stops; the event app and scripts
dispose their runtime explicitly / with `await using`.

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
