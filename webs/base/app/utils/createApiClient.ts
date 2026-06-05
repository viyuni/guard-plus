import { treaty } from '@elysia/eden';
import type { Elysia } from '@server/app';

type AnyElysia = Elysia<any, any, any, any, any, any, any>;

export function createApiClient<const App extends AnyElysia>(options: { baseUrl: string }) {
  const { baseUrl } = options;

  return treaty<App>(baseUrl, {
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}
