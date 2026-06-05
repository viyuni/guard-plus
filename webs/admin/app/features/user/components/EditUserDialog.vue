<script setup lang="ts">
import { UserUpdateSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUpdateUser } from '../mutations';
import type { User } from '../types';
import UserProfileFields from './UserProfileFields.vue';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: true });

const updateUserMutation = useUpdateUser();

const { canSubmit, handleSubmit, isLoading } = usePopoverForm({
  schema: UserUpdateSchema,
  open,
  mutation: updateUserMutation,
  initialValues: () => ({
    username: props.user.username,
    email: props.user.email ?? undefined,
    phone: props.user.phone ?? undefined,
    address: props.user.address ?? undefined,
  }),
  transform(body) {
    return {
      userId: props.user.id,
      body,
    };
  },
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogDescription>更新用户基础资料。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="handleSubmit">
        <Field>
          <FieldLabel>UID</FieldLabel>
          <Input :model-value="user.biliUid" disabled />
        </Field>

        <UserProfileFields />

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
