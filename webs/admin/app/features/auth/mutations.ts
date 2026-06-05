import { defineMutation, useMutation } from '@pinia/colada';
import type { AdminLoginBody } from '@shared/schema/admin';

import { useAuthStore } from './store';

export const useLogin = defineMutation(() => {
  const { updateSession } = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: AdminLoginBody) {
      return $api.auth.login.post(body);
    },
    onSuccess({ data }) {
      if (data) {
        updateSession(data);
        const redirect =
          typeof route.query.redirect === 'string' ? route.query.redirect : '/app/users';
        router.push(redirect);
      }
    },
  });
});

export const useLogout = defineMutation(() => {
  const { clearSession } = useAuthStore();
  const router = useRouter();
  const { $api } = useNuxtApp();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '已退出登录',
    },
    mutation() {
      return $api.auth.logout.post();
    },
    onSettled() {
      clearSession();
      router.push('/login');
    },
  });
});
