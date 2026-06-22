import { USER_UNAUTHENTICATED_SESSION, userSessionQuery } from '~/features/account/queries';

export const useUserSession = defineQuery(() => {
  const query = useQuery({
    ...userSessionQuery(),
    placeholderData: previousData => previousData ?? USER_UNAUTHENTICATED_SESSION,
  });
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
