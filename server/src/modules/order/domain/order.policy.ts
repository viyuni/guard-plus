import type { Order } from '#db/schema';

import { OrderStatusInvalidError } from './errors';

export class OrderPolicy {
  static initialStatusForDeliveryType(deliveryType: Order['deliveryTypeSnapshot']) {
    return deliveryType === 'automatic' ? 'completed' : 'pending';
  }

  static completedAtForDeliveryType(deliveryType: Order['deliveryTypeSnapshot'], now = new Date()) {
    return deliveryType === 'automatic' ? now : undefined;
  }

  static assertCanComplete(order: Order) {
    if (order.status !== 'pending') {
      throw new OrderStatusInvalidError('只有待完成订单可以完成');
    }
  }

  static assertCanRefund(order: Order) {
    if (order.status !== 'pending' && order.status !== 'completed') {
      throw new OrderStatusInvalidError('只有待完成或已完成订单可以退款');
    }
  }
}
