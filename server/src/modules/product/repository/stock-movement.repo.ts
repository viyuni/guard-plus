import type { StockMovementPageQuery } from '@shared/schema/stock';
import { type InferInput, ripple } from 'cyrenejs';

import { Database } from '#context/tokens';
import type { DbExecutor } from '#db';
import { QueryPageBuilder } from '#db/helper';
import { productStockMovements, type InsertProductStockMovement } from '#db/schema';

export const StockMovementRepo = ripple(
  {
    Database,
  },
  ({ Database }) => ({
    page(query: StockMovementPageQuery) {
      return new QueryPageBuilder(
        Database,
        productStockMovements,
        Database.query.productStockMovements,
      )
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
    },

    async create(input: InsertProductStockMovement, executor: DbExecutor = Database) {
      const [movement] = await executor.insert(productStockMovements).values(input).returning();

      return movement ?? null;
    },
  }),
  { debugName: 'StockMovementRepository' },
);

export type StockMovementRepository = InferInput<typeof StockMovementRepo>;
