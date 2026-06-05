<script setup lang="ts">
import { AdminUpdatePasswordSchema, type AdminUpdatePasswordBody } from '@shared/schema/admin';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateCurrentAdminPassword } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const updateCurrentAdminPasswordMutation = useUpdateCurrentAdminPassword();

const defaultValues: AdminUpdatePasswordBody = {
  oldPassword: '',
  newPassword: '',
};

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: AdminUpdatePasswordSchema,
  open,
  initialValues: () => defaultValues,
  mutation: updateCurrentAdminPasswordMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>修改账户密码</DialogTitle>
        <DialogDescription>修改后请使用新密码登录。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="oldPassword" label="当前密码" required>
          <Input v-bind="componentField" type="password" autocomplete="current-password" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="newPassword" label="新密码" required>
          <Input v-bind="componentField" type="password" autocomplete="new-password" />
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
