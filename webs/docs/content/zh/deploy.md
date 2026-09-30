---
title: 部署指南
description: 使用 Docker Compose 分别部署 Guard Plus 后端与静态 Web 应用。
---

# 部署指南

Guard Plus 使用两个独立的 Docker Compose 项目：`server/` 中的后端，以及 `webs/` 中的管理端与用户端静态应用。宿主机反向代理负责 HTTPS，并将公开域名转发到对应端口。

## Docker 文件职责

| 文件                      | 职责                                                      |
| ------------------------- | --------------------------------------------------------- |
| `server/Dockerfile`       | Bun 后端镜像：Schema Push、管理 API、用户 API、事件运行时 |
| `server/compose.dev.yml`  | 本地 PostgreSQL 与 Redis                                  |
| `server/compose.test.yml` | 测试 PostgreSQL 与 Redis                                  |
| `server/compose.prod.yml` | 后端生产栈与 Uptime Kuma                                  |
| `webs/Dockerfile`         | 管理端与用户端共用的静态构建、Nginx 运行镜像              |
| `webs/compose.prod.yml`   | 独立前端项目，包含两个 Web 服务                           |
| `webs/nginx.conf`         | 静态资源与 SPA 路由回退                                   |

原先各应用目录下的 `Dockerfile`、`compose.example.yml` 和 `compose.build.yml` 由共享 Web 文件替代。仅构建镜像时，使用 `docker compose ... build admin-web` 或 `build user-web`。

## 前置条件

- 安装 Docker 与 Docker Compose 的 Linux 服务器
- 两个 Web 应用和两个 API 的域名与 TLS 证书
- 可用的 Bilibili 直播间与 Viyuni 登录同步服务

镜像构建会使用仓库指定的 Bun 版本安装依赖，容器部署无需在宿主机安装 Bun。以下命令均从仓库根目录执行。

## 1. 配置后端

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
cp server/.env.example server/.env.prod
```

替换所有 `change-me`，并配置：

```dotenv
ADMIN_API_ORIGIN=https://api.admin.example.com
ADMIN_WEB_ORIGINS=https://admin.example.com
USER_API_ORIGIN=https://api.shop.example.com
USER_WEB_ORIGINS=https://shop.example.com
BILI_ROOM=<bilibili-room-id>
DATA_SECRET=<long-random-secret>
ADMIN_JWT_SECRET=<different-long-random-secret>
USER_JWT_SECRET=<different-long-random-secret>
REDIS_PASSWORD=<long-random-password>
SUPER_ADMIN_PASSWORD=<secure-password>
LOGIN_SYNC_URL=<sync-service-url>
LOGIN_SYNC_PASSWORD=<sync-service-password>
```

每个应用使用唯一且准确的 HTTPS API Origin。Web Origins 支持逗号分隔；API hostname 必须等于或隶属于对应的 Web hostname。认证使用携带凭据的请求和 Cookie。

订单通知还需填写 SMTP 与 `NOTIFY_EMAILS`。邮件 Worker 内嵌在用户 API 中，没有独立的队列容器；事件任务由事件服务处理。

## 2. 启动后端

```bash
docker compose --env-file server/.env.prod -f server/compose.prod.yml config --quiet
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build
docker compose --env-file server/.env.prod -f server/compose.prod.yml ps
```

| 服务           | 用途                                  | 默认发布端口 |
| -------------- | ------------------------------------- | ------------ |
| `db`           | PostgreSQL 18                         | `39699`      |
| `redis`        | 带密码与 AOF 的 Redis 7.2             | `39679`      |
| `db-push`      | 一次性 Schema Push 与事件任务数据升级 | —            |
| `admin-server` | 管理端 API                            | `39960`      |
| `user-server`  | 用户端 API 与邮件 Worker              | `39980`      |
| `event-server` | Bilibili 事件接入与任务处理           | `39970`      |
| `uptime-kuma`  | 可用性监控                            | `39901`      |

应用服务会等待 `db-push` 成功，以及数据库与 Redis 健康检查通过。

### 持久化数据

保留现有 `/home/guard-plus-data` 路径：PostgreSQL 在 `postgres/`，Redis 在 `redis/`，上传资源在 `public/`，Uptime Kuma 在 `uptime-kuma/`。日志按服务写入 `LOG_PATH`，默认为该根目录下的 `logs/`。

升级前备份数据库和数据目录。`db-push` 会直接应用 Schema 变更。日志保留与排查见 [日志指南](https://github.com/viyuni/guard-plus/blob/main/server/docs/log-troubleshooting.md)。

### 可用性监控

通过 `39901` 初始化 Uptime Kuma，添加接受 `200-299` 状态码的 HTTP 监控：

| 名称       | 内部 URL                           |
| ---------- | ---------------------------------- |
| 管理端 API | `http://admin-server:3600/health/` |
| 用户端 API | `http://user-server:3800/health/`  |
| 事件运行时 | `http://event-server:3700/health`  |

Kuma 与后端共用 Docker 网络，使用服务名与容器端口。通过宿主机防火墙或反向代理，将数据库、Redis 和监控端口限制在预期的访问范围。

## 3. 配置并启动前端

前端使用独立环境文件与 Compose 项目 `guard-plus-web`，可以与后端部署在不同主机：

```bash
cp webs/.env.example webs/.env.prod
```

在 `webs/.env.prod` 中填写与后端一致的公开 API 地址：

```dotenv
ADMIN_API_ORIGIN=https://api.admin.example.com
USER_API_ORIGIN=https://api.shop.example.com
ADMIN_WEB_PUBLISHED_PORT=3996
USER_WEB_PUBLISHED_PORT=3998
```

```bash
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml config --quiet
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

构建时，将 `ADMIN_API_ORIGIN` 与 `USER_API_ORIGIN` 分别作为 `NUXT_PUBLIC_API_BASE_URL` 注入。Nginx 在容器 `80` 端口托管 `.output/public`，并将浏览器路由回退到 `index.html`。修改 API 地址后必须重新构建对应镜像，容器运行时的环境变量无法修改已经生成的 SPA 配置。

单独部署一个前端时，在 `up` 命令末尾添加 `admin-web` 或 `user-web`。也可以本地执行 `vpr @web/admin#build` / `vpr @web/user#build`，再将 `.output/public` 托管到支持 SPA 回退的静态服务器。

## 4. 配置 HTTPS 反向代理

API 代理以 `server/nginx.prod.conf` 为模板，替换域名与证书路径。前端主机添加两个虚拟主机，分别代理管理端 `3996` 和用户端 `3998`：

```nginx
location / {
  proxy_pass http://127.0.0.1:3996;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

用户端虚拟主机使用 `3998`。运行 `nginx -t` 检查后，再执行 `nginx -s reload`。

## 更新与日常运维

前后端分别更新：

```bash
# 后端日志与重新构建
docker compose --env-file server/.env.prod -f server/compose.prod.yml logs -f
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build --force-recreate

# 显式重新执行 Schema Push 与数据升级
docker compose --env-file server/.env.prod -f server/compose.prod.yml up --force-recreate db-push

# 前端重新构建
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

`vpr @server/app#deploy` 仅部署后端，读取 `server/.env.prod`。已有根目录 `.env.prod` 仍可通过 `--env-file .env.prod` 显式使用；推荐将每组配置放在对应 Compose 文件旁边。

Redis 健康检查失败时，检查 Redis 与应用收到的密码是否一致。浏览器登录失败时，一起检查 HTTPS、API 构建参数、Web Origins、CORS 和 Cookie。刷新页面后路由丢失，通常是静态服务器未配置 SPA 回退。

[返回首页](/zh)
