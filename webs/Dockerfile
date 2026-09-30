FROM oven/bun:1.4.2 AS build

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile --ignore-scripts

ARG WEB_APP
ARG NUXT_PUBLIC_API_BASE_URL

ENV NODE_ENV=production
ENV NUXT_PUBLIC_API_BASE_URL=$NUXT_PUBLIC_API_BASE_URL

RUN test "$WEB_APP" = admin || test "$WEB_APP" = user
RUN test -n "$NUXT_PUBLIC_API_BASE_URL"
RUN cd webs/$WEB_APP && bun run build
RUN mkdir -p /site && cp -a webs/$WEB_APP/.output/public/. /site/

FROM nginx:stable-alpine AS web

COPY webs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/ /usr/share/nginx/html/

EXPOSE 80
