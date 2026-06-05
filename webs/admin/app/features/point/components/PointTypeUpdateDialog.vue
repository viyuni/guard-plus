<script setup lang="ts">
import { UpdatePointTypeSchema } from '@shared/schema/point-type';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdatePointType } from '../mutations';
import type { PointType } from './PointTypeListView.vue';

const props = defineProps<{
  pointType: PointType;
}>();

const open = defineModel<boolean>('open', { default: false });

const updatePointTypeMutation = useUpdatePointType();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UpdatePointTypeSchema,
  open,
  initialValues: () => ({
    name: props.pointType?.name ?? '',
    description: props.pointType?.description ?? undefined,
    sort: props.pointType?.sort ?? undefined,
  }),
  mutation: updatePointTypeMutation,
  transform(body) {
    return {
      pointTypeId: props.pointType.id,
      body,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑积分类型</DialogTitle>
        <DialogDescription>更新积分类型的展示信息。</DialogDescription>
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
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
