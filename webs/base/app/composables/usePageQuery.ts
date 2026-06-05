import { useQuery } from '@pinia/colada';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';

type QuerySetupOptions = Parameters<typeof useQuery>[0];

type QueryData<TOptions> = TOptions extends (...args: any[]) => infer TResult
  ? QueryData<TResult>
  : TOptions extends { query: (...args: any[]) => Promise<infer TData> }
    ? TData
    : unknown;

type PageItems<TData> = NonNullable<TData> extends { items: infer TItems } ? TItems : never[];

type PageMeta<TData> = NonNullable<TData> extends { meta: infer TMeta } ? TMeta : undefined;

type MaybePageData = {
  items?: unknown[];
  meta?: unknown;
};

/**
 * 包装 Pinia Colada 的 useQuery，专门处理 { items, meta } 分页响应。
 *
 * 返回原 useQuery 的所有状态，并额外提供 items 和 meta。
 * items/meta 的类型会从传入的 query options 返回值里自动推导。
 */
export function usePageQuery<TOptions extends QuerySetupOptions>(setupOptions: TOptions) {
  const query = useQuery(setupOptions);

  const items = computed(() => {
    const data = query.data.value as MaybePageData | null | undefined;

    return data?.items ?? [];
  }) as ComputedRef<PageItems<QueryData<TOptions>>>;

  const meta = computed(() => {
    const data = query.data.value as MaybePageData | null | undefined;

    return data?.meta;
  }) as ComputedRef<PageMeta<QueryData<TOptions>> | undefined>;

  return {
    ...query,
    items,
    meta,
  };
}
