declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_SERVER_BASE_URL: string;
    readonly NUXT_PUBLIC_API_BASE_URL: string;
    readonly NUXT_PUBLIC_BILI_ROOM_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
