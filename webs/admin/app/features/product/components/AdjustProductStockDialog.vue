<script setup lang="ts">
import { StockAdjustmentSchema } from '@shared/schema/stock';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useAdjustProductStock } from '../mutations';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const adjustProductStockMutation = useAdjustProductStock();

const { canSubmit, handleSubmit, isLoading, values } = usePopoverForm({
  schema: StockAdjustmentSchema,
  open,
  initialValues: () => ({
    delta: 1,
    remark: undefined,
    nonce: crypto.randomUUID(),
  }),
  mutation: adjustProductStockMutation,
  transform(values) {
    return {
      productId: props.product.id,
      body: {
        ...values,
        nonce: crypto.randomUUID(),
      },
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>调整库存</DialogTitle>
        <DialogDescription> {{ product.name }} 当前库存为 {{ product.stock }}。 </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem
          v-slot="{ componentField }"
          name="delta"
          label="调整数量"
          :description="`调整后库存：${product.stock + Number(values.delta)}`"
          required
        >
          <Input v-bind="componentField" type="number" step="1" placeholder="正数入库，负数扣减" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="remark" label="备注">
          <Textarea v-bind="componentField" placeholder="例如：盘点入库 / 损耗扣减" />
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认调整
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
