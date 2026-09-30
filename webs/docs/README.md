# Guard Plus Docs

Bilingual Nuxt Content documentation, extending `@web/base` and using `@web/ui`.

## Content map

| Entry                         | Source                                         | Purpose                                 |
| ----------------------------- | ---------------------------------------------- | --------------------------------------- |
| `/`, `/zh`                    | `app/pages/index.vue` + `i18n/locales/*.json`  | Product overview and quick links        |
| `/about`, `/zh/about`         | `content/en/about.md`, `content/zh/about.md`   | Architecture and local development      |
| `/deploy`, `/zh/deploy`       | `content/en/deploy.md`, `content/zh/deploy.md` | Production configuration and operations |
| `/changelog`, `/zh/changelog` | `app/pages/changelog.vue`                      | Release history                         |

Keep both locales aligned. Home copy lives in locale files; long guides live in Markdown. Docker
commands are documented in the deployment pages, alongside the current Compose file map.

## Development

Run from the repository root:

```bash
vp install
vpr docs#dev --port 3002
```

Open `http://localhost:3002`. English routes have no locale prefix; Chinese routes use `/zh`.

## Build, preview, and validation

```bash
vpr docs#build
vpr docs#preview
vpr docs#typecheck
```

The build prerenders the documentation to `.output/public`. Host that directory with a static
server. Preserve the generated page paths for both locales. Root `vpr check` also checks this app.
