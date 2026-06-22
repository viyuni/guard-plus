import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type { AdminLoginBody } from '@shared/schema/admin';

import { AUTH_QUERY_KEYS } from './queries';

function useInvalidateAdminSession() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: AUTH_QUERY_KEYS.session() });
}

export const useLogin = defineMutation(() => {
  const invalidateAdminSession = useInvalidateAdminSession();
  const route = useRoute();
  const router = useRouter();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: AdminLoginBody) {
      return api.auth.login.post(body);
    },
    onSuccess({ data }) {
      if (data) {
        const { setAuthenticatedState } = useAuthState();

        setAuthenticatedState();
        invalidateAdminSession();
        const redirect =
          typeof route.query.redirect === 'string' ? route.query.redirect : '/app/users';
        router.push(redirect);
      }
    },
  });
});

export const useLogout = defineMutation(() => {
  const invalidateAdminSession = useInvalidateAdminSession();
  const router = useRouter();
  const { clearAuthState } = useAuthState();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '已退出登录',
    },
    mutation() {
      return api.auth.logout.post();
    },
    onSettled() {
      clearAuthState();
      invalidateAdminSession();
      router.replace('/login');
    },
  });
});
