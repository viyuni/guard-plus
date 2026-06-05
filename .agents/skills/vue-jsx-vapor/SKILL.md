---
name: vue-jsx-vapor
description: Build, review, migrate, and configure Vue JSX Vapor applications and Vue TSX components using vue-jsx-vapor. Use when working with Vue 3.6+ TSX/JSX files, Vapor Mode, defineVaporComponent, JSX directives such as v-if/v-for/v-model/v-slot, vue-jsx-vapor macros, TS Macro/Volar setup, Vite plugin setup, ESLint setup, useRef, or Virtual DOM/Vapor interop.
---

# Vue JSX Vapor

## Overview

Use this skill to apply Vue JSX Vapor's TSX syntax, compiler setup, macros, and interop rules accurately. Prefer the repo's existing Vue, Vite, TSX, and validation conventions first, then layer Vue JSX Vapor-specific behavior on top.

## Workflow

1. Inspect local dependencies and config before changing code: `package.json`, `vite.config.ts`, `tsconfig.json`, ESLint config, and nearby `.tsx` components.
2. Load [references/vue-jsx-vapor.md](references/vue-jsx-vapor.md) when implementing or reviewing Vue JSX Vapor syntax, configuration, macros, directives, or interop.
3. Choose the rendering mode deliberately:
   - Use `defineVaporComponent` for Vapor components.
   - Use `defineComponent` or ordinary function components for Virtual DOM components.
   - Enable `interop: true` and install `vaporInteropPlugin` when mixing the two modes.
4. Enable `macros: true` before using Vue JSX Vapor macros such as `defineModel`, `defineSlots`, `defineExpose`, or `defineStyle`.
5. Keep TypeScript JSX settings aligned: `jsx: "preserve"` and `jsxImportSource: "vue-jsx-vapor"`.
6. Validate with the project's normal checks. In this repo, prefer `vpr check` or narrower package checks when available.

## Coding Guidance

Use Vue JSX Vapor syntax only where the project is configured for it. If a file is plain Vue JSX, avoid introducing directives or macros until the compiler and type tooling are present.

Prefer directive attributes over JavaScript rewrites when the task is specifically about Vue JSX Vapor behavior:

```tsx
<input v-model_trim={name.value} />
<button onClick_stop={submit}>Save</button>
<template v-if={ready.value}>Ready</template>
<template v-for={(item, index) in items.value} key={item.id}>
  <Row item={item} index={index} />
</template>
```

Remember these project-risk points:

- Vue JSX Vapor currently expects Vue `>= 3.6`.
- TS Macro is needed for editor/type support of directives and macros.
- `@ts-macro/tsc`/`tsmc` is recommended when typechecking these macros.
- Dynamic directive arguments use `$` because JSX cannot use Vue template `[]` argument syntax.
- Directive modifiers use `_` because JSX attribute names cannot contain `.`.
- Hyphenated `defineModel` names are not supported.
