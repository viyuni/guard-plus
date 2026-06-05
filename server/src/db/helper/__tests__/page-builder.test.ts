import { describe, expect, it, mock } from 'bun:test';

import { pointTypes } from '#db/schema';

import { QueryPageBuilder } from '../page-builder';

type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends <T>() => T extends TExpected ? 1 : 2 ? true : false;

type Expect<T extends true> = T;

const mockTable = {} as any;

function createMockRelationalDb(items: unknown[] = [], total = 0) {
  const query = {
    marker: Symbol('query'),
    findMany: mock(async function (this: any, _config?: any) {
      if (this !== query) {
        throw new Error('findMany called without query target context');
      }

      return items;
    }),
  };

  return {
    db: {
      $count: mock(async () => total),
    } as any,
    query,
    findMany: query.findMany,
  };
}

describe('QueryPageBuilder', () => {
  describe('paginate()', () => {
    it('返回正确的分页数据和 meta', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const { db, query } = createMockRelationalDb(items, 25);

      const result = await new QueryPageBuilder(db, mockTable, query)
        .query((findMany, input) => findMany(input))
        .page(2)
        .pageSize(10)
        .paginate();

      expect(result.items).toEqual(items);
      expect(result.meta).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('query runner 接收 findMany、where、limit 和 offset', async () => {
      const { db, query, findMany } = createMockRelationalDb([], 0);
      const runner = mock((findManyArg, input) =>
        findManyArg({
          where: input.where,
          columns: { id: true, name: true },
          with: { pointType: true },
          orderBy: { createdAt: 'desc' },
          limit: input.limit,
          offset: input.offset,
        }),
      );

      await new QueryPageBuilder(db, mockTable, query).query(runner).page(3).pageSize(5).paginate();

      const runnerCall = runner.mock.calls[0];
      expect(typeof runnerCall?.[0]).toBe('function');
      expect(runnerCall?.[1]).toEqual({
        where: undefined,
        limit: 5,
        offset: 10,
      });
      expect(findMany).toHaveBeenCalledWith({
        columns: { id: true, name: true },
        with: { pointType: true },
        orderBy: { createdAt: 'desc' },
        where: undefined,
        limit: 5,
        offset: 10,
      });
    });

    it('query 会收窄 paginate item 类型', async () => {
      const { db, query } = createMockRelationalDb([], 0);

      const result = await new QueryPageBuilder(db, pointTypes, query)
        .query(async () => [] as { id: string; name: string }[])
        .paginate();

      type Item = (typeof result.items)[number];
      type _ = Expect<Equal<Item, { id: string; name: string }>>;

      expect(result.items).toEqual([]);
    });

    it('where 传给 findMany，并把 relation where 转成 SQL 传给 $count', async () => {
      const { db, query, findMany } = createMockRelationalDb([], 0);
      const where = { name: { like: 'test%' } };

      await new QueryPageBuilder(db, pointTypes, query)
        .where(where)
        .query((findMany, input) => findMany(input))
        .paginate();

      const config = findMany.mock.calls[0]?.[0];
      expect(config.where).toBe(where);
      expect(db.$count.mock.calls[0]?.[0]).toBe(pointTypes);
      expect(db.$count.mock.calls[0]?.[1]).toBeDefined();
    });

    it('where 为 undefined 时不传 findMany where，并用 undefined 调用 $count', async () => {
      const { db, query, findMany } = createMockRelationalDb([], 0);

      await new QueryPageBuilder(db, mockTable, query)
        .where(undefined)
        .query((findMany, input) => findMany(input))
        .paginate();

      const config = findMany.mock.calls[0]?.[0];
      expect(config.where).toBeUndefined();
      expect(db.$count).toHaveBeenCalledWith(mockTable, undefined);
    });

    it('pageSize 超过 maxPageSize 时被截断', async () => {
      const { db, query, findMany } = createMockRelationalDb([], 0);

      const result = await new QueryPageBuilder(db, mockTable, query)
        .query((findMany, input) => findMany(input))
        .pageSize(200)
        .maxPageSize(30)
        .paginate();

      const config = findMany.mock.calls[0]?.[0];
      expect(config.limit).toBe(30);
      expect(result.meta.pageSize).toBe(30);
    });

    it('未调用 query 时抛出错误', async () => {
      const { db, query } = createMockRelationalDb([], 0);

      expect(new QueryPageBuilder(db, mockTable, query).paginate()).rejects.toThrow(
        'QueryPageBuilder requires query() before paginate().',
      );
    });
  });

  describe('chaining', () => {
    it('所有方法可链式调用', async () => {
      const { db, query } = createMockRelationalDb([], 0);

      const result = await new QueryPageBuilder(db, mockTable, query)
        .page(2)
        .pageSize(5)
        .maxPageSize(50)
        .where(undefined)
        .query((findMany, input) => findMany(input))
        .paginate();

      expect(result.meta.page).toBe(2);
      expect(result.meta.pageSize).toBe(5);
    });
  });
});
