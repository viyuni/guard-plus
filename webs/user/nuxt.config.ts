// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['../base'],
  css: ['~/assets/main.css'],

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
      swr: 60,
    },
  },
});
