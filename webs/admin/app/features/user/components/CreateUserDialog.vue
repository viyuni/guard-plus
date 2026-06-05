<script setup lang="ts">
import { UserRegisterSchema, type UserRegisterBody } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useCreateUser } from '../mutations';
import UserProfileFields from './UserProfileFields.vue';

const open = defineModel<boolean>('open', { default: false });

const createUserMutation = useCreateUser();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UserRegisterSchema,
  open,
  mutation: createUserMutation,
  initialValues: () => {
    return {
      biliUid: '',
      username: '',
      password: '',
      email: undefined,
      phone: undefined,
      address: undefined,
    } satisfies UserRegisterBody;
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>添加用户</DialogTitle>
        <DialogDescription>创建一个用户账号</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="biliUid" label="UID" required>
          <Input v-bind="componentField" inputmode="numeric" placeholder="例如 123456" />
        </FormFieldItem>

        <UserProfileFields show-password />

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            创建用户
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
