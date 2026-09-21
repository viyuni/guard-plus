import {
  CreateProductSchema,
  ProductCoverUploadSchema,
  ProductIdParamsSchema,
  ProductPageQuerySchema,
  UpdateProductSchema,
} from '@shared/schema/product';
import { StockAdjustmentSchema, StockMovementPageQuerySchema } from '@shared/schema/stock';
import { ripple } from 'cyrenejs';
import Elysia from 'elysia';

import Product from '#modules/product';

import { AdminAuthGuard } from '../auth';

export const AdminProductRoutes = ripple(
  {
    AdminAuthGuard,
    ProductUseCase: Product.ProductUseCase,
    StockMovementUseCase: Product.StockMovementUseCase,
  },
  ({ AdminAuthGuard, ProductUseCase, StockMovementUseCase }) =>
    new Elysia({
      name: 'ProductRoute',
      prefix: '/products',
      detail: {
        tags: ['Product'],
      },
    })
      .use(AdminAuthGuard)
      .get(
        '/',
        ({ query }) => {
          return ProductUseCase.pageManage(query);
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
        ({ query }) => {
          return StockMovementUseCase.page(query);
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
        ({ query, params }) => {
          return StockMovementUseCase.page({
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
        ({ params }) => {
          return ProductUseCase.get(params.productId);
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
        ({ body }) => {
          return ProductUseCase.create(body);
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
        ({ body, params }) => {
          return ProductUseCase.update(params.productId, body);
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
        ({ body, params }) => {
          return ProductUseCase.updateCover(params.productId, body);
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
        ({ params }) => {
          return ProductUseCase.active(params.productId);
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
        ({ params }) => {
          return ProductUseCase.disable(params.productId);
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
        ({ params }) => {
          return ProductUseCase.remove(params.productId);
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
        async ({ body, params, auth: { id: adminId } }) => {
          const {
            product: { id, stock },
          } = await ProductUseCase.adminAdjustStock(params.productId, adminId, body);

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
      ),
  { debugName: 'AdminProductRoutes' },
);
