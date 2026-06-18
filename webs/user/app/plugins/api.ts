import type { Treaty } from '@elysia/eden';
import type { UserApp } from '@server/app';

import { defineNuxtPlugin } from '#app';
import { createApiClient } from '#imports';

export default defineNuxtPlugin(() => {
  const api = createApiClient<UserApp>();

  return {
    provide: {
      api,
    },
  };
});

export type UserApi = Treaty.Create<UserApp>;
