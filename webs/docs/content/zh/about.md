---
title: 关于 Guard Plus
description: 了解 Guard Plus 的项目架构、包结构和技术选型。
---

# 关于 Guard Plus

Guard Plus 是为 [Bilibili Live](https://live.bilibili.com) 大航海会员打造的**奖励管理与发放系统**。帮助主播、运营和管理员管理大航海成员（舰长、提督、总督）的奖励规则、发放记录和领取流程。

## 项目概览

本项目是一个 **Vite+ TypeScript monorepo**，包含：

- **Nuxt 管理后台、用户应用和文档站** 提供前端界面
- **共享 Vue UI 包** 供三个 Web 应用共同使用
- **Elysia 后端** 提供 API 服务
- **后台队列** 处理异步任务
- **跨包 TypeScript 共享契约** 确保类型安全

---

## 架构

```text
Admin SPA ── Admin API ─┐
User SPA  ── User API  ─┼── PostgreSQL / Redis
Bilibili  ── Event app ─┘

Admin / User / Docs ── @web/base + @web/ui
```

---

用户 API 内嵌 bunqueue 邮件 Worker。Bilibili 事件任务持久化在 PostgreSQL，由事件应用处理。

## 包说明

### `@server/app` — 后端

Elysia API 应用，包含管理端和用户端 API、事件接入、后台队列、共享后端模块、Drizzle Schema、数据库迁移和 Eden 类型导出。

- `server/src/apps/admin` — 管理端 HTTP 应用（配置、组合根、`http/` 路由、专属 features）
- `server/src/apps/user` — 用户端 HTTP 应用（结构同上）
- `server/src/apps/event` — 事件接入运行时
- `server/src/modules` — 可复用的业务模块，每个模块默认导出 Ripple Manifest 清单
- `server/src/infrastructure` — db、redis、queue、logger、mail、storage 与 HTTP 适配器
- `server/src/config` — 环境变量片段，以及共享配置 ripple 与由它派生的能力 ripple
- `server/src/shared` — 与业务无关的错误与工具函数

### `@shared/schema` — 共享契约

Valibot API Schema、请求/响应类型以及前后端共享的跨包契约。

### `@web/admin` — 管理后台

用于奖励配置和运营管理的 Nuxt 管理控制台。

### `@web/user` — 用户门户

供大航海成员查询和领取奖励的 Nuxt 用户端应用。

### `@web/ui` — UI 库

所有前端应用共享的 Vue 组件、样式、Nuxt 模块集成和组件元数据。

### `@web/base` — 共享基础

Web 应用和文档共享的 Nuxt 基础应用及静态品牌资源。

### `webs/docs` — 文档站

基于 Nuxt Content 的双语文档站，涵盖项目、架构、版本和部署说明。它继承 `@web/base` 并消费
`@web/ui`，因此组件、主题、字体和前端工具链与管理端、用户端保持一致。

---

## 技术栈详情

| 层级     | 技术                                                   |
| -------- | ------------------------------------------------------ |
| 运行时   | [Bun](https://bun.sh)                                  |
| 前端     | [Nuxt 4](https://nuxt.com), [Vue 3](https://vuejs.org) |
| 文档     | [Nuxt Content](https://content.nuxt.com)               |
| 后端     | [Elysia](https://elysiajs.com)                         |
| 数据库   | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)   |
| 缓存     | Redis                                                  |
| 样式     | [Tailwind CSS](https://tailwindcss.com), shadcn-vue    |
| 校验     | [Valibot](https://valibot.dev)                         |
| Monorepo | [Vite+](https://viteplus.dev)                          |
| CI/CD    | GitHub Actions                                         |

---

## 开发指南

使用 Vite+ CLI（`vp` / `vpr`）、Bun **1.4.2**，以及 Docker Compose 提供本地基础设施。以下命令均从仓库根目录执行。

### 1. 准备工作区

```bash
vp install
vp config
cp server/.env.example server/.env
cp webs/admin/.env.example webs/admin/.env
cp webs/user/.env.example webs/user/.env
```

后端示例默认采用生产配置。本地使用前，将 `NODE_ENV` 改为 `development`、替换密钥，并在 `server/.env` 中设置本地连接：

```dotenv
DATABASE_URL=postgresql://admin:guard_plus@localhost:8699/guard-plus
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
ADMIN_API_ORIGIN=http://localhost:3600
ADMIN_WEB_ORIGINS=http://localhost:3000
USER_API_ORIGIN=http://localhost:3800
USER_WEB_ORIGINS=http://localhost:3001
```

启动事件接入前，还需要填写 `BILI_ROOM` 与登录同步服务配置。启动本地数据库和 Redis，再初始化 Schema：

```bash
docker compose -f server/compose.dev.yml up -d --wait
vpr @server/app#db:push
vpr @server/app#db:seed
vpr @server/app#build:types
```

`db:seed` 会填充开发数据，仅对本地开发数据库执行。

### 2. 启动应用

每个命令在独立终端执行：

| 应用       | 命令                             | 默认地址                |
| ---------- | -------------------------------- | ----------------------- |
| 管理端 API | `vpr @server/app#dev:admin`      | `http://localhost:3600` |
| 用户端 API | `vpr @server/app#dev:user`       | `http://localhost:3800` |
| 事件运行时 | `vpr @server/app#dev:event`      | `http://localhost:3700` |
| 管理端 Web | `vpr @web/admin#dev --port 3000` | `http://localhost:3000` |
| 用户端 Web | `vpr @web/user#dev --port 3001`  | `http://localhost:3001` |
| 文档站     | `vpr docs#dev --port 3002`       | `http://localhost:3002` |

邮件 Worker 随用户 API 启动，事件任务随事件运行时启动，没有独立的 `queue` 命令。

### 3. 检查与构建

```bash
vpr check
vpr test
vpr @server/app#build
vpr @server/app#build:types
vpr @web/admin#build
vpr @web/user#build
vpr docs#build
```

`vpr check` 会生成 Eden 类型，并执行全工作区格式化、Lint 和类型检查。后端测试使用 Docker 服务与 `server/.env.test`，配置见 [后端说明](https://github.com/viyuni/guard-plus/blob/main/server/README.md)。

[返回首页](/zh)
