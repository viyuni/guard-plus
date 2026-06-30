import type { Treaty } from '@elysia/eden';

import type { UserApi } from '~/plugins/api';

export type CurrentUser = Treaty.Data<UserApi['me']['get']>;

export const USER_SESSION_QUERY_KEYS = {
  root: ['user'] as const,
  session: () => [...USER_SESSION_QUERY_KEYS.root, 'session'] as const,
};

export const USER_UNAUTHENTICATED_SESSION = {
  authenticated: false,
  user: null,
} as const;

export const userSessionQuery = defineQueryOptions(() => {
  const { isAuthenticated } = useAuthState();

  return {
    key: USER_SESSION_QUERY_KEYS.session(),
    query: async () => {
      if (!isAuthenticated.value) {
        return USER_UNAUTHENTICATED_SESSION;
      }

      const { error, data } = await api.me.get({
        throwHttpError: error => error.status !== 401,
      });

      if (error) {
        return USER_UNAUTHENTICATED_SESSION;
      }

      return {
        authenticated: true,
        user: data,
      } as const;
    },
  };
});
