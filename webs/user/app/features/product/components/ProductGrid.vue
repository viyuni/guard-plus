<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

import { useDeferredVisibility } from '~/composables/useDeferredVisibility';
import type { Product } from '~/features/product';

import ProductCard from './ProductCard.vue';
import ProductCardSkeleton from './ProductCardSkeleton.vue';

defineProps<{
  buyingProductId?: string;
}>();

const emit = defineEmits<{
  buy: [product: Product];
}>();

const loadMoreTrigger = useTemplateRef<HTMLElement>('loadMoreTrigger');

/** Products fetched per page; also restarts the entrance stagger for each page. */
const PRODUCTS_PER_PAGE = 50;

const {
  data: productData,
  hasNextPage,
  isPending,
  loadNextPage,
} = useInfiniteQuery({
  key: () => ['products'],
  initialPageParam: 1,
  async query({ pageParam }) {
    const res = await api.products.get({
      query: { pageSize: PRODUCTS_PER_PAGE, page: pageParam },
    });

    return res.data;
  },
  getNextPageParam(lastPage) {
    return lastPage?.meta.hasNextPage ? lastPage.meta.page + 1 : null;
  },
});

const isLoadingMore = ref(false);

const showInitialSkeleton = useDeferredVisibility(isPending);
const showLoadMoreSkeleton = useDeferredVisibility(isLoadingMore);

const products = computed(() => {
  const pages = productData.value?.pages;
  const list: Product[] = [];

  if (!pages) {
    return list;
  }

  for (const page of pages) {
    if (page?.items) {
      list.push(...page.items);
    }
  }

  return list;
});

useIntersectionObserver(
  loadMoreTrigger,
  async ([entry]) => {
    if (entry?.isIntersecting && hasNextPage.value && !isLoadingMore.value) {
      isLoadingMore.value = true;

      try {
        await loadNextPage();
      } finally {
        isLoadingMore.value = false;
      }
    }
  },
  {
    rootMargin: '300px',
  },
);
</script>

<template>
  <section class="w-full px-5 pb-14 md:px-8 md:pb-20">
    <div
      v-if="products.length"
      class="product-3:grid-cols-3 product-4:grid-cols-4 product-4:gap-x-8 product-5:grid-cols-5 product-6:grid-cols-6 mx-auto grid w-full max-w-424 grid-cols-2 gap-x-3 gap-y-8"
    >
      <ProductCard
        v-for="(item, index) in products"
        :key="item.id"
        :product="item"
        :enter-index="index % PRODUCTS_PER_PAGE"
        :is-buying="buyingProductId === item.id"
        @buy="emit('buy', item)"
      />
    </div>

    <div
      v-else-if="showInitialSkeleton"
      class="product-3:grid-cols-3 product-4:grid-cols-4 product-4:gap-x-8 product-5:grid-cols-5 product-6:grid-cols-6 mx-auto grid w-full max-w-424 grid-cols-2 gap-x-3 gap-y-8"
    >
      <ProductCardSkeleton v-for="index in 10" :key="index" />
    </div>

    <div v-else-if="!isPending" class="rounded-3xl px-6 py-16 text-center text-sm">
      暂无可兑换商品，晚点再来看看吧
    </div>

    <div
      v-if="showLoadMoreSkeleton"
      class="product-3:grid-cols-3 product-4:grid-cols-4 product-4:gap-x-8 product-5:grid-cols-5 product-6:grid-cols-6 mx-auto mt-8 grid w-full max-w-424 grid-cols-2 gap-x-3 gap-y-8"
    >
      <ProductCardSkeleton v-for="index in 10" :key="index" />
    </div>

    <div ref="loadMoreTrigger" class="h-px w-full" />
  </section>
</template>
