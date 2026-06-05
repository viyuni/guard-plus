<script setup lang="ts">
import { CreatePointTypeSchema } from '@shared/schema/point-type';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreatePointType } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const createPointTypeMutation = useCreatePointType();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreatePointTypeSchema,
  open,
  initialValues: () => ({
    name: '',
    description: undefined,
    sort: undefined,
  }),
  mutation: createPointTypeMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>添加积分类型</DialogTitle>
        <DialogDescription>创建可用于发放、兑换和调整的积分类型。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="名称" required>
          <Input v-bind="componentField" placeholder="例如：舰队积分" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="description" label="描述">
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="sort" label="排序">
          <Input v-bind="componentField" type="number" step="1" placeholder="留空优先展示" />
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
