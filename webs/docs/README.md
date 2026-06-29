# Guard Plus Docs

The bilingual documentation site for Guard Plus. It is built with Nuxt Content, extends
`@web/base`, and shares components and styles from `@web/ui` with the admin and user apps.

Documentation pages live under `content/en` and `content/zh`. Keep both locales aligned when
changing product or deployment documentation.

## Development

Run commands from the repository root:

```bash
vp install
vpr docs#dev
```

The development server is available at `http://localhost:3000` by default.

## Build and preview

```bash
vpr docs#build
vpr docs#preview
```

The generated site is written to `.output/public`.

## Validation

```bash
vpr docs#typecheck
vpr check
```
