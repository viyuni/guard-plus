import type { StockMovementPageQuery } from '@shared/schema/stock';

import type { DbExecutor } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { productStockMovements, type InsertProductStockMovement } from '#db/schema';

export class StockMovementRepository {
  constructor(private readonly db: DbExecutor) {}

  page(query: StockMovementPageQuery) {
    return new QueryPageBuilder(this.db, productStockMovements, this.db.query.productStockMovements)
      .page(query.page)
      .pageSize(query.pageSize)
      .where({
        productId: query.productId,
        type: query.type,
        createdAt: {
          gte: query.startAt ?? undefined,
          lte: query.endAt ?? undefined,
        },
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                pointTypeId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }

  async create(input: InsertProductStockMovement, db: DbExecutor = this.db) {
    const [movement] = await db.insert(productStockMovements).values(input).returning();

    return movement ?? null;
  }
}
