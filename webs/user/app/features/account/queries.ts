import type { Treaty } from '@elysia/eden';

import type { UserApi } from '~/plugins/api';

export type CurrentUser = Treaty.Data<UserApi['me']['get']>;

export const USER_SESSION_QUERY_KEYS = {
  root: ['user'] as const,
  session: () => [...USER_SESSION_QUERY_KEYS.root, 'session'] as const,
};

export const userSessionQuery = defineQueryOptions(() => {
  return {
    key: USER_SESSION_QUERY_KEYS.session(),
    staleTime: Infinity,
    query: async () => {
      const { error, data } = await api.me.get({
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
