import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL,
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
  devtools: {
    enabled: true,
  },
  css: [join(currentDir, './app/assets/main.css')],
  vite: {
    plugins: [tailwindcss() as any],
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
      include: ['../colada.options.ts', '../golar.config.ts'],
    },
  },
  fonts: {
    families: [
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Regular.woff2',
        weight: '400',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Normal.woff2',
        weight: '450',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Medium.woff2',
        weight: '500',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Semibold.woff2',
        weight: '600',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Demibold.woff2',
        weight: '650',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Bold.woff2',
        weight: '700',
      },
      {
        name: 'MiSans',
        src: '/fonts/mi-sans/MiSans-Heavy.woff2',
        weight: '900',
      },

      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Thin.ttf',
        weight: '100',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-ExtraLight.ttf',
        weight: '200',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Light.ttf',
        weight: '300',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Regular.ttf',
        weight: '400',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Medium.ttf',
        weight: '500',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-SemiBold.ttf',
        weight: '600',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Bold.ttf',
        weight: '700',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-ExtraBold.ttf',
        weight: '800',
      },
      {
        name: 'Noto Sans SC',
        src: '/fonts/noto-sans-sc/NotoSansSC-Black.ttf',
        weight: '900',
      },
    ],
  },
  nitro: {
    // noExternals:true
  },
});
