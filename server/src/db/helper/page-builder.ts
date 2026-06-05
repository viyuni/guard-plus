import { relationsFilterToSQL } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

import type { DbExecutor } from '..';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<TItem> = {
  items: TItem[];
  meta: PaginationMeta;
};

export interface PageQuery {
  page?: number | null;
  pageSize?: number | null;
}

export interface ResolvePaginationOptions extends PageQuery {
  maxPageSize?: number | null;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultMaxPageSize?: number;
}

export type ResolvedPagination = {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
};

type FindManyQuery = {
  findMany: (config?: any) => Promise<any[]>;
};

type FindManyConfig<TQuery extends FindManyQuery> = NonNullable<Parameters<TQuery['findMany']>[0]>;

type ConfigWhere<TQuery extends FindManyQuery> =
  FindManyConfig<TQuery> extends { where?: infer TWhere } ? TWhere : never;

type QueryInput<TQuery extends FindManyQuery> = {
  where: ConfigWhere<TQuery> | undefined;
  limit: number;
  offset: number;
};

type QueryRunner<TQuery extends FindManyQuery, TItem> = (
  findMany: TQuery['findMany'],
  input: QueryInput<TQuery>,
) => Promise<TItem[]>;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_PAGE_SIZE = 100;

export function resolvePagination(options: ResolvePaginationOptions = {}): ResolvedPagination {
  const maxPageSize = Math.max(
    1,
    options.maxPageSize ?? options.defaultMaxPageSize ?? DEFAULT_MAX_PAGE_SIZE,
  );

  const page = Math.max(1, options.page ?? options.defaultPage ?? DEFAULT_PAGE);

  const rawPageSize = options.pageSize ?? options.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  const pageSize = Math.min(maxPageSize, Math.max(1, rawPageSize));

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function createPaginationMeta(input: {
  page: number;
  pageSize: number;
  total: number;
}): PaginationMeta {
  const { page, pageSize, total } = input;

  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function createPaginatedResult<TItem>(input: {
  items: TItem[];
  total: number;
  pagination: ResolvedPagination;
}): PaginatedResult<TItem> {
  return {
    items: input.items,
    meta: createPaginationMeta({
      page: input.pagination.page,
      pageSize: input.pagination.pageSize,
      total: input.total,
    }),
  };
}

export class QueryPageBuilder<
  TTable extends AnyPgTable,
  TQuery extends FindManyQuery,
  TItem = never,
> {
  private currentPage = DEFAULT_PAGE;
  private currentPageSize = DEFAULT_PAGE_SIZE;
  private currentMaxPageSize = DEFAULT_MAX_PAGE_SIZE;

  private whereValue?: ConfigWhere<TQuery>;
  private queryRunner?: QueryRunner<TQuery, unknown>;

  constructor(
    private readonly db: DbExecutor,
    private readonly table: TTable,
    private readonly queryTarget: TQuery,
  ) {}

  page(page: number | undefined | null) {
    this.currentPage = Math.max(1, page ?? DEFAULT_PAGE);
    return this;
  }

  pageSize(pageSize: number | undefined | null) {
    const value = pageSize ?? DEFAULT_PAGE_SIZE;
    this.currentPageSize = Math.min(this.currentMaxPageSize, Math.max(1, value));
    return this;
  }

  maxPageSize(maxPageSize: number | undefined | null) {
    const value = maxPageSize ?? DEFAULT_MAX_PAGE_SIZE;
    this.currentMaxPageSize = Math.max(1, value);
    this.currentPageSize = Math.min(this.currentPageSize, this.currentMaxPageSize);
    return this;
  }

  where<const TWhere extends ConfigWhere<TQuery>>(where: TWhere | undefined) {
    this.whereValue = where;
    return this;
  }

  query<TNextItem>(
    runner: QueryRunner<TQuery, TNextItem>,
  ): QueryPageBuilder<TTable, TQuery, TNextItem> {
    this.queryRunner = runner as QueryRunner<TQuery, unknown>;

    return this as unknown as QueryPageBuilder<TTable, TQuery, TNextItem>;
  }

  private buildCountWhere() {
    if (!this.whereValue) {
      return undefined;
    }

    return relationsFilterToSQL(this.table, this.whereValue as never);
  }

  async paginate(): Promise<PaginatedResult<TItem>> {
    const pagination = resolvePagination({
      page: this.currentPage,
      pageSize: this.currentPageSize,
      maxPageSize: this.currentMaxPageSize,
    });

    if (!this.queryRunner) {
      throw new Error('QueryPageBuilder requires query() before paginate().');
    }

    const countWhere = this.buildCountWhere();
    const findMany = this.queryTarget.findMany.bind(this.queryTarget) as TQuery['findMany'];

    const [total, items] = await Promise.all([
      this.db.$count(this.table, countWhere),
      this.queryRunner(findMany, {
        where: this.whereValue,
        limit: pagination.limit,
        offset: pagination.offset,
      }),
    ]);

    return createPaginatedResult({
      items,
      total,
      pagination,
    }) as PaginatedResult<TItem>;
  }
}
