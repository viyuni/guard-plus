import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      biliRoomId: process.env.NUXT_PUBLIC_BILI_ROOM_ID,
    },
  },
  devtools: {
    enabled: true,
  },
  css: [join(currentDir, './app/assets/main.css')],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@elysia/eden',
        '@tanstack/vue-form',
        '@tanstack/vue-table',
        '@vueuse/core',
        '@vueuse/router',
        'class-variance-authority',
        'clsx',
        'ky',
        'lucide-vue-next',
        'reka-ui',
        'tailwind-merge',
        'vee-validate',
        'vue-sonner',
      ],
    },
  },
  experimental: {
    viteEnvironmentApi: true,
  },
  modules: [
    '@web/ui/nuxt',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@nuxt/fonts',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '@web/ui/*': ['../../ui/src/*'],
        },
      },
    },
    sharedTsConfig: {
      include: ['../colada.options.ts'],
    },
  },
});
