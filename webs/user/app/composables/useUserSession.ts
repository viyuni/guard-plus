import { USER_UNAUTHENTICATED_SESSION, userSessionQuery } from '~/features/account';

export const useUserSession = defineQuery(() => {
  const query = useQuery({
    ...userSessionQuery(),
    placeholderData: previousData => previousData ?? USER_UNAUTHENTICATED_SESSION,
  });

  const user = computed(() => query.data.value?.user);
  const isAuthenticated = computed(() => Boolean(query.data.value?.authenticated));
  const isSessionLoading = computed(() => query.isPlaceholderData.value);
  const balances = computed(() => user.value?.pointAccounts ?? []);
  const conversionRules = computed(() => user.value?.pointConversionRules ?? []);

  async function refreshUserSession() {
    await query.refetch();
  }

  return {
    ...query,
    user,
    isAuthenticated,
    isSessionLoading,
    balances,
    conversionRules,
    refreshUserSession,
  };
});
