import { defineMutation, useMutation } from '@pinia/colada';
import type { UpdateUserBody, UserLoginBody, UserRegisterBody } from '@shared/schema/user';
import { toast } from 'vue-sonner';

export const useLogin = defineMutation(() => {
  const { syncAuthenticatedSession } = useUserSessionSync();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '登录成功',
    },
    mutation(body: UserLoginBody) {
      return api.auth.login.post(body);
    },
    onSuccess: syncAuthenticatedSession,
  });
});

export const useRegister = defineMutation(() => {
  const { syncAuthenticatedSession } = useUserSessionSync();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '注册成功',
    },
    mutation(body: UserRegisterBody) {
      return api.auth.register.post(body);
    },
    onSuccess: syncAuthenticatedSession,
  });
});

export const useCreateBiliRegisterCode = defineMutation(() => {
  return useMutation({
    mutation() {
      return api.auth.biliRegisterCode.post();
    },
  });
});

export const useConfirmBiliRegisterCode = defineMutation(() => {
  return useMutation({
    async mutation({ biliUid }: { biliUid: string }) {
      const response = await api.auth.biliRegisterCode.get();
      const { data } = response;

      if (!data) {
        throw new Error('确认 UID 归属失败');
      }

      if (data.status === 'matched') {
        if (data.biliUser.uid === biliUid) {
          toast.success('UID 归属验证成功');
        } else {
          toast.error(`验证码归属于 UID ${data.biliUser.uid}，与输入的 UID 不一致`);
        }
      } else if (data.status === 'pending') {
        toast.error('尚未收到直播间消息，请发送验证码后重试');
      }

      return data;
    },
    onError() {
      toast.error('验证码验证失败，请检查输入的验证码是否正确');
    },
  });
});

export const useUpdateCurrentUser = defineMutation(() => {
  const { refreshSyncedSession } = useUserSessionSync();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '个人信息已更新',
    },
    mutation(body: UpdateUserBody) {
      return api.me.put(body);
    },
    onSuccess: refreshSyncedSession,
  });
});

export const useLogout = defineMutation(() => {
  const { syncUnauthenticatedSession } = useUserSessionSync();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '已退出登录',
    },
    mutation() {
      return api.auth.logout.post();
    },
    onSettled: syncUnauthenticatedSession,
  });
});
