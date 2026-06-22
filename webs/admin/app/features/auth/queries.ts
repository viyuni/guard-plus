export const AUTH_QUERY_KEYS = {
  root: ['auth'] as const,
  session: () => [...AUTH_QUERY_KEYS.root, 'session'] as const,
};

export const ADMIN_UNAUTHENTICATED_SESSION = {
  authenticated: false,
  user: null,
} as const;

export const adminSessionQuery = defineQueryOptions(() => {
  const { isAuthenticated } = useAuthState();

  return {
    key: AUTH_QUERY_KEYS.session(),
    staleTime: Infinity,
    query: async () => {
      if (!isAuthenticated.value) {
        return ADMIN_UNAUTHENTICATED_SESSION;
      }

      const { error, data } = await api.admin.me.get({
        throwHttpError: error => error.status !== 401,
      });

      if (error) {
        return ADMIN_UNAUTHENTICATED_SESSION;
      }

      return {
        authenticated: true,
        user: data,
      } as const;
    },
  };
});
