// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  extends: ['../base'],
  ssr: false,
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: 'Viyuni Guard+',
      meta: [
        { charset: 'UTF-8' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [{ rel: 'icon', href: 'https://assets.viyuni.top/viyuni.svg' }],
    },
  },
  runtimeConfig: {
    public: {
      agentApiKey: process.env.NUXT_PUBLIC_AGENT_API_KEY,
    },
  },
});
