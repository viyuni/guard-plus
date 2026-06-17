export const AUTH_QUERY_KEYS = {
  root: ['auth'] as const,
  me: () => [...AUTH_QUERY_KEYS.root, 'me'] as const,
};

export const adminMeQuery = defineQueryOptions(() => {
  return {
    key: AUTH_QUERY_KEYS.me(),
    query: async () => {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined;

      if (import.meta.server && !headers?.cookie) {
        return {
          authenticated: false,
          user: null,
        } as const;
      }

      const { error, data } = await api.admin.me.get({
        headers,
        throwHttpError: error => error.status !== 401,
      });

      if (error) {
        return {
          authenticated: false,
          user: null,
        } as const;
      }

      return {
        authenticated: true,
        user: data,
      } as const;
    },
  };
});
