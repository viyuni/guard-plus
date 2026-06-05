<script setup lang="ts">
import { CreatePointConversionRuleSchema } from '@shared/schema/point-conversion';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreatePointConversionRule } from '../mutations';
import PointTypeSelect from './PointTypeSelect.vue';

const open = defineModel<boolean>('open', { default: false });

const createConversionRuleMutation = useCreatePointConversionRule();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreatePointConversionRuleSchema,
  open,
  initialValues: () => ({
    name: '',
    description: undefined,
    remark: undefined,
    fromPointTypeId: '',
    toPointTypeId: '',
    toAmount: 1,
    minConvertAmount: undefined,
    maxConvertAmount: undefined,
    enabled: false,
    startAt: undefined,
    endAt: undefined,
  }),
  mutation: createConversionRuleMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>添加积分转换</DialogTitle>
        <DialogDescription>创建积分类型之间的转换规则。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="规则名称" required>
          <Input v-bind="componentField" placeholder="例如：督级积分兑换舰级积分" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          name="toAmount"
          label="目标数量"
          description="每 1 个来源积分可兑换的目标积分数量。"
          required
        >
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="fromPointTypeId" label="来源积分" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择来源积分" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="toPointTypeId" label="目标积分" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择目标积分" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="minConvertAmount" label="单次最小转换">
          <Input v-bind="componentField" type="number" min="1" step="1" placeholder="不限制" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="maxConvertAmount" label="单次最大转换">
          <Input v-bind="componentField" type="number" min="1" step="1" placeholder="不限制" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="startAt" label="开始时间">
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endAt" label="结束时间">
          <DateTimeLocalInput v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ field }" name="enabled" label="启用状态">
          <Switch :checked="field.value" @update:checked="field.onChange" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2"
          name="description"
          label="描述"
        >
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" class="sm:col-span-2" name="remark" label="备注">
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
