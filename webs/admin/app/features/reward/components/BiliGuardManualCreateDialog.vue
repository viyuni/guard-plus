<script setup lang="ts">
import {
  BiliGuardType,
  CreateManualBiliGuardEventSchema,
  type CreateManualBiliGuardEventBody,
} from '@shared/schema/reward';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreateManualBiliGuardEvent } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const createManualBiliGuardEventMutation = useCreateManualBiliGuardEvent();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreateManualBiliGuardEventSchema,
  open,
  initialValues: () => ({
    uid: '',
    total: undefined,
    openedAt: undefined,
    guardType: undefined,
  }),
  mutation: createManualBiliGuardEventMutation,
  transform: values =>
    ({
      ...values,
      guardType: Number(values.guardType),
    }) as CreateManualBiliGuardEventBody,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>手动创建大航海事件</DialogTitle>
        <DialogDescription>填写关键字段后，系统会自动补齐事件快照并发放奖励。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="uid" label="UID" required>
          <Input v-bind="componentField" inputmode="numeric" placeholder="B站 UID" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="total" label="数量" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="openedAt" label="开通时间" required>
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="guardType" label="大航海" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption value="" disabled>选择大航海</NativeSelectOption>
            <NativeSelectOption :value="BiliGuardType.Jianzhang">舰长</NativeSelectOption>
            <NativeSelectOption :value="BiliGuardType.Tidu">提督</NativeSelectOption>
            <NativeSelectOption :value="BiliGuardType.Zongdu">总督</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
