import { CreateOrderSchema, OrderPageQuerySchema } from '@shared/schema/order';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { userAuthGuard } from '#apps/user/http';
import { orderUseCase } from '#modules/order';

export const orderRoutes = ripple(
  {
    authGuard: userAuthGuard,
    orderUseCase,
  },
  ({ authGuard, orderUseCase }) =>
    new Elysia({
      name: 'UserOrderRoute',
      prefix: '/orders',
      detail: {
        tags: ['Order'],
      },
    })
      .use(authGuard)
      .get(
        '/',
        ({ query, auth: { id: userId } }) => {
          return orderUseCase.pageMine({
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
          } = await orderUseCase.create(userId, body);

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
