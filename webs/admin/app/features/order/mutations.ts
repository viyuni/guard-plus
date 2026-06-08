import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type {
  ExportOrdersBody,
  RefundOrderBody,
  UpdateOrderExpressBody,
  UpdateOrderReceiverBody,
} from '@shared/schema/order';

import { ORDER_QUERY_KEYS } from './queries';

function useInvalidateOrders() {
  const queryCache = useQueryCache();

  return () => queryCache.invalidateQueries({ key: ORDER_QUERY_KEYS.root });
}

export const useCompleteOrder = defineMutation(() => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '订单已完成',
    },
    mutation(orderId: string) {
      return api.orders({ orderId }).complete.patch();
    },
    onSettled: invalidateOrders,
  });
});

export const useRefundOrder = defineMutation(() => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '订单已退款',
    },
    mutation(input: { orderId: string; body: RefundOrderBody }) {
      return api.orders({ orderId: input.orderId }).refund.patch(input.body);
    },
    onSettled: invalidateOrders,
  });
});

export const useUpdateOrderExpress = defineMutation(() => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '快递信息已更新',
    },
    mutation(input: { orderId: string; body: UpdateOrderExpressBody }) {
      return api.orders({ orderId: input.orderId }).express.patch(input.body);
    },
    onSettled: invalidateOrders,
  });
});

export const useUpdateOrderReceiver = defineMutation(() => {
  const invalidateOrders = useInvalidateOrders();

  return useMutation({
    meta: {
      showToast: true,
      successMessage: '收货信息已更新',
    },
    mutation(input: { orderId: string; body: UpdateOrderReceiverBody }) {
      return api.orders({ orderId: input.orderId }).receiver.patch(input.body);
    },
    onSettled: invalidateOrders,
  });
});

export const useExportOrders = defineMutation(() => {
  return useMutation({
    meta: {
      showToast: true,
      successMessage: '订单已导出',
    },
    mutation(body: ExportOrdersBody) {
      return api.orders.export.post(body);
    },
  });
});
