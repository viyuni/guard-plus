<script setup lang="ts">
import ProductCreateDialog from './ProductCreateDialog.vue';
import type { Product } from './ProductListView.vue';
import ProductUpdateDialog from './ProductUpdateDialog.vue';

defineProps<{
  product?: Product;
}>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <ProductUpdateDialog v-if="product" v-model:open="open" :product="product" />
  <ProductCreateDialog v-else v-model:open="open" />
</template>
