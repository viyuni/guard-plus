import { userSessionQuery } from '~/features/account';

export const useUserSession = defineQuery(() => {
  const query = useQuery(userSessionQuery());
  const user = computed(() => query.data.value?.user);
  const isAuthenticated = computed(() => !!query.data.value?.authenticated);
  const balances = computed(() => user.value?.pointAccounts ?? []);
  const conversionRules = computed(() => user.value?.pointConversionRules ?? []);

  async function refreshUserSession() {
    await query.refetch();
  }

  return {
    ...query,
    user,
    isAuthenticated,
    balances,
    conversionRules,
    refreshUserSession,
  };
});
