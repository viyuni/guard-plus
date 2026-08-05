import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type { UpdateUserBody, UserLoginBody, UserRegisterBody } from '@shared/schema/user';

import { USER_SESSION_QUERY_KEYS } from './queries';

function useInvalidateUserSession() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: USER_SESSION_QUERY_KEYS.session() });
}

function syncAuthenticatedSession() {
  const { setAuthState } = useAuthState();

  setAuthState();
}

function reloadPage() {
  window.location.reload();
}

export const useLogin = defineMutation(() => {
  const invalidateUserSession = useInvalidateUserSession();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: UserLoginBody) {
      return api.auth.login.post(body);
    },
    onSuccess() {
      syncAuthenticatedSession();
      invalidateUserSession();
      reloadPage();
    },
  });
});

export const useRegister = defineMutation(() => {
  const invalidateUserSession = useInvalidateUserSession();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '注册成功',
    },
    mutation(body: UserRegisterBody) {
      return api.auth.register.post(body);
    },
    onSuccess() {
      syncAuthenticatedSession();
      invalidateUserSession();
    },
  });
});

export const useCreateBiliRegisterCode = defineMutation(() => {
  return useMutation({
    mutation({ biliUid }: { biliUid: string }) {
      return api.auth.biliRegisterCode.post({ biliUid });
    },
  });
});

export const useConfirmBiliRegisterCode = defineMutation(() => {
  return useMutation({
    async mutation({ biliUid }: { biliUid: string }) {
      const response = await api.auth.biliRegisterCode.get({
        query: { biliUid },
      });
      const { data } = response;

      if (!data) {
        throw new Error('确认 UID 归属失败');
      }

      if (data.status === 'matched') {
        if (data.biliUser.uid !== biliUid) {
          throw new Error('UID 归属验证信息不匹配');
        }
      }

      return data;
    },
  });
});

export const useUpdateCurrentUser = defineMutation(() => {
  const invalidateUserSession = useInvalidateUserSession();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '个人信息已更新',
    },
    mutation(body: UpdateUserBody) {
      return api.me.put(body);
    },
    onSuccess: invalidateUserSession,
  });
});

export const useLogout = defineMutation(() => {
  const invalidateUserSession = useInvalidateUserSession();
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
      invalidateUserSession();
      reloadPage();
    },
  });
});
