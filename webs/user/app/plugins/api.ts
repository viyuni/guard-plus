import type { Treaty } from '@elysia/eden';
import type { UserApp } from '@server/app';

import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin(() => {
  const {
    public: { apiBaseUrl },
  } = useRuntimeConfig();

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  const api = createApiClient<UserApp>({
    baseUrl: apiBaseUrl,
  });

  return {
    provide: {
      api,
    },
  };
});

export type UserApi = Treaty.Create<UserApp>;
