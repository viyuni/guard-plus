---
title: 关于 Guard Plus
description: 了解 Guard Plus 的项目架构、包结构和技术选型。
---

# 关于 Guard Plus

Guard Plus 是为 [Bilibili Live](https://live.bilibili.com) 大航海会员打造的**奖励管理与发放系统**。帮助主播、运营和管理员管理大航海成员（舰长、提督、总督）的奖励规则、发放记录和领取流程。

## 项目概览

本项目是一个 **Vite+ TypeScript monorepo**，包含：

- **Nuxt 管理后台和用户应用** 提供前端界面
- **共享 Vue UI 包** 包含可复用组件
- **Elysia 后端** 提供 API 服务
- **后台队列** 处理异步任务
- **跨包 TypeScript 共享契约** 确保类型安全

---

## 架构

```
┌─────────────────────────────────────────────────────┐
│                     客户端层                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 管理后台 │  │ 用户应用 │  │   文档   │          │
│  │ (Nuxt 4) │  │ (Nuxt 4) │  │ (Nuxt 4) │          │
│  └────┬─────┘  └────┬─────┘  └──────────┘          │
│       │             │                                │
│  ┌────┴─────────────┴────┐                          │
│  │     共享 UI (Vue)     │                          │
│  └───────────────────────┘                          │
├─────────────────────────────────────────────────────┤
│                      API 层                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  管理    │  │   用户   │  │   事件   │          │
│  │  服务    │  │   服务   │  │   服务   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │                  │
├───────┴─────────────┴─────────────┴─────────────────┤
│                     数据层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │    后台队列      │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 包说明

### `@server/app` — 后端

Elysia API 应用，包含管理端和用户端 API、事件接入、后台队列、共享后端模块、Drizzle Schema、数据库迁移和 Eden 类型导出。

- `server/src/apps/admin` — 管理端 API、管理上下文和仅管理端可用的路由模块
- `server/src/apps/user` — 用户端 API、用户上下文和仅用户端可用的路由模块
- `server/src/apps/event` — 事件接入运行时
- `server/src/modules` — 可复用的后端模块
- `server/src/queues` — 后台任务定义
- `server/src/db` — Drizzle 客户端、Schema、关联、迁移

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

---

## 技术栈详情

| 层级     | 技术                                                   |
| -------- | ------------------------------------------------------ |
| 运行时   | [Bun](https://bun.sh)                                  |
| 前端     | [Nuxt 4](https://nuxt.com), [Vue 3](https://vuejs.org) |
| 后端     | [Elysia](https://elysiajs.com)                         |
| 数据库   | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)   |
| 缓存     | Redis                                                  |
| 样式     | [Tailwind CSS](https://tailwindcss.com), shadcn-vue    |
| 校验     | [Valibot](https://valibot.dev)                         |
| Monorepo | [Vite+](https://github.com/antfu/vite-plus)            |
| CI/CD    | GitHub Actions                                         |

---

## 开发指南

```bash
# 安装依赖并配置 Git Hooks
vp install
vp config

# 运行全仓库检查（格式化、Lint、类型检查）
vpr check

# 运行测试
vpr test

# 启动特定服务
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @web/admin#dev
vpr @web/user#dev
```

---

[返回首页](/)
