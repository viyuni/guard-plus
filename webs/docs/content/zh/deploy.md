---
title: 部署指南
description: 使用 Docker Compose 和 Nginx 将 Guard Plus 部署到生产环境。
---

# 部署指南

本指南介绍如何使用 **Docker Compose** 和 **Nginx** 作为反向代理将 Guard Plus 部署到生产服务器。

---

## 前置条件

- 一台安装了 **Docker** 和 **Docker Compose** 的 Linux 服务器
- 用于本地构建任务的 **Bun** 运行时
- 已配置 DNS 的域名（如 `api.example.com`、`api-admin.example.com`）
- 域名的 SSL 证书

---

## 项目设置

### 1. 克隆仓库

```bash
git clone https://github.com/viyuni/guard-plus.git
cd guard-plus
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置环境变量

在项目根目录创建 `.env.prod` 文件，包含以下必需变量：

```bash
# 必需 — 未设置将导致错误
DATA_SECRET=<your-secret-key>
BILI_ROOM=<your-bilibili-room-id>
ADMIN_ORIGINS=https://admin.example.com
USER_ORIGINS=https://example.com
ADMIN_JWT_SECRET=<your-admin-jwt-secret>
USER_JWT_SECRET=<your-user-jwt-secret>
SUPER_ADMIN_PASSWORD=<secure-admin-password>
VIYUNI_LOGIN_SYNC_URL=<sync-service-url>
VIYUNI_LOGIN_SYNC_PASSWORD=<sync-service-password>

# 可选 — 默认值如下
NODE_ENV=production
LOG_LEVEL=info
POSTGRES_USER=admin
POSTGRES_PASSWORD=guard_plus
POSTGRES_DB=guard-plus
PASSWORD_HASH_COST=12
BILI_REGISTER_CODE_TTL_SECONDS=300
REDIS_CONNECTION_TIMEOUT_MS=5000
REDIS_IDLE_TIMEOUT_MS=0
REDIS_MAX_RETRIES=100
SUPER_ADMIN_UID=0721
SUPER_ADMIN_USERNAME=Admin

# 可选 — SMTP 邮件通知
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NOTIFY_EMAILS=
```

---

## Docker 部署

### 4. 启动服务

生产环境 Docker Compose 文件定义了以下服务：

| 服务           | 描述                       | 默认端口 |
| -------------- | -------------------------- | -------- |
| `db`           | PostgreSQL 18 (Alpine)     | `39699`  |
| `redis`        | Redis 7.2（AOF 持久化）    | `39679`  |
| `db-push`      | 一次性 Drizzle Schema 迁移 | —        |
| `admin-server` | 管理端 API (Elysia)        | `39960`  |
| `user-server`  | 用户端 API (Elysia)        | `39980`  |
| `event-server` | 事件接入运行时             | —        |

```bash
# 启动所有服务
docker compose -f server/compose.prod.yml --env-file .env.prod up -d
```

### 5. 验证服务

```bash
# 检查服务状态
docker compose -f server/compose.prod.yml ps

# 查看日志
docker compose -f server/compose.prod.yml logs -f
```

### 数据持久化

持久化数据存储于：

- `/home/guard-plus-data/postgres` — PostgreSQL 数据
- `/home/guard-plus-data/redis` — Redis AOF 数据
- `/home/guard-plus-data/public` — 上传的图片和资源

---

## Nginx 反向代理

### 6. 配置 Nginx

使用提供的 Nginx 配置模板（`server/nginx.prod.conf`）。更新 `server_name` 和 SSL 证书路径：

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name api-admin.example.com api.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name api-admin.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  location / {
    proxy_pass http://127.0.0.1:39960;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name api.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  location / {
    proxy_pass http://127.0.0.1:39980;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### 7. 应用 Nginx 配置

```bash
# 测试配置
nginx -t

# 重载 Nginx
nginx -s reload
```

---

## 前端部署

### 8. 构建前端应用

```bash
# 构建管理后台
vpr @web/admin#build

# 构建用户应用
vpr @web/user#build
```

构建产物位于各自应用的 `.output/public` 目录下。使用 Nginx 或其他静态文件服务器部署。

### 9. 静态站点 Nginx 配置示例

```nginx
server {
  listen 443 ssl;
  server_name admin.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.pem;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  root /path/to/webs/admin/.output/public;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 端口映射参考

| 服务         | 内部端口 | 默认发布端口 | 环境变量覆盖                         |
| ------------ | -------- | ------------ | ------------------------------------ |
| PostgreSQL   | `5432`   | `39699`      | `GUARD_PLUS_POSTGRES_PUBLISHED_PORT` |
| Redis        | `6379`   | `39679`      | `GUARD_PLUS_REDIS_PUBLISHED_PORT`    |
| Admin Server | `3600`   | `39960`      | `GUARD_PLUS_ADMIN_PUBLISHED_PORT`    |
| User Server  | `3800`   | `39980`      | `GUARD_PLUS_USER_PUBLISHED_PORT`     |

---

## 健康检查

所有服务均包含 Docker 健康检查：

- **PostgreSQL**：每 10 秒执行 `pg_isready`
- **Redis**：每 10 秒执行 `redis-cli ping`
- **API 服务**：依赖健康的 DB + Redis 后再启动

---

## 故障排查

### 数据库迁移失败

确保在运行迁移前 PostgreSQL 已健康运行。使用以下命令检查：

```bash
docker compose -f server/compose.prod.yml logs db
```

### API 服务无法连接数据库

确认 `.env.prod` 中的 `DATABASE_URL` 与 `compose.prod.yml` 中的服务名称匹配。主机名应为 `db` 和 `redis`（Docker Compose 服务名称）。

### SSL 证书问题

确保证书文件位于 Nginx 配置中指定的路径。使用 Let's Encrypt：

```bash
certbot certonly --nginx -d api.example.com -d api-admin.example.com
```

---

[返回首页](/)
