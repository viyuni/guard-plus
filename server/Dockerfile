FROM viyuni/bun-viteplus:latest AS base

WORKDIR /app

COPY . .

RUN vp install

ENV NODE_ENV=production

FROM base AS db-push

WORKDIR /app

CMD ["sh", "-c", "set -ex; vp run @server/app#db:push"]

FROM base AS admin-server

WORKDIR /app/server

EXPOSE 3600

CMD ["bun", "run", "src/apps/admin/index.ts"]

FROM base AS user-server

WORKDIR /app/server

EXPOSE 3999

CMD ["bun", "run", "src/apps/user/index.ts"]

FROM base AS event-server

WORKDIR /app/server

CMD ["bun", "run", "src/apps/event/index.ts"]