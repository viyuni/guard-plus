// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxtjs/i18n'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  extends: ['../base'],
  css: ['~/assets/main.css'],

  runtimeConfig: {
    public: {
      version: (await import('../../package.json', { with: { type: 'json' } })).default.version,
    },
  },

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '简体中文', file: 'zh.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  app: {
    head: {
      meta: [
        { charset: 'UTF-8' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: 'Guard Plus — Bilibili Live Guard Rewards System documentation.',
        },
        { property: 'og:title', content: 'Guard Plus Docs' },
        {
          property: 'og:description',
          content:
            'Bilibili Live Guard Rewards System — documentation, changelog, and deployment guides.',
        },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'Guard Plus Docs' },
        {
          name: 'twitter:description',
          content: 'Bilibili Live Guard Rewards System documentation.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: 'https://assets.viyuni.top/viyuni.svg' }],
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
