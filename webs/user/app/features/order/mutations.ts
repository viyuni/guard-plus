import { defineMutation, useMutation } from '@pinia/colada';
import type { CreateOrderBody } from '@shared/schema/order';

export const useCreateOrder = defineMutation(() => {
  const { refreshSyncedSession } = useUserSessionSync();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '购买成功',
    },
    mutation(body: CreateOrderBody) {
      return api.orders.post(body);
    },
    onSuccess: refreshSyncedSession,
  });
});
