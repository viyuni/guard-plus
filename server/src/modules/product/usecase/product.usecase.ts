import type { PageQuery } from '@shared/schema';
import type {
  CreateProductBody,
  ProductCoverUploadBody,
  ProductPageQuery,
  UpdateProductBody,
} from '@shared/schema/product';
import type { StockAdjustmentBody } from '@shared/schema/stock';

import type { DbClient, DbTransaction } from '#db';
import type { InsertProduct, Product, UpdateProduct } from '#db/schema';
import { ImageUseCase } from '#modules/image';
import { PointTypeUseCase } from '#modules/point';

import {
  ProductInputPolicy,
  ProductNameExistsError,
  ProductNotFoundError,
  ProductPolicy,
  StockIdempotencyKey,
  StockAmountPolicy,
  StockMovementCreateFailedError,
  StockMovementPolicy,
  StockPolicy,
} from '../domain';
import { ProductRepository, StockMovementRepository } from '../repository';
import { STOCK_MOVEMENT_SOURCE_TYPE, type ChangeStockInput } from './types';

export interface ProductUseCaseDeps {
  db: DbClient;
  pointTypeUseCase: PointTypeUseCase;
  productRepo: ProductRepository;
  stockMovementRepo: StockMovementRepository;
  imageUseCase: ImageUseCase;
}

export class ProductUseCase {
  constructor(private readonly deps: ProductUseCaseDeps) {}

  /**
   * 获取商品信息
   */
  async get(productId: string) {
    const product = await this.deps.productRepo.findById(productId);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  /**
   * 获取可兑换商品信息
   */
  async getRedeem(productId: string) {
    const product = await this.get(productId);

    ProductPolicy.assertAvailable(product);

    return product;
  }

  /**
   * 创建商品
   */
  async create(productData: CreateProductBody) {
    await this.deps.pointTypeUseCase.getAvailableById(productData.pointTypeId);
    ProductInputPolicy.assertPrice(productData.price);
    ProductInputPolicy.assertStock(productData.stock);
    const { startAt, endAt } = productData;
    ProductInputPolicy.assertTimeRange(startAt, endAt);

    const exists = await this.deps.productRepo.findByName(productData.name);

    if (exists) {
      throw new ProductNameExistsError();
    }

    const { endAt: _endAt, startAt: _startAt, ...data } = productData;

    const updateData: InsertProduct = {
      ...data,
      endAt,
      startAt,
    };

    return this.deps.productRepo.create(updateData);
  }

  /**
   * 更新商品
   */
  async update(productId: string, productData: UpdateProductBody) {
    const current = await this.get(productId);

    if (productData.pointTypeId) {
      await this.deps.pointTypeUseCase.getAvailableById(productData.pointTypeId);
    }

    if (productData.name && productData.name !== current.name) {
      const exists = await this.deps.productRepo.findByName(productData.name);

      if (exists) {
        throw new ProductNameExistsError();
      }
    }

    ProductInputPolicy.assertPrice(productData.price);
    ProductInputPolicy.assertStock(productData.stock);
    const { startAt, endAt } = productData;
    ProductInputPolicy.assertTimeRange(startAt, endAt);

    const { endAt: _endAt, startAt: _startAt, ...data } = productData;

    const updateData: UpdateProduct = {
      ...data,
      endAt,
      startAt,
    };

    const product = await this.deps.productRepo.update(productId, updateData);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }

  /**
   * 更新商品封面
   */
  async updateCover(productId: string, body: ProductCoverUploadBody) {
    await this.get(productId);
    const { filename } = await this.deps.imageUseCase.save(body.cover);

    return this.deps.productRepo.update(productId, {
      cover: filename,
    });
  }

  /**
   * 上架商品
   */
  async active(productId: string) {
    const product = await this.get(productId);

    if (!ProductPolicy.shouldActivate(product)) {
      return product;
    }

    return this.deps.productRepo.updateStatus(productId, 'active');
  }

  /**
   * 下架商品
   */
  async disable(productId: string) {
    const product = await this.get(productId);

    if (!ProductPolicy.shouldDisable(product)) {
      return product;
    }

    return this.deps.productRepo.updateStatus(productId, 'disabled');
  }

  async remove(productId: string) {
    const product = await this.deps.productRepo.delete(productId);

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
  async requireByIdForUpdate(tx: DbTransaction, productId: string) {
    const product = await this.deps.productRepo.findByIdForUpdate(tx, productId);

    if (!product) {
      throw new ProductNotFoundError();
    }

    ProductPolicy.assertAvailable(product);

    return product;
  }

  /**
   * 更改库存
   */
  async changeStock(tx: DbTransaction, product: Product, input: ChangeStockInput) {
    StockAmountPolicy.assertNonZeroInteger(input.delta);
    StockMovementPolicy.assertDeltaMatchesType(input.type, input.delta);

    let updateProduct: Product;

    if (input.delta > 0) {
      // 执行增加
      updateProduct = await this.deps.productRepo.increaseStock(tx, {
        productId: product.id,
        amount: input.delta,
      });
    } else {
      // 确保 delta 为正, 扣除时只能为正数
      const amount = Math.abs(input.delta);

      // 确保库存充足
      StockPolicy.assertSufficientStock(product, amount);

      // 执行扣除
      updateProduct = await this.deps.productRepo.decreaseStock(tx, {
        productId: product.id,
        amount,
      });
    }

    // 记录库存变动
    const movement = await this.deps.stockMovementRepo.create(
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

  /**
   * 管理员操作库存
   */
  async adminAdjustStock(productId: string, adminId: string, adjustmentData: StockAdjustmentBody) {
    return this.deps.db.transaction(async tx => {
      const product = await this.requireByIdForUpdate(tx, productId);

      return await this.changeStock(tx, product, {
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
  }

  /**
   * 管理员 - 商品列表
   */
  pageManage(query: ProductPageQuery) {
    return this.deps.productRepo.pageManage(query);
  }

  /**
   * 兑换 - 商品列表
   */
  pageRedeem(query: PageQuery) {
    return this.deps.productRepo.pageRedeem(query);
  }
}
