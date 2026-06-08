import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type { AdjustBalanceBody } from '@shared/schema/point-account';
import type { UpdateUserBody, UserRegisterBody } from '@shared/schema/user';

import { USER_QUERY_KEYS } from './queries';

function useInvalidateUsers() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: USER_QUERY_KEYS.root });
}

export const useCreateUser = defineMutation(() => {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户创建成功',
    },
    mutation(body: UserRegisterBody) {
      return api.users.post(body);
    },
    onSettled: invalidateUsers,
  });
});

export const useBanUser = defineMutation(() => {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户已封禁',
    },
    mutation(userId: string) {
      return api.users({ userId }).ban.patch();
    },
    onSettled: invalidateUsers,
  });
});

export const useUpdateUser = defineMutation(() => {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户信息已更新',
    },
    mutation(input: { userId: string; body: UpdateUserBody }) {
      return api.users({ userId: input.userId }).patch(input.body);
    },
    onSettled: invalidateUsers,
  });
});

export const useRestoreUser = defineMutation(() => {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '用户已恢复',
    },
    mutation(userId: string) {
      return api.users({ userId }).restore.patch();
    },
    onSettled: invalidateUsers,
  });
});

export const useResetUserPassword = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: '密码已重置',
    },
    mutation(userId: string) {
      return api.users({ userId }).resetPassword.patch();
    },
  });
});

export const useAdjustUserPoints = defineMutation(() => {
  const invalidateUsers = useInvalidateUsers();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '积分调整成功',
    },
    mutation(body: AdjustBalanceBody) {
      return api.points.accounts.balance.adjust.patch(body);
    },
    onSettled: invalidateUsers,
  });
});
