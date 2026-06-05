import type { PageQuery } from '@shared/schema/common';
import type { ProductPageQuery } from '@shared/schema/product';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

import type { DbExecutor, DbTransaction } from '#db';
import { deletedAtIsNull, QueryPageBuilder } from '#db/helper';
import { products, type InsertProduct, type ProductStatus, type UpdateProduct } from '#db/schema';

import { StockAmountPolicy, StockInsufficientError, StockUpdateFailedError } from '../domain';

const POSTGRES_INTEGER_MAX = 2_147_483_647;

export class ProductRepository {
  constructor(private readonly db: DbExecutor) {}

  /**
   * 获取指定 ID 的商品
   */
  async findById(productId: string, db: DbExecutor = this.db) {
    return await db.query.products.findFirst({
      where: {
        id: productId,
        deletedAt: {
          isNull: true,
        },
      },
    });
  }

  async findByName(name: string, db: DbExecutor = this.db) {
    return (
      (await db.query.products.findFirst({
        where: {
          name,
          deletedAt: {
            isNull: true,
          },
        },
      })) ?? null
    );
  }

  /**
   * 创建商品
   */
  async create(input: InsertProduct, db: DbExecutor = this.db) {
    const [row] = await db.insert(products).values(input).returning();

    return row ?? null;
  }

  /**
   * 更新商品
   */
  async update(productId: string, data: UpdateProduct, db: DbExecutor = this.db) {
    const [row] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, productId), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 更新商品状态
   */
  async updateStatus(productId: string, status: ProductStatus, db: DbExecutor = this.db) {
    return this.update(productId, { status }, db);
  }

  async delete(productId: string, db: DbExecutor = this.db) {
    const [row] = await db
      .update(products)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(products.id, productId), deletedAtIsNull(products)))
      .returning();

    return row ?? null;
  }

  /**
   * 行锁商品并返回查询结果
   */
  async findByIdForUpdate(tx: DbTransaction, productId: string) {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.id, productId), deletedAtIsNull(products)))
      .for('update');

    return product;
  }

  /**
   * 增加商品库存
   */
  async increaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
    StockAmountPolicy.assertPositiveInteger(input.amount);

    const [product] = await tx
      .update(products)
      .set({
        stock: sql`${products.stock} + ${input.amount}`,
      })
      .where(
        and(
          eq(products.id, input.productId),
          lte(products.stock, POSTGRES_INTEGER_MAX - input.amount),
          deletedAtIsNull(products),
        ),
      )
      .returning();

    if (!product) {
      const currentProduct = await this.findByIdForUpdate(tx, input.productId);

      if (currentProduct) {
        StockAmountPolicy.assertCanAdd(currentProduct.stock, input.amount);
      }

      throw new StockUpdateFailedError();
    }

    return product;
  }

  /**
   * 减少商品库存
   */
  async decreaseStock(tx: DbTransaction, input: { productId: string; amount: number }) {
    StockAmountPolicy.assertPositiveInteger(input.amount);

    const [product] = await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${input.amount}`,
      })
      .where(
        and(
          deletedAtIsNull(products),
          eq(products.id, input.productId),
          gte(products.stock, input.amount),
        ),
      )
      .returning();

    if (!product) {
      throw new StockInsufficientError();
    }

    return product;
  }

  /**
   * 管理端分页
   */
  async pageManage(query: ProductPageQuery) {
    return new QueryPageBuilder(this.db, products, this.db.query.products)
      .where({
        deletedAt: {
          isNull: true,
        },
        status: query.status,
        deliveryType: query.deliveryType,
        pointTypeId: query.pointTypeId,
        OR: query.keyword
          ? [
              {
                name: {
                  ilike: `%${query.keyword}%`,
                },
              },
              {
                description: {
                  ilike: `%${query.keyword}%`,
                },
              },
            ]
          : [],
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: t => [sql`${t.sort} DESC NULLS FIRST`, sql`${t.createdAt} DESC`],
        }),
      )
      .page(query.page)
      .pageSize(query.pageSize)
      .paginate();
  }

  /**
   * 兑换商城分页
   */
  async pageRedeem(query: PageQuery) {
    const now = new Date();

    return new QueryPageBuilder(this.db, products, this.db.query.products)
      .where({
        deletedAt: {
          isNull: true,
        },
        OR: [
          {
            status: 'reviewing',
          },
          {
            status: 'active',
            AND: [
              {
                OR: [{ startAt: { isNull: true } }, { startAt: { lte: now } }],
              },
              {
                OR: [{ endAt: { isNull: true } }, { endAt: { gt: now } }],
              },
            ],
          },
        ],
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          columns: {
            id: true,
            name: true,
            description: true,
            cover: true,
            price: true,
            status: true,
            stock: true,
            deliveryType: true,
            startAt: true,
            endAt: true,
          },
          with: {
            pointType: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: t => [sql`${t.sort} DESC NULLS FIRST`, sql`${t.createdAt} DESC`],
        }),
      )
      .page(query.page)
      .pageSize(query.pageSize)
      .paginate();
  }
}
