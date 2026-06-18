import { type Treaty } from '@elysia/eden';
import type { AdminApp } from '@server/app';

import { defineNuxtPlugin } from '#app';
import { createApiClient } from '#imports';

export default defineNuxtPlugin(() => {
  const api = createApiClient<AdminApp>();

  return {
    provide: {
      api,
    },
  };
});

export type AdminApi = Treaty.Create<AdminApp>;
