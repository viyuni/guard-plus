<script setup lang="ts">
import { SuperAdminUpdateSchema } from '@shared/schema/admin';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateAdmin } from '../mutations';
import type { Admin } from './AdminListView.vue';

const props = defineProps<{
  admin: Admin;
}>();

const open = defineModel<boolean>('open', { default: false });

const updateAdminMutation = useUpdateAdmin();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: SuperAdminUpdateSchema,
  open,
  initialValues: () => ({
    username: props.admin.username,
    remark: props.admin.remark ?? undefined,
  }),
  mutation: updateAdminMutation,
  transform(body) {
    return {
      adminId: props.admin.id,
      body,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑管理员</DialogTitle>
        <DialogDescription>更新管理员资料。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
          <Input v-bind="componentField" />
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
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
