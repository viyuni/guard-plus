import { pageQuery } from '@shared/schema';
import { ProductIdParamsSchema } from '@shared/schema/product';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { ProductUseCase } from '#modules/product';

export const ProductRoutes = ripple(
  {
    ProductUseCase,
  },
  ({ ProductUseCase }) =>
    new Elysia({
      name: 'UserProductRoute',
      prefix: '/products',
      detail: {
        tags: ['Product'],
      },
    })
      .get(
        '/',
        ({ query }) => {
          return ProductUseCase.pageRedeem(query);
        },
        {
          query: pageQuery,
          detail: {
            description: '可兑换商品列表',
          },
        },
      )
      .get(
        '/:productId',
        ({ params }) => {
          return ProductUseCase.getRedeem(params.productId);
        },
        {
          params: ProductIdParamsSchema,
          detail: {
            description: '可兑换商品详情',
          },
        },
      ),
);
