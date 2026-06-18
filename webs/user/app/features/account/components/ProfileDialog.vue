<script setup lang="ts">
import { UserUpdateSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUserSession } from '~/composables/useUserSession';

import { useUpdateCurrentUser } from '../mutations';

const open = defineModel<boolean>('open', { required: true });

const updateCurrentUserMutation = useUpdateCurrentUser();
const { refreshUserSession, user } = useUserSession();

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess } = usePopoverForm({
  schema: UserUpdateSchema,
  open,
  initialValues: () => ({
    username: user.value?.username ?? '',
    email: user.value?.email || undefined,
    phone: user.value?.phone || undefined,
    address: user.value?.address || undefined,
  }),
  mutation: updateCurrentUserMutation,
  transform(values) {
    return {
      username: values.username?.trim() || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
    };
  },
});

onSubmitSuccess(async () => {
  await refreshUserSession();
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>个人信息</DialogTitle>
        <DialogDescription>查看并编辑收货联系方式。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="username" label="用户名">
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="email" label="邮箱">
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="phone" label="手机">
          <Input v-bind="componentField" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
          <Textarea v-bind="componentField" />
        </FormFieldItem>

        <DialogFooter>
          <Button type="submit" class="w-full" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
