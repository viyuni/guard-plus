---
title: Guard Plus
description: Bilibili Live Guard Rewards System — manage rewards, fulfillment, and claim flows for Guard members.
---

::DocsHero

::AppLogo{width="280"}

# Guard Plus

Bilibili Live Guard Rewards System

A rewards management and fulfillment system for Bilibili Live Guard memberships. Helps streamers, operators, and administrators manage reward rules, fulfillment records, and claim flows for Guard supporters.

::DocsBadges

::

---

## Features

::DocsCard{title="Guard Rewards Management" icon="Gift"}
Configure and operate rewards around Bilibili Live Guard membership tiers (Captain, Admiral, Governor).
::

::DocsCard{title="Admin Console" icon="ShieldCheck"}
Review, configure, and process reward-related data for operators through a full-featured admin dashboard.
::

::DocsCard{title="User Claim Portal" icon="Users"}
Guard members can browse and claim available rewards through an intuitive user-facing interface.
::

::DocsCard{title="Event & Queue Processing" icon="Workflow"}
Asynchronous reward workflows powered by event ingestion and background job processing.
::

---

## Tech Stack

::DocsCard{title="Frontend" icon="Monitor"}

- **Nuxt 4** static SPA apps
- **Vue 3** Composition API
- Shared **@web/ui** components and styles
- **Tailwind CSS** / shadcn-vue
- **Pinia Colada**, TanStack Table, and vee-validate

::

::DocsCard{title="Backend" icon="Server"}

- **Elysia** HTTP framework
- **Drizzle ORM** + PostgreSQL
- **Redis** for queues & caching
- **Bun** JavaScript runtime
- **Eden** type-safe RPC

::

::DocsCard{title="Tooling" icon="Wrench"}

- **TypeScript 6.x** throughout
- **Vite+** monorepo tooling
- **Golar** Vue type checking
- **Valibot** schema validation
- **Docker** containerization
- **GitHub Actions** CI/CD

::

---

## Get Started

```bash
# Install dependencies
vp install

# Run all checks
vpr check

# Start development servers
vpr @web/admin#dev
vpr @web/user#dev
vpr docs#dev
```

[View on GitHub →](https://github.com/viyuni/guard-plus)
