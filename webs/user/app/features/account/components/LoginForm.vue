<script setup lang="ts">
import { UserLoginSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import { useLogin } from '../mutations';

const emit = defineEmits<{
  authenticated: [];
}>();

const loginMutation = useLogin();

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess, resetForm } = useForm({
  schema: UserLoginSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    password: '',
  }),
  mutation: loginMutation,
});

onSubmitSuccess(() => {
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

    <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
      <Input v-bind="componentField" type="password" />
    </FormFieldItem>

    <DialogFooter>
      <Button type="submit" class="w-full" :disabled="!canSubmit">
        <Loader2 v-if="isLoading" class="animate-spin" />
        登录
      </Button>
    </DialogFooter>
  </form>
</template>
