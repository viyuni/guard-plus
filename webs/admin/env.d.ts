import type { AdminApi } from './app/plugins/api';

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_SERVER_BASE_URL: string;
    readonly NUXT_PUBLIC_API_BASE_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module '#app' {
  interface PageMeta {
    /**
     * Whether the route requires authentication
     */
    requiresAuth?: boolean;

    /**
     * route title
     */
    title?: string;
  }
}

declare module '@pinia/colada' {
  interface TypesConfig {
    queryMeta: {};
    mutationMeta: {
      showToast?: boolean;
      errorMessage?: string;
      successMessage?: string;
    };
  }
}

export {};
