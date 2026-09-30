# @web/user

Nuxt user-facing app for Guard Plus.

The app consumes Eden app types from `@server/app` and shared components/styles from `@web/ui`.

## Development

Run commands from the repository root. Copy `.env.example` to `.env` in this app and set
`NUXT_PUBLIC_API_BASE_URL` to its API origin. Generate Eden types before checking consumers:

```bash
vpr @server/app#build:types
```

```bash
vpr @web/user#dev
```

## Build And Preview

```bash
vpr @web/user#build
vpr @web/user#preview
```

## Deployment

The build generates a static SPA under `.output/public`. The shared [Web Dockerfile](../Dockerfile)
serves it through Nginx with `index.html` fallback. The API URL is a build-time value.

```bash
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build user-web
```

Run this from the repository root with `webs/.env.prod` configured. See the
[deployment guide](../docs/content/en/deploy.md) for separate web builds and port settings.

## Notes

- API client setup lives in `app/plugins/api.ts`.
- Pages live under `app/pages`.
- Prefer shared UI primitives from `@web/ui` before adding app-local components.
