<script setup lang="ts">
import { UpdateOrderExpressSchema } from '@shared/schema/order';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateOrderExpress } from '../mutations';
import type { Order } from './OrderListView.vue';

const props = defineProps<{
  order: Order;
}>();

const open = defineModel<boolean>('open', { default: false });

const updateOrderExpressMutation = useUpdateOrderExpress();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UpdateOrderExpressSchema,
  open,
  initialValues: () => ({
    expressCompany: props.order.expressCompany ?? undefined,
    expressNo: props.order.expressNo ?? undefined,
  }),
  mutation: updateOrderExpressMutation,
  transform(values) {
    return {
      orderId: props.order.id,
      body: values,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>填写快递信息</DialogTitle>
        <DialogDescription>{{ order.productNameSnapshot }} / {{ order.orderNo }}</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="expressCompany" label="快递公司">
          <Input v-bind="componentField" placeholder="例如：顺丰速运" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="expressNo" label="快递单号">
          <Input v-bind="componentField" placeholder="输入快递单号" />
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button" :disabled="isLoading">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
