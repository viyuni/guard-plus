import {
  ExportOrdersSchema,
  OrderIdParamsSchema,
  OrderPageQuerySchema,
  RefundOrderSchema,
  UpdateOrderExpressSchema,
  UpdateOrderReceiverSchema,
} from '@shared/schema/order';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Order from '#modules/order';

import { AdminAuthGuard } from '../auth';

export const AdminOrderRoutes = ripple(
  {
    AdminAuthGuard,
    OrderUseCase: Order.OrderUseCase,
  },
  ({ AdminAuthGuard, OrderUseCase }) =>
    new Elysia({
      name: 'OrderRoute',
      prefix: '/orders',
      detail: {
        tags: ['Order'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        ({ query }) => {
          return OrderUseCase.pageManage(query);
        },
        {
          query: OrderPageQuerySchema,
          requiredAdminAuth: true,
          detail: {
            description: '订单列表',
          },
        },
      )
      .post(
        '/export',
        async ({ body }) => {
          return OrderUseCase.exportOrders(body);
        },
        {
          body: ExportOrdersSchema,
          requiredAdminAuth: true,
          detail: {
            description: '导出订单',
          },
        },
      )
      .get(
        '/:orderId',
        ({ params }) => {
          return OrderUseCase.get(params.orderId);
        },
        {
          params: OrderIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '订单详情',
          },
        },
      )
      .patch(
        '/:orderId/complete',
        async ({ params }) => {
          const { id, status } = await OrderUseCase.complete(params.orderId);

          return {
            id,
            status,
          };
        },
        {
          params: OrderIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '完成订单',
          },
        },
      )
      .patch(
        '/:orderId/express',
        async ({ body, params }) => {
          const { expressCompany, expressNo, id } = await OrderUseCase.updateExpress(
            params.orderId,
            body,
          );

          return {
            id,
            expressCompany,
            expressNo,
          };
        },
        {
          body: UpdateOrderExpressSchema,
          params: OrderIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '修改订单快递信息',
          },
        },
      )
      .patch(
        '/:orderId/receiver',
        async ({ body, params }) => {
          const { id, receiverAddressEncrypted, receiverPhoneEncrypted } =
            await OrderUseCase.updateReceiver(params.orderId, body);

          return {
            id,
            receiverPhoneEncrypted,
            receiverAddressEncrypted,
          };
        },
        {
          body: UpdateOrderReceiverSchema,
          params: OrderIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '修改订单收货信息',
          },
        },
      )
      .patch(
        '/:orderId/refund',
        async ({ body, params }) => {
          const { id, status } = await OrderUseCase.refund(params.orderId, body);

          return {
            id,
            status,
          };
        },
        {
          body: RefundOrderSchema,
          params: OrderIdParamsSchema,
          requiredAdminAuth: true,
          detail: {
            description: '退款订单',
          },
        },
      ),
  { debugName: 'AdminOrderRoutes' },
);
