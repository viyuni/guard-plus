FROM oven/bun:1.3.14 AS base

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production

FROM base AS db-push

WORKDIR /app/server

CMD ["bunx", "drizzle-kit", "push"]

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

CMD ["bun", "run", "src/apps/event/index.ts"]
