import { refDebounced } from '@vueuse/core';
import { useRouteQuery } from '@vueuse/router';
import { computed, reactive, toRefs, watch } from 'vue';

type BasePageQueryState = {
  page: number;
  pageSize: number;
  keyword: string;
};

type DebouncedPageQueryState<TCustom extends object> = BasePageQueryState &
  Omit<TCustom, keyof BasePageQueryState>;

type DebouncedPageQueryOptions = {
  debounce?: number;
  persistPageQuery?: boolean;
};

type DebouncedPageQuery<TCustom extends object> = Omit<
  Partial<BasePageQueryState> & Omit<TCustom, keyof BasePageQueryState>,
  'keyword'
> & {
  keyword?: string;
};

function normalizeEmptyStrings<T extends object>(query: T) {
  const normalized = {} as T;

  for (const key in query) {
    const value = query[key];

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      normalized[key] = (trimmedValue || undefined) as T[Extract<keyof T, string>];
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

/**
 * 创建列表页常用查询状态，并输出防抖后的请求参数。
 *
 * 默认包含 page、pageSize、keyword；传入泛型可以合并 status 等额外筛选字段。
 * stateRefs 适合直接绑定 v-model，query 用于实际请求。
 */
export function useDebouncedPageQuery<TCustom extends object = Record<never, never>>(
  initial?: Partial<DebouncedPageQueryState<TCustom>>,
  options: DebouncedPageQueryOptions = {},
) {
  const shouldPersistPageQuery = options.persistPageQuery ?? true;
  const initialPage = initial?.page ?? 1;
  const initialPageSize = initial?.pageSize ?? 15;
  const routePage = useRouteQuery('page', String(initialPage), {
    mode: 'replace',
    transform: Number,
  });
  const routePageSize = useRouteQuery('pageSize', String(initialPageSize), {
    mode: 'replace',
    transform: Number,
  });

  const state = reactive({
    ...initial,
    page: routePage.value,
    pageSize: routePageSize.value,
    keyword: initial?.keyword ?? '',
  }) as DebouncedPageQueryState<TCustom>;

  const rawQuery = computed(() => {
    // 空字符串不进入请求参数，避免 query key 和接口收到无意义的空值。
    return normalizeEmptyStrings(state) as DebouncedPageQuery<TCustom>;
  });

  const query = refDebounced(rawQuery, options.debounce ?? 100);

  if (shouldPersistPageQuery) {
    watch(
      () => [state.page, state.pageSize] as const,
      ([page, pageSize]) => {
        routePage!.value = page;
        routePageSize!.value = pageSize;
      },
    );
  }

  return {
    state,
    stateRefs: toRefs(state),
    rawQuery,
    query,
  };
}
