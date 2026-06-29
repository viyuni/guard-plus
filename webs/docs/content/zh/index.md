---
title: Guard Plus
description: Bilibili Live 大航海奖励系统 — 管理大航海成员的奖励、发放与领取流程。
---

::DocsHero

::AppLogo{width="280"}

# Guard Plus

Bilibili Live 大航海奖励系统

Bilibili Live 大航海会员的奖励管理与发放系统。帮助主播、运营和管理员管理大航海成员的奖励规则、发放记录和领取流程。

::DocsBadges

::

---

## 功能特性

::DocsCard{title="大航海奖励管理" icon="Gift"}
围绕 Bilibili Live 大航海会员等级（舰长、提督、总督）配置和运营奖励。
::

::DocsCard{title="管理后台" icon="ShieldCheck"}
通过功能完善的管理仪表盘，审核、配置和处理奖励相关数据。
::

::DocsCard{title="用户领取门户" icon="Users"}
大航海成员可通过直观的用户界面浏览和领取可用奖励。
::

::DocsCard{title="事件与队列处理" icon="Workflow"}
通过事件接入和后台作业处理实现异步奖励工作流。
::

---

## 技术栈

::DocsCard{title="前端" icon="Monitor"}

- **Nuxt 4** 静态 SPA 应用
- **Vue 3** Composition API
- 共享 **@web/ui** 组件与样式
- **Tailwind CSS** / shadcn-vue
- **Pinia Colada**、TanStack Table 与 vee-validate

::

::DocsCard{title="后端" icon="Server"}

- **Elysia** HTTP 框架
- **Drizzle ORM** + PostgreSQL
- **Redis** 队列与缓存
- **Bun** JavaScript 运行时
- **Eden** 类型安全 RPC

::

::DocsCard{title="工具链" icon="Wrench"}

- **TypeScript 6.x** 全栈类型
- **Vite+** monorepo 工具
- **Golar** Vue 类型检查
- **Valibot** Schema 校验
- **Docker** 容器化
- **GitHub Actions** CI/CD

::

---

## 快速开始

```bash
# 安装依赖
vp install

# 运行所有检查
vpr check

# 启动开发服务器
vpr @web/admin#dev
vpr @web/user#dev
vpr docs#dev
```

[在 GitHub 上查看 →](https://github.com/viyuni/guard-plus)
