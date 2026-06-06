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
  fonts: {
    families: [
      {
        name: 'MiSans',
        src: 'https://assets.viyuni.top/fonts/MiSans-Regular.woff2',
        weight: '400',
      },
      { name: 'MiSans', src: 'https://assets.viyuni.top/fonts/MiSans-Normal.woff2', weight: '450' },
      { name: 'MiSans', src: 'https://assets.viyuni.top/fonts/MiSans-Medium.woff2', weight: '500' },
      {
        name: 'MiSans',
        src: 'https://assets.viyuni.top/fonts/MiSans-Semibold.woff2',
        weight: '600',
      },
      {
        name: 'MiSans',
        src: 'https://assets.viyuni.top/fonts/MiSans-Demibold.woff2',
        weight: '650',
      },
      { name: 'MiSans', src: 'https://assets.viyuni.top/fonts/MiSans-Bold.woff2', weight: '700' },
      { name: 'MiSans', src: 'https://assets.viyuni.top/fonts/MiSans-Heavy.woff2', weight: '900' },
      { name: 'Noto Sans SC', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },
});
