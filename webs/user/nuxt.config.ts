// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['../base'],
  css: ['~/assets/main.css'],

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

  app: {
    head: {
      title: 'MiSheng Shop',
      meta: [
        { charset: 'UTF-8' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [{ rel: 'icon', href: 'https://assets.viyuni.top/guard-plus/misheng-head.ico' }],
    },
  },

  nitro: {
    preset: 'bun',
  },

  routeRules: {
    '/': {
      // swr: 60,
    },
  },
});
