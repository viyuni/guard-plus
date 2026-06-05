<script setup lang="ts">
import { AdminCreateSchema } from '@shared/schema/admin';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreateAdmin } from '../mutations';

const open = defineModel<boolean>('open', { default: false });

const createAdminMutation = useCreateAdmin();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: AdminCreateSchema,
  open,
  initialValues: () => ({
    uid: '',
    username: '',
    password: '',
    remark: undefined,
  }),
  mutation: createAdminMutation,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>添加管理员</DialogTitle>
        <DialogDescription>创建普通管理员账号。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="uid" label="UID" required>
          <Input v-bind="componentField" inputmode="numeric" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="password" label="初始密码" required>
          <Input v-bind="componentField" type="password" />
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
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
