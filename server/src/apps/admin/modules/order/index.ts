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

import { adminAuthGuard } from '#apps/admin/http';
import { orderUseCase } from '#modules/order';

export const adminOrderRoutes = ripple(
  {
    authGuard: adminAuthGuard,
    orderUseCase,
  },
  ({ authGuard, orderUseCase }) =>
    new Elysia({
      name: 'OrderRoute',
      prefix: '/orders',
      detail: {
        tags: ['Order'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        ({ query }) => {
          return orderUseCase.pageManage(query);
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
          return orderUseCase.exportOrders(body);
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
          return orderUseCase.get(params.orderId);
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
          const { id, status } = await orderUseCase.complete(params.orderId);

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
          const { expressCompany, expressNo, id } = await orderUseCase.updateExpress(
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
            await orderUseCase.updateReceiver(params.orderId, body);

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
          const { id, status } = await orderUseCase.refund(params.orderId, body);

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
);
