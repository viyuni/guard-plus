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

<!--VPP START-->

# Using vpp

When this project already has `vpp` available, prefer it for test commands.

- Use `vpp test` instead of `vp test`.
- Use `vpp test <args...>` instead of `vp test <args...>`.
- Keep using existing Vite+ commands for non-test tasks, such as `vp check`,
  `vp pack`, and `vp run <script>`.
- Fall back to `vp test` only if `vpp` is not available.

<!--VPP END-->

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

`vpr tsc`

## Generate UI Component Manifest

`vpr @web/ui#generate:manifest`

This command updates `webs/ui` component metadata: package exports, the component resolver map, and Vue global component types. Run it after adding, removing, or renaming components under `webs/ui/src/components`.

### Check

`vpr check`

This command executes linting, formatting, and type checking.

<!-- PROJECT SCRIPT END -->
