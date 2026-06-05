# @web/user

Nuxt user-facing app for Guard Plus.

The app consumes Eden app types from `@server/app` and shared components/styles from `@web/ui`.

## Development

```bash
vpr @web/user#dev
```

## Build And Preview

```bash
vpr @web/user#build
vpr @web/user#preview
```

## Notes

- API client setup lives in `app/plugins/api.ts`.
- Pages live under `app/pages`.
- Prefer shared UI primitives from `@web/ui` before adding app-local components.
