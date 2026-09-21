<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next';

import type { Product } from '~/features/product';

import ProductImagePreview from './ProductImagePreview.vue';

const props = defineProps<{
  product: Product;
  isBuying?: boolean;
}>();

const emit = defineEmits<{
  buy: [productId: string];
}>();

const { getImageUrl } = useImage();

const underReviewUrl = '/under-review.png';
const underReviewOverlayUrl = '/under-review-overlay.png';

const coverUrl = computed(() =>
  props.product.cover ? getImageUrl(props.product.cover) : underReviewUrl,
);

const shouldShowReviewOverlay = computed(
  () => props.product.status === 'reviewing' && Boolean(props.product.cover),
);

const isBuyDisabled = computed(
  () => props.product.status !== 'active' || props.isBuying || props.product.stock <= 0,
);
</script>

<template>
  <article class="group rounded-xl">
    <ProductImagePreview
      :src="coverUrl"
      :alt="product.name"
      :product-id="product.id"
      :show-review-overlay="shouldShowReviewOverlay"
      :review-overlay-src="underReviewOverlayUrl"
    />

    <div class="flex items-end gap-2 px-1.5 py-2">
      <div class="min-w-0 flex-1">
        <div class="truncate text-base tracking-tight drop-shadow-sm">
          {{ product.name }}
        </div>

        <div class="text-primary">
          <span class="pr-1 text-base font-black tracking-tight md:text-xl">
            {{ product.price }}
          </span>
          <span class="text-sm font-bold">
            {{ product.pointType?.name ?? '积分' }}
          </span>
        </div>

        <div class="text-muted-foreground mt-0.5 text-xs">库存：{{ product.stock }}</div>
      </div>

      <Button
        size="icon"
        class="shrink-0 rounded-full font-black"
        :disabled="isBuyDisabled"
        @click="emit('buy', product.id)"
      >
        <ShoppingCart :size="16" />
      </Button>
    </div>
  </article>
</template>
