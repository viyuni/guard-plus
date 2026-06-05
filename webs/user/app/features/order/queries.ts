export function useUserOrdersQuery() {
  const { user } = useUser();

  return useQuery({
    key: () => ['orders', user.value?.id ?? null],
    enabled: () => Boolean(user.value),
    async query() {
      const res = await api.orders.get({ query: { pageSize: 20, page: 1 } });

      return res.data;
    },
  });
}
