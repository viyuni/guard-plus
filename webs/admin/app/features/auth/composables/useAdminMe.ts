import { adminMeQuery } from '~/features/auth';

export const useAdminMe = defineQuery(() => {
  const { data, ...rest } = useQuery(adminMeQuery());

  const user = computed(() => data.value?.user);
  const authenticated = computed(() => !!data.value?.authenticated);

  return { ...rest, user, authenticated };
});
