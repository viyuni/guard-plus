<script setup lang="ts">
import { ConvertPointSchema } from '@shared/schema/point-conversion';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import UserSelect from '../../user/components/UserSelect.vue';
import { useConvertPoint } from '../mutations';
import type { PointConversion } from './PointConversionListView.vue';

const props = defineProps<{
  conversion: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });

const convertPointMutation = useConvertPoint();
const userSelect = ref<InstanceType<typeof UserSelect>>();

const fromPointTypeName = computed(
  () =>
    props.conversion.fromPointTypeName ??
    props.conversion.fromPointType?.name ??
    props.conversion.fromPointTypeId,
);
const toPointTypeName = computed(
  () =>
    props.conversion.toPointTypeName ??
    props.conversion.toPointType?.name ??
    props.conversion.toPointTypeId,
);

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess } = usePopoverForm({
  schema: ConvertPointSchema,
  open,
  initialValues: () => ({
    ruleId: props.conversion.id,
    userId: '',
    fromAmount: props.conversion.minConvertAmount ?? 1,
    remark: undefined,
    nonce: crypto.randomUUID(),
  }),
  mutation: convertPointMutation,
  transform(values) {
    return {
      ...values,
      ruleId: props.conversion.id,
      nonce: crypto.randomUUID(),
    };
  },
});

onSubmitSuccess(() => {
  userSelect.value?.reset();
});

watch(open, isOpen => {
  if (!isOpen) {
    userSelect.value?.reset();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>执行积分转换</DialogTitle>
        <DialogDescription>
          {{ conversion.name }}：1 个 {{ fromPointTypeName }} 转换为 {{ conversion.toAmount }} 个
          {{ toPointTypeName }}。
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="userId" label="用户 ID" required>
          <UserSelect ref="userSelect" v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="fromAmount"
          :label="`${fromPointTypeName}数量`"
          required
        >
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="remark" label="备注">
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            执行转换
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
