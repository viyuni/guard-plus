<script setup lang="ts">
import { RefundOrderSchema } from '@shared/schema/order';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useRefundOrder } from '../mutations';
import type { Order } from './OrderListView.vue';

const props = defineProps<{
  order: Order;
}>();

const open = defineModel<boolean>('open', { default: false });

const refundOrderMutation = useRefundOrder();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: RefundOrderSchema,
  open,
  initialValues: () => ({
    reason: undefined,
  }),
  mutation: refundOrderMutation,
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
        <DialogTitle>退款订单</DialogTitle>
        <DialogDescription>
          将退回 {{ order.price }} {{ order.pointTypeNameSnapshot }}，并恢复商品库存。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="reason" label="退款原因">
          <Textarea v-bind="componentField" placeholder="例如：用户申请退款 / 订单异常" />
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button" :disabled="isLoading">取消</Button>
          </DialogClose>
          <Button variant="destructive" type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认退款
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
