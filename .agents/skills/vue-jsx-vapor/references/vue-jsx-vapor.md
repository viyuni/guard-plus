# Vue JSX Vapor Reference

Source docs gathered from https://jsx-vapor.netlify.app/ on 2026-05-11.

## What It Is

`vue-jsx-vapor` is Vue JSX with Vapor Mode support. It supports Vue built-in directives in JSX, most Vue macros adapted for JSX, Volar type support through TS Macro, and Virtual DOM/Vapor interop.

## Install And Configure

Requirements:

- Vue `>= 3.6`.
- TS Macro VS Code extension for Volar support.
- `@ts-macro/tsc`/`tsmc` instead of plain `tsc` when typechecking projects that rely on the macros.

Install:

```bash
pnpm add vue-jsx-vapor
pnpm add vue@3.6.0-alpha.2
```

Vite:

```ts
import { defineConfig } from 'vite';
import vueJsxVapor from 'vue-jsx-vapor/vite';

export default defineConfig({
  plugins: [
    vueJsxVapor({
      macros: true,
    }),
  ],
});
```

TypeScript:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "vue-jsx-vapor"
  }
}
```

Manual TS Macro/Volar config when auto-discovery is not enough:

```ts
import vueJsxVapor from 'vue-jsx-vapor/volar';

export default {
  plugins: [
    vueJsxVapor({
      macros: true,
    }),
  ],
};
```

Standalone macros for Virtual DOM projects:

```bash
pnpm add @vue-jsx-vapor/macros -D
```

```ts
import jsxMacros from '@vue-jsx-vapor/macros/vite';

export default {
  plugins: [jsxMacros()],
};
```

## Directives

Supported directives include:

- `v-if`, `v-else-if`, `v-else`
- `v-for`
- `v-model`
- `v-slot`, `v-slots`
- `v-html`, `v-text`
- `v-once`

JSX syntax adaptations:

- Dynamic arguments use `$`: `v-model:$name={value.value}`.
- Modifiers use `_`: `onSubmit_prevent`, `v-model_number`.
- Use `<template>` fragments for control-flow directives when no concrete element is wanted.

Examples:

```tsx
<form onSubmit_prevent={submit}>
  <input v-model_trim={name.value} />
</form>
```

```tsx
<>
  <template v-if={count.value === 0}>Zero</template>
  <template v-else-if={count.value === 1}>One</template>
  <template v-else>Many</template>
</>
```

```tsx
<template v-for={(item, index) in items.value} key={item.id}>
  <Row item={item} index={index} />
</template>
```

Slots:

```tsx
<Child>
  default slot
  <template v-slot:item={{ value }}>{value}</template>
</Child>
```

```tsx
<Child
  v-slots={{
    default: () => <>default slot</>,
    item: ({ value }) => <>{value}</>,
  }}
/>
```

Slot limitation: default parameter values in slot-scope destructuring, such as `v-slot={({ foo = '' })}`, are not supported.

## Macros

Macros are compile-time features and require `macros: true`.

`defineComponent` defines Virtual DOM components. `defineVaporComponent` defines Vapor components.

```tsx
import { defineVaporComponent } from 'vue';

const Counter = defineVaporComponent(({ initial = 0 }: { initial?: number }) => {
  const count = ref(initial);

  return () => <button onClick={() => count.value++}>{count.value}</button>;
});
```

Macro behavior to remember:

- Async setup functions can use `await`; compiled output handles async context.
- Referenced props are automatically collected into the component `props` option.
- Destructured props are restructured to preserve reactivity.
- Append `!` to a prop's default value to mark it required.
- Rest props become `useAttrs()`, and `inheritAttrs` defaults to `false`.

`defineModel`:

- Append `!` to mark a model required.
- Model values can be read synchronously after modification.
- Hyphenated model names are not supported.

`defineSlots`:

- Generic slots are treated as optional.
- Prefer default implementations for better ergonomics.

```tsx
const slots = defineSlots({
  title: ({ text }: { text?: string }) => <>title slot: {text}</>,
  default: ({ count }: { count: number }) => <>default slot: {count}</>,
});
```

`defineExpose` works like Vue SFC `defineExpose`.

`defineStyle`:

- Supports CSS variables and JavaScript variable binding.
- Multiple calls can be used in one file.
- Supports `css`, `scss`, `sass`, `less`, `stylus`, and `postcss`.
- Top-level definitions default to unscoped.
- Definitions inside functions default to scoped.
- Assign the result to a variable for CSS Modules.

```tsx
export default () => {
  const styles = defineStyle(`
    .root {
      color: blue;
    }
  `);

  return <div class={styles.root} />;
};
```

## useRef

`useRef` is an alias-like helper around `shallowRef` with automatic component ref type inference.

```tsx
import { useRef } from 'vue-jsx-vapor';

export default () => {
  const child = useRef<typeof Child>();

  return <Child ref={child} />;
};
```

## Virtual DOM And Vapor Interop

Enable interop when mixing Virtual DOM and Vapor components:

```ts
import vueJsxVapor from 'vue-jsx-vapor/vite';

export default defineConfig({
  plugins: [
    vueJsxVapor({
      macros: true,
      interop: true,
    }),
  ],
});
```

Mount with `vaporInteropPlugin`:

```ts
import { createApp, createVaporApp, vaporInteropPlugin } from 'vue';

createApp(App).use(vaporInteropPlugin).mount('#app');
createVaporApp(App).use(vaporInteropPlugin).mount('#app');
```

With `interop: true`, JSX inside `defineVaporComponent` compiles to Vapor DOM, while JSX outside `defineVaporComponent` compiles to Virtual DOM.

## ESLint

Vue JSX Vapor provides an ESLint plugin for directive and macro formatting. When adding it to an existing repo, inspect the local ESLint stack first and prefer extending existing flat-config or legacy-config conventions.

## Source Pages

- https://jsx-vapor.netlify.app/introduction/getting-started
- https://jsx-vapor.netlify.app/introduction/interop
- https://jsx-vapor.netlify.app/features/directives
- https://jsx-vapor.netlify.app/features/macros
- https://jsx-vapor.netlify.app/features/use-ref
