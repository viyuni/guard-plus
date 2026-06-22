import { useQueryCache } from '@pinia/colada';

import { AUTH_QUERY_KEYS } from '~/features/auth';

function isApiRequest(input: RequestInfo | URL, apiBaseUrl: string) {
  const requestUrl = input instanceof Request ? input.url : input.toString();

  try {
    const url = new URL(requestUrl, window.location.origin);
    const baseUrl = new URL(apiBaseUrl);

    return url.origin === baseUrl.origin && url.pathname.startsWith(baseUrl.pathname);
  } catch {
    return false;
  }
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const apiBaseUrl = runtimeConfig.public.apiBaseUrl;

  if (!apiBaseUrl) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);

    if (response.status !== 401 || !isApiRequest(input, apiBaseUrl)) {
      return response;
    }

    const route = useRoute();

    if (route.path === '/login') {
      return response;
    }

    const { clearAuthState } = useAuthState();
    clearAuthState();

    const queryCache = useQueryCache();
    queryCache.invalidateQueries({ key: AUTH_QUERY_KEYS.session() });

    await navigateTo({
      path: '/login',
      query: {
        redirect: route.fullPath,
      },
    });

    return response;
  };
});
