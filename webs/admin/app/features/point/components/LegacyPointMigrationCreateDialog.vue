<script setup lang="ts">
import { CreateLegacyPointMigrationSchema } from '@shared/schema/point-account';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreateLegacyPointMigration } from '../mutations';
import PointTypeSelect from './PointTypeSelect.vue';

const open = defineModel<boolean>('open', { default: false });

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: CreateLegacyPointMigrationSchema,
  open,
  initialValues: () => ({
    biliUid: '',
    pointTypeId: '',
    points: 1,
  }),
  mutation: useCreateLegacyPointMigration(),
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>录入旧平台积分</DialogTitle>
        <DialogDescription>用户使用该 UID 注册时，系统会自动回放积分并生成流水。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="biliUid" label="B站 UID" required>
          <Input v-bind="componentField" inputmode="numeric" placeholder="请输入 UID" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="pointTypeId" label="积分类型" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择积分类型" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="points" label="迁移积分" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            录入
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
