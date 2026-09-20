import type { PageQuery } from '@shared/schema';
import type {
  CreateProductBody,
  ProductCoverUploadBody,
  ProductPageQuery,
  UpdateProductBody,
} from '@shared/schema/product';
import type { StockAdjustmentBody } from '@shared/schema/stock';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import type { DbTransaction } from '#db';
import type { InsertProduct, Product, UpdateProduct } from '#db/schema';
import { imageUseCase } from '#modules/image';
import { pointTypeUseCase } from '#modules/point';

import {
  ProductCodeExistsError,
  assertProductPrice,
  assertProductStock,
  assertProductTimeRange,
  ProductNotFoundError,
  assertProductAvailable,
  shouldActivateProduct,
  shouldDisableProduct,
  assertNonZeroStockAmount,
  StockIdempotencyKey,
  StockMovementCreateFailedError,
  assertStockMovementDeltaMatchesType,
  assertSufficientStock,
} from '../domain';
import { productRepo, stockMovementRepo } from '../repository';
import { STOCK_MOVEMENT_SOURCE_TYPE, type ChangeStockInput } from './types';

export const productUseCase = ripple(
  {
    db: Database,
    imageUseCase,
    pointTypeUseCase,
    productRepo,
    stockMovementRepo,
  },
  ({ db, imageUseCase, pointTypeUseCase, productRepo, stockMovementRepo }) => {
    /**
     * 获取商品信息
     */
    async function get(productId: string) {
      const product = await productRepo.findById(productId);

      if (!product) {
        throw new ProductNotFoundError();
      }

      return product;
    }

    /**
     * 查询可兑换商品并加行锁
     *
     * 用于兑换、扣减库存等需要并发保护的场景。
     * 如果商品不存在或商品状态不可用，则抛出业务异常。
     */
    async function requireByIdForUpdate(tx: DbTransaction, productId: string) {
      const product = await productRepo.findByIdForUpdate(tx, productId);

      if (!product) {
        throw new ProductNotFoundError();
      }

      assertProductAvailable(product);

      return product;
    }

    /**
     * 更改库存
     */
    async function changeStock(tx: DbTransaction, product: Product, input: ChangeStockInput) {
      assertNonZeroStockAmount(input.delta);
      assertStockMovementDeltaMatchesType(input.type, input.delta);

      let updateProduct: Product;

      if (input.delta > 0) {
        // 执行增加
        updateProduct = await productRepo.increaseStock(tx, {
          productId: product.id,
          amount: input.delta,
        });
      } else {
        // 确保 delta 为正, 扣除时只能为正数
        const amount = Math.abs(input.delta);

        // 确保库存充足
        assertSufficientStock(product, amount);

        // 执行扣除
        updateProduct = await productRepo.decreaseStock(tx, {
          productId: product.id,
          amount,
        });
      }

      // 记录库存变动
      const movement = await stockMovementRepo.create(
        {
          productId: input.productId,
          type: input.type,
          delta: input.delta,
          stockBefore: product.stock,
          stockAfter: updateProduct.stock,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          idempotencyKey: input.idempotencyKey,
          remark: input.remark,
          metadata: input.metadata,
        },
        tx,
      );

      if (!movement) {
        throw new StockMovementCreateFailedError();
      }

      return {
        movement,
        product: updateProduct,
      };
    }

    return {
      get,

      /**
       * 获取可兑换商品信息
       */
      async getRedeem(productId: string) {
        const product = await get(productId);

        assertProductAvailable(product);

        return product;
      },

      /**
       * 创建商品
       */
      async create(productData: CreateProductBody) {
        await pointTypeUseCase.getAvailableById(productData.pointTypeId);
        assertProductPrice(productData.price);
        assertProductStock(productData.stock);
        const { startAt, endAt } = productData;
        assertProductTimeRange(startAt, endAt);

        if (productData.code && (await productRepo.findByCode(productData.code))) {
          throw new ProductCodeExistsError();
        }

        const { endAt: _endAt, startAt: _startAt, ...data } = productData;

        const updateData: InsertProduct = {
          ...data,
          endAt,
          startAt,
        };

        return productRepo.create(updateData);
      },

      /**
       * 更新商品
       */
      async update(productId: string, productData: UpdateProductBody) {
        const current = await get(productId);

        if (productData.pointTypeId) {
          await pointTypeUseCase.getAvailableById(productData.pointTypeId);
        }

        if (
          productData.code &&
          productData.code !== current.code &&
          (await productRepo.findByCode(productData.code))
        ) {
          throw new ProductCodeExistsError();
        }

        assertProductPrice(productData.price);
        const { startAt, endAt } = productData;
        assertProductTimeRange(startAt, endAt);

        const { endAt: _endAt, startAt: _startAt, ...data } = productData;

        const updateData: UpdateProduct = {
          ...data,
          endAt,
          startAt,
        };

        const product = await productRepo.update(productId, updateData);

        if (!product) {
          throw new ProductNotFoundError();
        }

        return product;
      },

      /**
       * 更新商品封面
       */
      async updateCover(productId: string, body: ProductCoverUploadBody) {
        await get(productId);
        const { filename } = await imageUseCase.save(body.cover);

        return productRepo.update(productId, {
          cover: filename,
        });
      },

      /**
       * 上架商品
       */
      async active(productId: string) {
        const product = await get(productId);

        if (!shouldActivateProduct(product)) {
          return product;
        }

        return productRepo.updateStatus(productId, 'active');
      },

      /**
       * 下架商品
       */
      async disable(productId: string) {
        const product = await get(productId);

        if (!shouldDisableProduct(product)) {
          return product;
        }

        return productRepo.updateStatus(productId, 'disabled');
      },

      async remove(productId: string) {
        const product = await productRepo.delete(productId);

        if (!product) {
          throw new ProductNotFoundError();
        }

        return product;
      },

      requireByIdForUpdate,

      changeStock,

      /**
       * 管理员操作库存
       */
      async adminAdjustStock(
        productId: string,
        adminId: string,
        adjustmentData: StockAdjustmentBody,
      ) {
        return db.transaction(async tx => {
          const product = await requireByIdForUpdate(tx, productId);

          return await changeStock(tx, product, {
            type: 'adjust',
            productId,
            delta: adjustmentData.delta,
            sourceType: STOCK_MOVEMENT_SOURCE_TYPE.adjust,
            sourceId: adminId,
            idempotencyKey: StockIdempotencyKey.adminAdjust({
              productId,
              adminId,
              nonce: adjustmentData.nonce,
            }),
            remark: adjustmentData.remark ?? `管理员调整库存：${product.name}`,
            metadata: {
              adminId,
              productId,
              productName: product.name,
              delta: adjustmentData.delta,
              nonce: adjustmentData.nonce,
            },
          });
        });
      },

      /**
       * 管理员 - 商品列表
       */
      pageManage(query: ProductPageQuery) {
        return productRepo.pageManage(query);
      },

      /**
       * 兑换 - 商品列表
       */
      pageRedeem(query: PageQuery) {
        return productRepo.pageRedeem(query);
      },
    };
  },
  { debugName: 'ProductUseCase' },
);

export type ProductUseCase = InferInput<typeof productUseCase>;
