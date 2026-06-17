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

WORKDIR /app/webs/user

RUN bun run build

FROM build AS web-user

WORKDIR /app/webs/user

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]