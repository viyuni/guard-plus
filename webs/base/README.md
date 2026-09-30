# @web/base

Shared Nuxt layer for Guard Plus, extended by the admin, user, and docs apps.

## Responsibilities

- Shared Nuxt modules: UI components, Pinia/Colada, VueUse, fonts, and motion.
- Tailwind integration and base styles under `app/assets/`.
- Brand assets and local font files under `public/`.
- Public API runtime configuration inherited by the web apps.

This package is a layer. Start or build one of its consuming apps from the repository root.

## Development

```bash
vpr @web/base#prepare
vpr @web/base#typecheck
```

Keep app-specific pages, API origins, and rendering modes in their owning apps.
