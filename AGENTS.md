<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

<!-- PROJECT IMPORTS START -->

# Import Conventions

For imports that cross workspace package boundaries, prefer real package names:

- `@server/app`
- `@web/admin`, `@web/user`, `@web/ui`
- `@shared/schema`

Use `#...` imports only as TypeScript path aliases for code inside the current project/package. Inside `server/`, use aliases such as `#apps/*`, `#context`, `#db`, `#db/*`, `#modules/*`, and `#utils/*` for local backend internals.

<!-- PROJECT IMPORTS END -->

<!-- PROJECT VUE START -->

# Vue Template Conventions

When a component only passes a default scoped slot, prefer the shorthand on the component tag:

```vue
<form.Field name="delta" #default="{ field }">
  ...
</form.Field>
```

Avoid wrapping the same content in an extra default template:

```vue
<form.Field name="delta">
  <template #default="{ field }">
    ...
  </template>
</form.Field>
```

Use an explicit `<template #default>` only when the component also has named slots or when the slot structure would be ambiguous.

<!-- PROJECT VUE END -->

<!-- PROJECT SCRIPT START -->

# Project Scripts

## Lint

`vp lint`

## Test

`vpr test`

## Format

`vp fmt`

## Type Check

`vpr typecheck`

## Generate UI Component Manifest

`vpr @web/ui#generate:manifest`

This command updates `webs/ui` component metadata: package exports, the component resolver map, and Vue global component types. Run it after adding, removing, or renaming components under `webs/ui/src/components`.

### Check

`vpr check`

This command executes linting, formatting, and type checking.

<!-- PROJECT SCRIPT END -->

<!-- PROJECT COMMITS START -->

# Commit Conventions

Use Conventional Commits:

```txt
<type>(<scope>): <subject>
```

Keep the subject concise, imperative, and lowercase unless it contains a proper noun.

## Types

- `feat`: new feature
- `fix`: bug fix
- `refactor`: code restructuring without behavior changes
- `perf`: performance improvement
- `style`: formatting or visual styling changes
- `docs`: documentation
- `test`: tests
- `build`: build system, dependency, or package configuration
- `ci`: CI configuration
- `chore`: maintenance work
- `revert`: revert a previous change

## Scopes

- `server`: backend changes
- `server/app`: backend routes, modules, use cases, and app wiring
- `server/db`: database schema, repositories, migrations, and query helpers
- `server/auth`: authentication and authorization
- `web/ui`: shared UI components and UI utilities
- `web/admin`: admin Nuxt app
- `web/user`: user Nuxt app
- `web/base`: shared Nuxt base configuration
- `shared`: shared schemas, contracts, and types
- `schema`: `packages/schema`
- `deps`: dependency updates
- `config`: repository and tool configuration
- `release`: release and changelog work

## Examples

```txt
feat(server): add reward rule fulfillment service
fix(server/db): correct order status enum mapping
refactor(server/auth): simplify session guard

feat(web/admin): add landing page app entry button
fix(web/admin): move version label to header
style(web/user): adjust mobile reward card spacing
refactor(web/ui): extract shared image cropper controls

feat(shared): add point transaction schema
build(deps): update nuxt and vue catalog versions
docs(readme): add local development guide
chore(release): prepare v0.1.0
```

For breaking changes, add `!` after the scope or include a `BREAKING CHANGE:` footer:

```txt
feat(server)!: replace legacy reward rule API
```

<!-- PROJECT COMMITS END -->
