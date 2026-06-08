<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

<h1 align="center" style="margin-top: 2rem">Guard Plus - 哔哩哔哩大航海奖励系统</h1>

<p align="center">
  <a href="./package.json"> 
    <img src="https://img.shields.io/github/package-json/v/viyuni/guard-plus?filename=package.json&label=version" alt="Version" />
  </a>
  <a href="https://github.com/viyuni/guard-plus/actions/workflows/ci.yml">
    <img src="https://github.com/viyuni/guard-plus/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/viyuni/guard-plus" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-runtime-000000?logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white" alt="Nuxt" />
  <img src="https://img.shields.io/badge/Elysia-backend-7C3AED" alt="Elysia" />
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <strong>简体中文</strong>
</p>

Guard Plus 是一个面向哔哩哔哩大航海会员的奖励管理与履约系统，帮助主播、运营人员和管理员管理奖励规则、领取流程及履约记录。

系统适用于舰长、提督、总督等大航海会员等级，支持会员奖励查询、奖励领取、订单处理、积分管理以及异步事件处理等业务场景。

本项目是一个基于 **Vite+ 和 TypeScript** 的 Monorepo，包含 Nuxt 管理端和用户端、共享 Vue UI 组件库、Elysia 后端服务、后台任务队列以及跨包共享的 TypeScript 类型契约。

## Features

- **大航海奖励管理**：配置和管理围绕哔哩哔哩直播大航海会员等级的奖励。
- **管理控制台**：供运营人员审核、配置和处理奖励、用户、订单及积分相关数据。
- **用户领取平台**：允许大航海用户查询并领取当前可用的奖励。
- **事件与队列处理**：通过事件接入和后台任务处理异步奖励业务流程。
- **积分管理**：支持积分类型、积分账户、积分流水、兑换规则及积分转换。
- **类型安全协作**：通过共享 TypeScript 和 Valibot 契约保持前端、后端及数据结构一致。
- **多应用架构**：分别提供管理员 API、用户 API、事件服务及后台队列运行时。

## Packages

- [`@server/app`](./server/)：位于 `server/`，包含管理员和用户 API、事件接入、后台队列、共享后端模块、Drizzle 数据库结构、迁移，以及面向前端的 Eden 类型导出。
- [`@shared/schema`](./packages/schema/)：位于 `packages/schema/`，包含 Valibot API Schema、请求与响应类型，以及跨包共享契约。
- [`@web/admin`](./webs/admin/)：基于 Nuxt 的管理控制台，用于奖励配置和运营管理。
- [`@web/user`](./webs/user/)：基于 Nuxt 的用户端应用，用于奖励查询和领取。
- [`@web/ui`](./webs/ui/)：共享 Vue 组件、样式、Nuxt 模块集成及组件元数据。
- [`@web/base`](./webs/base/)：Web 应用共享的 Nuxt 基础层和品牌静态资源。

## Directory Structure

```text
.
├── server/                  # @server/app：Elysia 应用、事件运行时、队列、后端模块和数据库
├── packages/
│   └── schema/              # @shared/schema：共享 Schema 和类型
├── webs/
│   ├── admin/               # @web/admin：Nuxt 管理端
│   ├── base/                # @web/base：共享基础应用和品牌静态资源
│   ├── user/                # @web/user：Nuxt 用户端
│   └── ui/                  # @web/ui：共享 UI 组件库
├── AGENTS.md                # Agent 与项目工作流说明
├── package.json             # Workspace 脚本和依赖目录
└── vite.config.ts           # 根目录 Vite+ 配置
```

## Development

安装依赖并配置 Git Hooks：

```bash
vp install
vp config
```

运行整个工作区的格式化、代码检查和类型检查：

```bash
vpr check
```

运行整个工作区的测试：

```bash
vpr test
```

启动指定应用或服务：

```bash
vpr @server/app#dev:admin
vpr @server/app#dev:user
vpr @server/app#dev:event
vpr @server/app#queue
vpr @web/admin#dev
vpr @web/user#dev
```

构建后端二进制文件并生成 Eden 类型：

```bash
vpr @server/app#build
vpr @server/app#build:types
```

运行指定范围的类型检查：

```bash
vpr typecheck
vpr typecheck:schema
vpr typecheck:server
vpr typecheck:web
vpr @server/app#typecheck
```

## Backend

后端包为 [`@server/app`](./server/)，位于 `server/`。

- [`server/src/apps/admin`](./server/src/apps/admin/)：管理员 API 应用、管理员上下文、环境变量工具及管理员专属路由模块。
- [`server/src/apps/user`](./server/src/apps/user/)：用户 API 应用、用户上下文、环境变量工具及用户专属路由模块。
- [`server/src/apps/event`](./server/src/apps/event/)：直播事件接入运行时。
- [`server/src/modules`](./server/src/modules/)：由多个应用和队列共享的可复用后端业务模块。
- [`server/src/queues`](./server/src/queues/)：Bunqueue 后台任务定义。
- [`server/src/db`](./server/src/db/)：Drizzle 客户端、数据库 Schema、关系、迁移及种子数据脚本。
- [`server/src/context.ts`](./server/src/context.ts)：共享依赖容器、Elysia 上下文和事件容器配置。
- [`server/src/eden.ts`](./server/src/eden.ts)：供 Web 包使用的 Eden 类型导出入口。

## Database tasks

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:seed
vpr @server/app#db:studio
```

本地开发命令默认使用 `.env`，测试数据库相关命令使用 `.env.test`。

## UI Component Manifest

[`@web/ui`](./webs/ui/) 通过包子路径导出和 Nuxt 组件解析器暴露组件。

在 `webs/ui/src/components` 中添加、删除或重命名组件后，需要运行：

```bash
vpr @web/ui#generate:manifest
```

该命令会更新以下文件：

- [`webs/ui/package.json`](./webs/ui/package.json)
- [`webs/ui/nuxt/components.json`](./webs/ui/nuxt/components.json)
- [`webs/ui/types.d.ts`](./webs/ui/types.d.ts)
