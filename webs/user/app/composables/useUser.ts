import type { Treaty } from '@elysia/eden';

import type { UserApi } from '~/plugins/api';

export type CurrentUser = Treaty.Data<UserApi['me']['get']>;

export const useUser = defineQuery(() => {
  const query = useQuery({
    key: ['user'],
    enabled: !import.meta.server,
    query: async () => {
      const { data } = await api.me.get({
        throwHttpError: false,
      });

      return data;
    },
  });
  const user = query.data;
  const isAuthenticated = computed(() => Boolean(user.value));
  const balances = computed(() => user.value?.pointAccounts ?? []);
  const conversionRules = computed(() => user.value?.pointConversionRules ?? []);

  async function refreshUser() {
    await query.refetch();
  }

  function clearUser() {
    user.value = null;
  }

  return {
    ...query,
    user,
    isAuthenticated,
    balances,
    conversionRules,
    refreshUser,
    clearUser,
  };
});
