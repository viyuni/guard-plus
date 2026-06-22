import { treaty } from '@elysia/eden';
import type { Elysia } from '@server/app';

type AnyElysia = Elysia<any, any, any, any, any, any, any>;

export function createApiClient<const App extends AnyElysia>() {
  const runtimeConfig = useRuntimeConfig();
  const apiBaseUrl = runtimeConfig.public.apiBaseUrl;

  if (!apiBaseUrl) {
    throw new Error('NUXT_PUBLIC_API_BASE_URL is required to create the Eden client.');
  }

  return treaty<App>(apiBaseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}
