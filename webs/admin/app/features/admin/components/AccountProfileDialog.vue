<script setup lang="ts">
import { AdminUpdateSchema } from '@shared/schema/admin';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useAdminSession } from '../../auth';
import { useUpdateCurrentAdmin } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const { user } = useAdminSession();
const updateCurrentAdminMutation = useUpdateCurrentAdmin();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: AdminUpdateSchema,
  open,
  initialValues: () => ({
    username: user.value?.username ?? '',
  }),
  resetOnClose: false,
  resetOnOpen: true,
  mutation: updateCurrentAdminMutation,
  transform(values) {
    return {
      username: values.username?.trim() || undefined,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>修改账户信息</DialogTitle>
        <DialogDescription>更新当前登录管理员的展示信息。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
          <Input v-bind="componentField" />
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
