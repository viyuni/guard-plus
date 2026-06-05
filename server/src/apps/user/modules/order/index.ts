import { CreateOrderSchema, OrderPageQuerySchema } from '@shared/schema/order';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const order = new Elysia({
  name: 'UserOrderRoute',
  prefix: '/orders',
  detail: {
    tags: ['Order'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, auth: { id: userId }, orderUseCase }) => {
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
    async ({ body, auth: { id: userId }, orderUseCase }) => {
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
  );
