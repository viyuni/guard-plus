import { adminSessionQuery } from '~/features/auth';

export const useAdminSession = defineQuery(() => {
  const { data, ...rest } = useQuery(adminSessionQuery());

  const user = computed(() => data.value?.user);
  const authenticated = computed(() => !!data.value?.authenticated);

  return { ...rest, user, authenticated };
});
