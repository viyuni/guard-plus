import type { Order } from '#infrastructure/db/schema';

import { OrderStatusInvalidError } from './errors';

export function initialOrderStatusForDeliveryType(deliveryType: Order['deliveryTypeSnapshot']) {
  return deliveryType === 'automatic' ? 'completed' : 'pending';
}

export function orderCompletedAtForDeliveryType(
  deliveryType: Order['deliveryTypeSnapshot'],
  now = new Date(),
) {
  return deliveryType === 'automatic' ? now : undefined;
}

export function assertOrderCanComplete(order: Order) {
  if (order.status !== 'pending') {
    throw new OrderStatusInvalidError('只有待完成订单可以完成');
  }
}

export function assertOrderCanRefund(order: Order) {
  if (order.status !== 'pending' && order.status !== 'completed') {
    throw new OrderStatusInvalidError('只有待完成或已完成订单可以退款');
  }
}
