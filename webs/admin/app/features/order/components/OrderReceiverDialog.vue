<script setup lang="ts">
import { UpdateOrderReceiverSchema } from '@shared/schema/order';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateOrderReceiver } from '../mutations';
import type { Order } from './OrderListView.vue';

const props = defineProps<{
  order: Order;
}>();

const open = defineModel<boolean>('open', { default: false });

const updateOrderReceiverMutation = useUpdateOrderReceiver();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UpdateOrderReceiverSchema,
  open,
  initialValues: () => ({
    phone: undefined,
    address: undefined,
  }),
  mutation: updateOrderReceiverMutation,
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
        <DialogTitle>修改收货信息</DialogTitle>
        <DialogDescription>{{ order.productNameSnapshot }} / {{ order.orderNo }}</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="phone" label="收货电话">
          <Input v-bind="componentField" placeholder="输入新的收货电话" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
          <Textarea v-bind="componentField" placeholder="输入新的收货地址" />
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
