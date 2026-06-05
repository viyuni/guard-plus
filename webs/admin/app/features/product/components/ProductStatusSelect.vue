<script setup lang="ts">
import { ProductStatus, type ProductStatus as ProductStatusValue } from '@shared/schema/product';

withDefaults(
  defineProps<{
    placeholder?: string;
    required?: boolean;
    size?: 'default' | 'sm';
  }>(),
  {
    placeholder: '商品状态',
    required: false,
    size: 'default',
  },
);

const modelValue = defineModel<ProductStatusValue | ''>();
</script>

<template>
  <NativeSelect v-model:model-value="modelValue" :size>
    <NativeSelectOption v-if="!required" value="">{{ placeholder }}</NativeSelectOption>
    <NativeSelectOption :value="ProductStatus.Active">上架</NativeSelectOption>
    <NativeSelectOption :value="ProductStatus.Reviewing">监修中</NativeSelectOption>
    <NativeSelectOption :value="ProductStatus.Disabled">下架</NativeSelectOption>
  </NativeSelect>
</template>
