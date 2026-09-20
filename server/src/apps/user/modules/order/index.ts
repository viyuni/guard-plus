import { CreateOrderSchema, OrderPageQuerySchema } from '@shared/schema/order';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { UserAuthGuard } from '#apps/user/http';
import { OrderUseCase } from '#modules/order';

export const OrderRoutes = ripple(
  {
    UserAuthGuard,
    OrderUseCase,
  },
  ({ UserAuthGuard, OrderUseCase }) =>
    new Elysia({
      name: 'UserOrderRoute',
      prefix: '/orders',
      detail: {
        tags: ['Order'],
      },
    })
      .use(UserAuthGuard)
      .get(
        '/',
        ({ query, auth: { id: userId } }) => {
          return OrderUseCase.pageMine({
            ...query,
            userId,
          });
        },
        {
          query: OrderPageQuerySchema,
          requiredAuth: true,
          detail: {
            description: '我的订单列表',
          },
        },
      )
      .post(
        '/',
        async ({ body, auth: { id: userId } }) => {
          const {
            order: { orderNo, productDeliveryContentSnapshot },
          } = await OrderUseCase.create(userId, body);

          return {
            orderNo,
            detail: productDeliveryContentSnapshot,
          };
        },
        {
          body: CreateOrderSchema,
          requiredAuth: true,
          detail: {
            description: '兑换商品',
          },
        },
      ),
);
