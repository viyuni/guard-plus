<script setup lang="ts">
import { UserConvertPointSchema } from '@shared/schema/point-conversion';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useConvertPoint } from '../mutations';

const open = defineModel<boolean>('open', { required: true });

const convertPointMutation = useConvertPoint();
const { conversionRules } = useUserSession();

function createNonce() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

const { canSubmit, handleSubmit, isLoading, values } = usePopoverForm({
  schema: UserConvertPointSchema,
  open,
  initialValues: () => ({
    ruleId: '',
    fromAmount: 1,
    nonce: createNonce(),
  }),
  mutation: convertPointMutation,
  transform(values) {
    return {
      ...values,
      nonce: createNonce(),
    };
  },
});

const selectedRule = computed(() => {
  return conversionRules.value.find(rule => rule.id === values.ruleId);
});

const preview = computed(() => {
  if (!selectedRule.value || !Number.isFinite(Number(values.fromAmount))) {
    return null;
  }

  return Number(values.fromAmount) * selectedRule.value.toAmount;
});

const conversionDescription = computed(() => {
  if (!selectedRule.value) {
    return undefined;
  }

  return `${values.fromAmount || 0} ${selectedRule.value.fromPointType?.name} 可转换为 ${
    preview.value ?? 0
  } ${selectedRule.value.toPointType?.name}`;
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>积分转换</DialogTitle>
        <DialogDescription>选择规则并输入要转换的来源积分数量。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="ruleId" label="转换规则" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption value="">选择转换规则</NativeSelectOption>
            <NativeSelectOption v-for="rule in conversionRules" :key="rule.id" :value="rule.id">
              {{ rule.fromPointType?.name }} -> {{ rule.toPointType?.name }}
            </NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="fromAmount"
          label="来源数量"
          :description="conversionDescription"
          required
        >
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <DialogFooter>
          <Button type="submit" class="w-full" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            确认转换
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
