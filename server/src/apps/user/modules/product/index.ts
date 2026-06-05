import { pageQuery } from '@shared/schema';
import { ProductIdParamsSchema } from '@shared/schema/product';
import Elysia from 'elysia';

import { appContext } from '#apps/user/context';

export const product = new Elysia({
  name: 'UserProductRoute',
  prefix: '/products',
  detail: {
    tags: ['Product'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, productUseCase }) => {
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
    ({ params, productUseCase }) => {
      return productUseCase.getRedeem(params.productId);
    },
    {
      params: ProductIdParamsSchema,
      detail: {
        description: '可兑换商品详情',
      },
    },
  );
