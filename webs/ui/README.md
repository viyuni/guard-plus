# @web/ui

Shared Vue UI package for Guard Plus.

This package provides reusable Vue components, shared styles, fonts, Nuxt integration, and generated component metadata for auto-imports and package subpath exports.

## Structure

- `src/components`: shared Vue components and UI primitives.
- `src/lib`: shared UI helpers.
- `src/style.css`: package stylesheet.
- `nuxt/index.ts`: Nuxt module integration.
- `nuxt/components.json`: generated component resolver metadata.
- `types.d.ts`: generated global component types.
- `package-exports.ts`: generated package export map helper.

## Scripts

```bash
vpr @web/ui#typecheck
vpr @web/ui#generate:manifest
```

Run `generate:manifest` after adding, removing, or renaming components under `src/components`.
