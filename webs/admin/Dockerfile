FROM oven/bun:1.3.14 AS base

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production

FROM base AS build

WORKDIR /app/webs/admin

RUN bun run build

FROM nginx:1.27-alpine AS web-admin

COPY webs/admin/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build \
  /app/webs/admin/.output/public \
  /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]