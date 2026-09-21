FROM oven/bun:1.4.2 AS base

WORKDIR /app

COPY package.json bun.lock ./
COPY server/package.json server/package.json
COPY packages/schema/package.json packages/schema/package.json

RUN bun install \
  --frozen-lockfile \
  --ignore-scripts \
  --filter @server/app \
  --filter @shared/schema

COPY server server
COPY packages/schema packages/schema

ENV NODE_ENV=production

FROM base AS db-push

WORKDIR /app/server

CMD ["sh", "-c", "bunx drizzle-kit push && bun run src/apps/db-upgrade/index.ts"]

FROM base AS admin-server

WORKDIR /app/server

EXPOSE 3600

CMD ["bun", "run", "src/apps/admin/index.ts"]

FROM base AS user-server

WORKDIR /app/server

EXPOSE 3800

CMD ["bun", "run", "src/apps/user/index.ts"]

FROM base AS event-server

WORKDIR /app/server

EXPOSE 3700

CMD ["bun", "run", "src/apps/event/index.ts"]
