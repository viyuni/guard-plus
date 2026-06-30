---
title: 部署指南
description: 使用 Docker Compose 和 Nginx 部署 Guard Plus API、事件任务和静态 Web 应用。
---

# 部署指南

Guard Plus 分为两部分部署：`server/compose.prod.yml` 中的后端服务，以及管理端和用户端
Nuxt SPA。Nginx 负责 TLS，并将各个公开域名转发到对应服务。

---

## 前置条件

- 安装了 Docker 和 Docker Compose 的 Linux 服务器
- 为两个 Web 应用和两个 API 准备的域名与 TLS 证书
- 可用的 Bilibili 直播间和 Viyuni 登录同步服务

Docker 镜像会自行安装项目依赖，因此只有本地开发才需要 Bun。

---

## 1. 配置后端

克隆仓库，并从持续维护的示例创建生产环境文件：

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
cp server/.env.example .env.prod
```

至少需要替换所有 `change-me`，并配置以下部署相关变量：

```bash
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

VIYUNI_LOGIN_SYNC_URL=<sync-service-url>
VIYUNI_LOGIN_SYNC_PASSWORD=<sync-service-password>
```

请为每个应用填写唯一且准确的 HTTPS API Origin。Web Origins 支持以逗号分隔多个值；API
hostname 必须等于或隶属于其中一个 Web hostname。API 使用携带凭据的请求和认证 Cookie。

---

## 2. 启动后端服务

```bash
docker compose -f server/compose.prod.yml --env-file .env.prod up -d --build
docker compose -f server/compose.prod.yml --env-file .env.prod ps
```

| 服务           | 用途                           | 默认发布端口 |
| -------------- | ------------------------------ | ------------ |
| `db`           | PostgreSQL 18                  | `39699`      |
| `redis`        | 启用密码和 AOF 的 Redis        | `39679`      |
| `db-push`      | 一次性执行 Drizzle Schema Push | —            |
| `admin-server` | 管理端 Elysia API              | `39960`      |
| `user-server`  | 用户端 Elysia API              | `39980`      |
| `event-server` | Bilibili 事件接入与后台任务    | —            |

PostgreSQL、Redis、上传资源和图片持久化在 `/home/guard-plus-data` 下。

---

## 3. 配置并构建 Web 应用

管理端和用户端是静态 SPA，API 基础地址必须在**构建镜像或静态产物时**可用：

```bash
cp webs/admin/.env.example webs/admin/.env.prod
cp webs/user/.env.example webs/user/.env.prod
```

分别填写公开 API 地址：

```bash
# webs/admin/.env.prod
NUXT_PUBLIC_API_BASE_URL=https://api.admin.example.com

# webs/user/.env.prod
NUXT_PUBLIC_API_BASE_URL=https://api.shop.example.com
```

使用仓库提供的容器示例：

```bash
docker compose -f webs/admin/compose.example.yml up -d --build
docker compose -f webs/user/compose.example.yml up -d --build
```

两个示例默认都发布到 `3996` 端口；如果部署在同一台主机，请修改其中一个 `published`
端口。也可以运行 `vpr @web/admin#build` 和 `vpr @web/user#build`，再用支持 SPA
`index.html` 回退的静态服务器托管各应用的 `.output/public`。

---

## 4. 配置 Nginx

以 `server/nginx.prod.conf` 作为 API 反向代理模板，替换域名和证书路径；然后为管理端和
用户端 Web 容器添加对应的虚拟主机。Web 应用的 location 可参考：

```nginx
location / {
  proxy_pass http://127.0.0.1:3996;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
}
```

检查并重载 Nginx：

```bash
nginx -t
nginx -s reload
```

---

## 日常运维

```bash
# 持续查看后端日志
docker compose -f server/compose.prod.yml --env-file .env.prod logs -f

# 重新执行一次 Schema Push
docker compose -f server/compose.prod.yml --env-file .env.prod up db-push

# 更新代码后重新构建
docker compose -f server/compose.prod.yml --env-file .env.prod up -d --build
```

如果 Redis 健康检查失败，请确认 Redis 容器与应用服务收到相同的 `REDIS_PASSWORD`。如果浏览器
登录失败，应同时检查准确的前端 Origin、HTTPS、API 基础地址、CORS 配置和认证 Cookie。

---

[返回首页](/zh)
