export function useUserPointTransactionsQuery() {
  const { user } = useUser();

  return useQuery({
    key: () => ['pointTransactions', user.value?.id ?? null],
    enabled: () => Boolean(user.value),
    async query() {
      const res = await api.pointTransactions.get({ query: { pageSize: 20, page: 1 } });

      return res.data;
    },
  });
}
