import { pageQuery } from '@shared/schema';
import { ProductIdParamsSchema } from '@shared/schema/product';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import { productUseCase } from '#modules/product';

export const productRoutes = ripple(
  {
    productUseCase,
  },
  ({ productUseCase }) =>
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
          return productUseCase.pageRedeem(query);
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
          return productUseCase.getRedeem(params.productId);
        },
        {
          params: ProductIdParamsSchema,
          detail: {
            description: '可兑换商品详情',
          },
        },
      ),
);
