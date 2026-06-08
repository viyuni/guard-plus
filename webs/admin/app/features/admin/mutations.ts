import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type {
  AdminCreateBody,
  AdminUpdateBody,
  AdminUpdatePasswordBody,
  SuperAdminUpdateBody,
} from '@shared/schema/admin';

import { useAuthStore } from '../auth/store';
import { ADMIN_QUERY_KEYS } from './queries';

function useInvalidateAdmins() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: ADMIN_QUERY_KEYS.root });
}

export const useCreateAdmin = defineMutation(() => {
  const invalidateAdmins = useInvalidateAdmins();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '管理员已创建',
    },
    mutation(body: AdminCreateBody) {
      return api.admin.post(body);
    },
    onSettled: invalidateAdmins,
  });
});

export const useUpdateAdmin = defineMutation(() => {
  const invalidateAdmins = useInvalidateAdmins();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '管理员已更新',
    },
    mutation(input: { adminId: string; body: SuperAdminUpdateBody }) {
      return api.admin({ adminId: input.adminId }).patch(input.body);
    },
    onSettled: invalidateAdmins,
  });
});

export const useUpdateCurrentAdmin = defineMutation(() => {
  const authStore = useAuthStore();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '账户信息已更新',
    },
    mutation(body: AdminUpdateBody) {
      return api.admin.me.patch(body);
    },
    onSuccess({ data }) {
      if (data && authStore.user) {
        authStore.updateUser({
          ...authStore.user,
          ...data,
        });
      }
    },
  });
});

export const useUpdateCurrentAdminPassword = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: '账户密码已修改',
    },
    mutation(body: AdminUpdatePasswordBody) {
      return api.admin.updatePassword.patch(body);
    },
  });
});

export const useBanAdmin = defineMutation(() => {
  const invalidateAdmins = useInvalidateAdmins();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '管理员已封禁',
    },
    mutation(adminId: string) {
      return api.admin({ adminId }).ban.patch();
    },
    onSettled: invalidateAdmins,
  });
});

export const useRestoreAdmin = defineMutation(() => {
  const invalidateAdmins = useInvalidateAdmins();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '管理员已恢复',
    },
    mutation(adminId: string) {
      return api.admin({ adminId }).restore.patch();
    },
    onSettled: invalidateAdmins,
  });
});

export const useResetAdminPassword = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: '管理员密码已重置',
    },
    mutation(adminId: string) {
      return api.admin({ adminId }).resetPassword.patch();
    },
  });
});
