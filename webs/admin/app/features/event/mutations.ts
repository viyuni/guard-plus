import { defineMutation, useMutation } from '@pinia/colada';

export const useCheckEventService = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: 'Event 服务运行正常',
    },
    async mutation() {
      const { data } = await api.event.check.post();

      if (!data?.healthy) {
        throw new Error('Event 服务检测超时');
      }

      return data;
    },
  });
});
