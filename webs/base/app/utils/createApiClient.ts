import { treaty } from '@elysia/eden';
import type { Elysia } from '@server/app';

type AnyElysia = Elysia<any, any, any, any, any, any, any>;

function resolveApiBaseUrl(options: { publicApiBaseUrl?: string; serverApiBaseUrl?: string }) {
  if (import.meta.server) {
    return options.serverApiBaseUrl || options.publicApiBaseUrl;
  }

  return options.publicApiBaseUrl;
}

export function createApiClient<const App extends AnyElysia>() {
  const runtimeConfig = useRuntimeConfig();
  const publicApiBaseUrl = runtimeConfig.public.apiBaseUrl;
  const serverApiBaseUrl = runtimeConfig.apiBaseUrl as string | undefined;
  const apiBaseUrl = resolveApiBaseUrl({
    publicApiBaseUrl,
    serverApiBaseUrl,
  });

  if (!apiBaseUrl) {
    throw new Error(
      'NUXT_PUBLIC_API_BASE_URL or NUXT_API_BASE_URL is required to create the Eden client.',
    );
  }

  return treaty<App>(apiBaseUrl, {
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    throwHttpError: true,
    fetch: {
      credentials: 'include',
    },
  });
}
