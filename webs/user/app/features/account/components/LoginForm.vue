<script setup lang="ts">
import { UserLoginSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useUserSession } from '~/composables/useUserSession';

import { useLogin } from '../mutations';

const emit = defineEmits<{
  authenticated: [];
  forgotPassword: [];
}>();

const loginMutation = useLogin();
const { refreshUserSession } = useUserSession();

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess, resetForm } = useForm({
  schema: UserLoginSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    password: '',
  }),
  mutation: loginMutation,
});

onSubmitSuccess(async () => {
  await refreshUserSession();
  emit('authenticated');
});

defineExpose({
  resetForm,
});
</script>

<template>
  <form class="grid gap-3" @submit="handleSubmit">
    <FormFieldItem v-slot="{ componentField }" name="biliUid" label="B 站 UID" required>
      <Input v-bind="componentField" />
    </FormFieldItem>

    <div class="grid gap-2">
      <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
        <Input v-bind="componentField" type="password" autocomplete="current-password" />
      </FormFieldItem>
      <Button
        type="button"
        variant="link"
        class="text-muted-foreground hover:text-primary h-auto justify-self-end p-0 text-xs"
        @click="emit('forgotPassword')"
      >
        忘记密码？
      </Button>
    </div>

    <DialogFooter>
      <Button type="submit" class="w-full" :disabled="!canSubmit">
        <Loader2 v-if="isLoading" class="animate-spin" />
        登录
      </Button>
    </DialogFooter>
  </form>
</template>
