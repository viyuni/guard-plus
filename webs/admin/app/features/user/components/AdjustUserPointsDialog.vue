<script setup lang="ts">
import { AdjustBalanceSchema } from '@shared/schema/point-account';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useAdjustUserPoints } from '../mutations';
import type { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: false });

const adjustUserPointsMutation = useAdjustUserPoints();

const { canSubmit, handleSubmit, isLoading, setFieldValue, values } = usePopoverForm({
  schema: AdjustBalanceSchema,
  open,
  initialValues: () => ({
    userId: props.user.id,
    pointTypeId: '',
    delta: 1,
    remark: '',
    nonce: crypto.randomUUID(),
  }),
  mutation: adjustUserPointsMutation,
  transform(values) {
    return {
      ...values,
      nonce: crypto.randomUUID(),
    };
  },
});

const selectedPointAccount = computed(() =>
  props.user.pointAccounts?.find(pointAccount => pointAccount.pointType?.id === values.pointTypeId),
);
const currentBalance = computed(() => selectedPointAccount.value?.balance ?? 0);

watch(
  () => props.user.id,
  userId => {
    setFieldValue('userId', userId);
  },
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>操作积分</DialogTitle>
        <DialogDescription>调整 {{ user.username }} 的积分余额。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem
          v-slot="{ field, invalid }"
          name="pointTypeId"
          label="积分类型"
          :description="`当前积分：${currentBalance}`"
          required
        >
          <PointTypeSelect
            placeholder="选择积分类型"
            :model-value="field.value"
            :invalid="invalid"
            @update:model-value="field.onChange(String($event))"
          />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="delta"
          label="变动数量"
          :description="`扣减请优先使用冲正流水。调整后：${currentBalance + Number(values.delta)}`"
          required
        >
          <Input v-bind="componentField" type="number" step="1" placeholder="正数增加，负数扣减" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="remark" label="备注">
          <Textarea v-bind="componentField" placeholder="例如：活动补发 / 违规扣减" />
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
