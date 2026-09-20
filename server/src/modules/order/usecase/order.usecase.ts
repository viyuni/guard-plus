import type {
  CreateOrderBody,
  ExportOrdersBody,
  OrderPageQuery,
  RefundOrderBody,
  UpdateOrderExpressBody,
  UpdateOrderReceiverBody,
} from '@shared/schema/order';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import { PointAccountRepo, PointBalanceUseCase, PointTypeUseCase } from '#modules/point';
import { POINT_CHANGE_SOURCE_TYPE, PointIdempotencyKey } from '#modules/point';
import { assertProductAvailable, STOCK_MOVEMENT_SOURCE_TYPE } from '#modules/product';
import { StockIdempotencyKey, ProductUseCase } from '#modules/product';
import { UserBasicInfoCrypto, UserUseCase } from '#modules/user';
import { publishOrderCreated, type NewOrderEmailInput } from '#queues';

import {
  OrderIdempotencyKey,
  OrderNo,
  OrderNotFoundError,
  initialOrderStatusForDeliveryType,
  orderCompletedAtForDeliveryType,
  assertOrderCanComplete,
  assertOrderCanRefund,
  OrderUpdateFailedError,
} from '../domain';
import { OrderRepo } from '../repository';

function toCsv(
  rows: Array<{
    orderNo: string;
    username: string;
    productName: string;
    createdAt: Date;
    receiverPhone: string;
    receiverAddress: string;
  }>,
) {
  const headers = ['订单号', '用户名', '产品名', '时间', '收货电话', '收货地址'];

  const body = rows.map(row => [
    row.orderNo,
    row.username,
    row.productName,
    row.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    row.receiverPhone,
    row.receiverAddress,
  ]);

  return [headers, ...body].map(row => row.map(v => escapeCsvCell(v)).join(',')).join('\n');
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""');

  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export const OrderUseCase = ripple(
  {
    Database,
    OrderRepo,
    PointAccountRepo,
    PointBalanceUseCase,
    PointTypeUseCase,
    ProductUseCase,
    UserBasicInfoCrypto,
    UserUseCase,
  },
  ({
    Database,
    OrderRepo,
    PointAccountRepo,
    PointBalanceUseCase,
    PointTypeUseCase,
    ProductUseCase,
    UserBasicInfoCrypto,
    UserUseCase,
  }) => {
    function decryptOrderReceiver<
      TOrder extends {
        receiverPhoneEncrypted?: string | null;
        receiverAddressEncrypted?: string | null;
      },
    >(order: TOrder) {
      const receiver = UserBasicInfoCrypto.decryptBasicInfo({
        phoneEncrypted: order.receiverPhoneEncrypted,
        addressEncrypted: order.receiverAddressEncrypted,
      });

      return {
        ...order,
        receiverPhoneEncrypted: receiver.phone,
        receiverAddressEncrypted: receiver.address,
      };
    }

    async function get(orderId: string) {
      const order = await OrderRepo.findById(orderId);

      if (!order) {
        throw new OrderNotFoundError();
      }

      return decryptOrderReceiver(order);
    }

    return {
      get,

      async create(userId: string, orderData: CreateOrderBody) {
        const { order, user, product } = await Database.transaction(async tx => {
          const user = await UserUseCase.getAvailableById(userId, tx);
          const product = await ProductUseCase.requireByIdForUpdate(tx, orderData.productId);

          // 确保账户存在并锁行
          const account = await PointAccountRepo.ensureAccountAndLock(tx, {
            userId: user.id,
            pointTypeId: product.pointTypeId,
          });

          const pointType = await PointTypeUseCase.getAvailableById(product.pointTypeId, tx);

          assertProductAvailable(product);

          const order = await OrderRepo.create(tx, {
            orderNo: OrderNo.create(),
            userId,
            productId: product.id,
            productNameSnapshot: product.name,
            productDeliveryContentSnapshot: product.deliveryContent,
            pointTypeId: product.pointTypeId,
            pointTypeNameSnapshot: pointType.name,
            price: product.price,
            deliveryTypeSnapshot: product.deliveryType,
            status: initialOrderStatusForDeliveryType(product.deliveryType),
            receiverPhoneEncrypted: user.phoneEncrypted,
            receiverAddressEncrypted: user.addressEncrypted,
            idempotencyKey: OrderIdempotencyKey.create({ nonce: orderData.nonce }),
            userRemark: orderData.remark,
            completedAt: orderCompletedAtForDeliveryType(product.deliveryType),
          });

          if (!order) {
            throw new OrderNotFoundError('订单创建失败');
          }

          const point = await PointBalanceUseCase.changeBalance(tx, account, {
            type: 'consume',
            userId,
            pointTypeId: product.pointTypeId,
            delta: -product.price,
            sourceType: POINT_CHANGE_SOURCE_TYPE.OrderConsume,
            sourceId: order.id,
            idempotencyKey: PointIdempotencyKey.orderConsume({ orderId: order.id }),
            remark: `兑换商品：${product.name}`,
            metadata: {
              orderId: order.id,
              orderNo: order.orderNo,
              productId: product.id,
            },
          });

          await ProductUseCase.changeStock(tx, product, {
            type: 'consume',
            productId: product.id,
            delta: -1,
            sourceType: STOCK_MOVEMENT_SOURCE_TYPE.consume,
            sourceId: order.id,
            idempotencyKey: StockIdempotencyKey.orderConsume({ orderId: order.id }),
            remark: `兑换商品：${product.name}`,
            metadata: {
              orderId: order.id,
              orderNo: order.orderNo,
              userId,
            },
          });

          const updateOrder = await OrderRepo.update(
            order.id,
            {
              consumeTransactionId: point.transaction.id,
            },
            tx,
          );

          if (!updateOrder) {
            throw new OrderUpdateFailedError();
          }

          return {
            order: updateOrder,
            user,
            product,
          };
        });

        publishOrderCreated({
          orderNo: order.orderNo,
          username: user.username,
          biliUid: user.biliUid,
          productName: order.productNameSnapshot,
          pointTypeName: order.pointTypeNameSnapshot,
          price: order.price,
          deliveryType: order.deliveryTypeSnapshot,
          status: order.status,
          createdAt: order.createdAt,
          userRemark: order.userRemark,
        } satisfies NewOrderEmailInput);

        return {
          order,
          user,
          product,
        };
      },

      async complete(orderId: string) {
        return Database.transaction(async tx => {
          const order = await OrderRepo.findByIdForUpdate(tx, orderId);

          if (!order) {
            throw new OrderNotFoundError();
          }

          assertOrderCanComplete(order);

          const updateOrder = await OrderRepo.updateWhereStatus(
            orderId,
            ['pending'],
            {
              status: 'completed',
              completedAt: new Date(),
            },
            tx,
          );

          if (!updateOrder) {
            throw new OrderUpdateFailedError();
          }

          return updateOrder;
        });
      },

      async refund(orderId: string, refundData: RefundOrderBody) {
        return Database.transaction(async tx => {
          const order = await OrderRepo.findByIdForUpdate(tx, orderId);

          if (!order) {
            throw new OrderNotFoundError();
          }

          assertOrderCanRefund(order);

          const product = await ProductUseCase.requireByIdForUpdate(tx, order.productId);

          // 确保账户存在并锁行
          const account = await PointAccountRepo.ensureAccountAndLock(tx, {
            userId: order.userId,
            pointTypeId: order.pointTypeId,
          });

          const point = await PointBalanceUseCase.changeBalance(tx, account, {
            type: 'refund',
            userId: order.userId,
            pointTypeId: order.pointTypeId,
            delta: order.price,
            sourceType: POINT_CHANGE_SOURCE_TYPE.OrderRefund,
            sourceId: order.id,
            idempotencyKey: PointIdempotencyKey.orderRefund({ orderId: order.id }),
            remark: `订单退款：${order.productNameSnapshot}`,
            metadata: {
              orderId: order.id,
              orderNo: order.orderNo,
              productId: order.productId,
              refundReason: refundData.reason,
            },
          });

          await ProductUseCase.changeStock(tx, product, {
            type: 'restore',
            productId: order.productId,
            delta: 1,
            sourceType: STOCK_MOVEMENT_SOURCE_TYPE.restore,
            sourceId: order.id,
            idempotencyKey: StockIdempotencyKey.orderRestore({ orderId: order.id }),
            remark: `订单退款恢复库存：${order.productNameSnapshot}`,
            metadata: {
              orderId: order.id,
              orderNo: order.orderNo,
              userId: order.userId,
              refundReason: refundData.reason,
            },
          });

          const updateOrder = await OrderRepo.updateWhereStatus(
            orderId,
            ['pending', 'completed'],
            {
              status: 'refunded',
              refundReason: refundData.reason,
              refundTransactionId: point.transaction.id,
              refundedAt: new Date(),
            },
            tx,
          );

          if (!updateOrder) {
            throw new OrderUpdateFailedError();
          }

          return updateOrder;
        });
      },

      async updateExpress(orderId: string, expressData: UpdateOrderExpressBody) {
        await get(orderId);

        const updateOrder = await OrderRepo.update(orderId, {
          expressCompany: expressData.expressCompany,
          expressNo: expressData.expressNo,
        });

        if (!updateOrder) {
          throw new OrderUpdateFailedError('订单快递信息更新失败');
        }

        return updateOrder;
      },

      async updateReceiver(orderId: string, receiverData: UpdateOrderReceiverBody) {
        await get(orderId);

        const encrypted = UserBasicInfoCrypto.encryptBasicInfoPatch({
          phone: receiverData.phone,
          address: receiverData.address,
        });

        const updateOrder = await OrderRepo.update(orderId, {
          receiverPhoneEncrypted: encrypted.phoneEncrypted,
          receiverAddressEncrypted: encrypted.addressEncrypted,
        });

        if (!updateOrder) {
          throw new OrderUpdateFailedError('订单收货信息更新失败');
        }

        return updateOrder;
      },

      async exportOrders(exportData: ExportOrdersBody) {
        const rows = await OrderRepo.findExportRowsByIds(exportData.ids);

        const orderedRows = exportData.ids
          .map(id => rows.find(row => row.id === id))
          .filter(row => row !== undefined);

        const csvRows = orderedRows.map(row => {
          const receiver = UserBasicInfoCrypto.decryptBasicInfo({
            phoneEncrypted: row.receiverPhoneEncrypted,
            addressEncrypted: row.receiverAddressEncrypted,
          });

          return {
            orderNo: row.orderNo,
            username: row.username ?? '',
            productName: row.productName,
            createdAt: row.createdAt,
            receiverPhone: receiver.phone ?? '',
            receiverAddress: receiver.address ?? '',
          };
        });

        return {
          filename: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
          content: toCsv(csvRows),
        };
      },

      /**
       * 管理员 - 订单列表
       */
      pageManage(query: OrderPageQuery) {
        return OrderRepo.pageManage(query).then(page => ({
          ...page,
          items: page.items.map(order => decryptOrderReceiver(order)),
        }));
      },

      /**
       * 用户订单列表
       */
      pageMine(query: OrderPageQuery) {
        return OrderRepo.pageMine(query).then(page => ({
          ...page,
          items: page.items.map(order => decryptOrderReceiver(order)),
        }));
      },
    };
  },
  { debugName: 'OrderUseCase' },
);

export type OrderUseCase = InferInput<typeof OrderUseCase>;
