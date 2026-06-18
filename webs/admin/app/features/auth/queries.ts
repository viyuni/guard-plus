export const AUTH_QUERY_KEYS = {
  root: ['auth'] as const,
  session: () => [...AUTH_QUERY_KEYS.root, 'session'] as const,
};

export const adminSessionQuery = defineQueryOptions(() => {
  return {
    key: AUTH_QUERY_KEYS.session(),
    staleTime: Infinity,
    query: async () => {
      const { error, data } = await api.admin.me.get({
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
