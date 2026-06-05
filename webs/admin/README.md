# @web/admin

Nuxt admin console for Guard Plus.

The app consumes shared contracts from `@shared/schema`, Eden app types from `@server/app`, and shared components/styles from `@web/ui`.

## Development

```bash
vpr @web/admin#dev
```

## Build And Preview

```bash
vpr @web/admin#build
vpr @web/admin#preview
```

## Notes

- API client setup lives in `app/plugins/api.ts`.
- Pages live under `app/pages`.
- Prefer shared UI primitives from `@web/ui` before adding app-local components.
