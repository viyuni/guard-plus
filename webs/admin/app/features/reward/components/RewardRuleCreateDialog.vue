<script setup lang="ts">
import { CreateRewardRuleSchema } from '@shared/schema/reward';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useCreateRewardRule } from '../mutations';
import BiliGuardTypeCheckboxGroup from './BiliGuardTypeCheckboxGroup.vue';

const open = defineModel<boolean>('open', { default: false });

const createRewardRuleMutation = useCreateRewardRule();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreateRewardRuleSchema,
  open,
  initialValues: () => ({
    name: '',
    description: undefined,
    conditions: {
      type: 'biliGuard' as const,
      guardTypes: undefined,
    },
    pointTypeId: '',
    points: 1,
    enabled: false,
    group: undefined,
    startAt: undefined,
    endAt: undefined,
    priority: 0,
  }),
  mutation: createRewardRuleMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>添加积分规则</DialogTitle>
        <DialogDescription>创建大航海事件触发的积分发放规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="规则名称" required>
          <Input v-bind="componentField" placeholder="例如：舰长月度奖励" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="pointTypeId" label="积分类型" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择积分类型" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="points" label="奖励积分" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="priority" label="优先级" required>
          <Input v-bind="componentField" type="number" step="1" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="group"
          label="互斥分组"
          description="同一分组内只取优先级最高的一条。"
        >
          <Input v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ field }" name="enabled" label="启用状态">
          <Switch :model-value="field.value" @update:model-value="field.onChange" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="startAt" label="开始时间">
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endAt" label="结束时间">
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ field }"
          class="sm:col-span-2"
          name="conditions.guardTypes"
          label="触发大航海类型"
          description="不选择时不会触发奖励。"
        >
          <BiliGuardTypeCheckboxGroup
            :model-value="field.value"
            @update:model-value="field.onChange"
          />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2"
          name="description"
          label="备注"
        >
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <DialogFooter class="sm:col-span-2">
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
