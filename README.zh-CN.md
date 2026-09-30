<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./webs/base/app/assets/guard-plus-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./webs/base/app/assets/guard-plus-light.png" />
    <img src="./webs/base/app/assets/guard-plus-light.png" alt="Guard Plus" width="230" />
  </picture>
</p>

<hr />

<p align="center">哔哩哔哩大航海奖励管理与履约系统</p>

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

<p align="center">
  <a href="#功能特性">功能特性</a> ·
  <a href="#本地开发">本地开发</a> ·
  <a href="./webs/docs/content/zh/deploy.md">部署指南</a> ·
  <a href="./webs/docs/content/zh/about.md">项目文档</a>
</p>

Guard Plus 帮助主播与运营人员管理哔哩哔哩大航海会员的奖励，从会员事件、奖励规则，到领取、积分、订单和履约记录。

管理端负责日常运营，用户端为舰长、提督和总督提供查询与领取奖励的入口。

## 功能特性

| 模块          | 提供的能力                                         |
| ------------- | -------------------------------------------------- |
| 🎁 大航海奖励 | 按会员等级配置奖励规则并管理履约                   |
| 🛡️ 管理控制台 | 用户、商品、库存、订单、奖励和积分管理             |
| 👥 用户门户   | 奖励查询与领取、积分余额和订单记录                 |
| ⚡ 事件与任务 | Bilibili 事件接入、持久化事件任务和内嵌邮件 Worker |
| 🧩 共享契约   | 前后端共用 Valibot Schema 与 Eden 类型             |

## 本地开发

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

`vpr check` 会生成 Eden 类型，并执行全工作区格式化、Lint 和类型检查。后端测试使用 Docker 服务与 `server/.env.test`，配置见 [后端说明](./server/README.md)。

## 部署

前后端使用独立的 Compose 项目和环境文件，分别构建与启动：

```bash
cp server/.env.example server/.env.prod
cp webs/.env.example webs/.env.prod
# Configure production domains and secrets before starting.
docker compose --env-file server/.env.prod -f server/compose.prod.yml up -d --build
docker compose --env-file webs/.env.prod -f webs/compose.prod.yml up -d --build
```

Web 镜像使用 Nginx 托管生成的 SPA。构建时分别注入 `ADMIN_API_ORIGIN` 与 `USER_API_ORIGIN`；修改 API 地址后，需要重新构建对应 Web 镜像。

端口、持久化目录、反向代理、更新流程和 Docker 文件职责见 [部署指南](./webs/docs/content/zh/deploy.md)。

## 工作区包

| 包               | 职责                                       | 说明                                  |
| ---------------- | ------------------------------------------ | ------------------------------------- |
| `@server/app`    | Elysia API、事件、任务、数据库与 Eden 类型 | [后端](./server/README.md)            |
| `@shared/schema` | Valibot Schema 与共享请求、响应契约        | [Schema](./packages/schema/README.md) |
| `@web/admin`     | Nuxt 管理控制台                            | [管理端](./webs/admin/README.md)      |
| `@web/user`      | Nuxt 用户门户                              | [用户端](./webs/user/README.md)       |
| `@web/ui`        | Vue 组件、样式、字体与 Nuxt 集成           | [UI](./webs/ui/README.md)             |
| `@web/base`      | 共享 Nuxt 基础层与品牌资源                 | [基础层](./webs/base/README.md)       |
| `docs`           | Nuxt Content 中英文文档站                  | [文档站](./webs/docs/README.md)       |

## 项目结构

```text
.
├── server/                 # API、事件运行时、业务模块与基础设施
├── packages/schema/        # 跨包共享契约
├── webs/
│   ├── admin/              # 管理端 SPA
│   ├── user/               # 用户端 SPA
│   ├── docs/               # 双语文档站
│   ├── base/               # 共享 Nuxt 基础层
│   ├── ui/                 # 共享 UI 组件
│   ├── Dockerfile          # Web 静态镜像的统一构建
│   └── compose.prod.yml    # 独立前端生产栈
├── tools/oxlint-plugin/    # 依赖命名与架构边界规则
├── AGENTS.md               # 协作约定与开发命令
└── vite.config.ts          # Vite+ 任务、格式化与 Lint 配置
```

## 参与开发

导入边界、检查流程和提交规范见 [AGENTS.md](./AGENTS.md)。检查 Web 包前先构建 Eden 类型，并同步维护中英文 README 与文档页面。

添加、删除或重命名共享 UI 组件后，重新生成组件元数据：

```bash
vpr @web/ui#generate:manifest
```

<details>
<summary>数据库任务与定向检查</summary>

```bash
vpr @server/app#db:generate
vpr @server/app#db:push
vpr @server/app#db:push:test
vpr @server/app#db:studio
vpr @server/app#db:studio:test
vpr typecheck:schema
vpr typecheck:server
vpr typecheck:web
```

数据库任务读取 `server/.env`，测试任务读取 `server/.env.test`。Schema Push 会直接修改所连接的数据库。

</details>

## 许可证

见 [LICENSE](./LICENSE)。
