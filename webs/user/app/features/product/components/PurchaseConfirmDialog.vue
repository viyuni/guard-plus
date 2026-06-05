<script setup lang="ts">
import type { Product } from '~/features/product';

defineProps<{
  product: Product;
  isBuying?: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

defineEmits<{
  resolve: [value: boolean];
}>();
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认兑换商品？</AlertDialogTitle>
        <AlertDialogDescription>
          将使用 {{ product.price }} {{ product.pointType?.name ?? '积分' }}兑换 “{{
            product.name
          }}”。兑换后将立即扣除积分。
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isBuying">取消</AlertDialogCancel>
        <Button :disabled="isBuying" @click="$emit('resolve', true)">确认兑换</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
