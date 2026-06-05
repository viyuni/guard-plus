import {
  CreateProductSchema,
  ProductCoverUploadSchema,
  ProductIdParamsSchema,
  ProductPageQuerySchema,
  UpdateProductSchema,
} from '@shared/schema/product';
import { StockAdjustmentSchema, StockMovementPageQuerySchema } from '@shared/schema/stock';
import Elysia from 'elysia';

import { appContext } from '../../context';

export const product = new Elysia({
  name: 'ProductRoute',
  prefix: '/products',
  detail: {
    tags: ['Product'],
  },
})
  .use(appContext)
  .get(
    '/',
    ({ query, productUseCase }) => {
      return productUseCase.pageManage(query);
    },
    {
      query: ProductPageQuerySchema,
      requiredAdminAuth: true,
      detail: {
        description: '商品列表',
      },
    },
  )
  .get(
    '/stock/movements',
    ({ query, stockMovementUseCase }) => {
      return stockMovementUseCase.page(query);
    },
    {
      query: StockMovementPageQuerySchema,
      requiredAdminAuth: true,
      detail: {
        description: '商品库存流水',
      },
    },
  )
  .get(
    '/:productId/stock/movements',
    ({ query, params, stockMovementUseCase }) => {
      return stockMovementUseCase.page({
        ...query,
        productId: params.productId,
      });
    },
    {
      query: StockMovementPageQuerySchema,
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '商品库存流水',
      },
    },
  )
  .get(
    '/:productId',
    ({ params, productUseCase }) => {
      return productUseCase.get(params.productId);
    },
    {
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '商品详情',
      },
    },
  )
  .post(
    '/',
    ({ body, productUseCase }) => {
      return productUseCase.create(body);
    },
    {
      body: CreateProductSchema,
      requiredAdminAuth: true,
      detail: {
        description: '创建商品',
        requestBody: {
          content: {
            'multipart/form-data': {},
          },
        },
      },
    },
  )
  .put(
    '/:productId',
    ({ body, params, productUseCase }) => {
      return productUseCase.update(params.productId, body);
    },
    {
      body: UpdateProductSchema,
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '更新商品',
      },
    },
  )
  .put(
    '/:productId/cover',
    ({ body, params, productUseCase }) => {
      return productUseCase.updateCover(params.productId, body);
    },
    {
      body: ProductCoverUploadSchema,
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '更新商品封面',
        requestBody: {
          content: {
            'multipart/form-data': {},
          },
        },
      },
    },
  )
  .patch(
    '/:productId/enable',
    ({ params, productUseCase }) => {
      return productUseCase.active(params.productId);
    },
    {
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '上架商品',
      },
    },
  )
  .patch(
    '/:productId/disable',
    ({ params, productUseCase }) => {
      return productUseCase.disable(params.productId);
    },
    {
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '下架商品',
      },
    },
  )
  .delete(
    '/:productId',
    ({ params, productUseCase }) => {
      return productUseCase.remove(params.productId);
    },
    {
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '删除商品',
      },
    },
  )
  .patch(
    '/:productId/stock/adjust',
    async ({ body, params, productUseCase, auth: { id: adminId } }) => {
      const {
        product: { id, stock },
      } = await productUseCase.adminAdjustStock(params.productId, adminId, body);

      return {
        id,
        stock,
      };
    },
    {
      body: StockAdjustmentSchema,
      params: ProductIdParamsSchema,
      requiredAdminAuth: true,
      detail: {
        description: '调整商品库存',
      },
    },
  );
