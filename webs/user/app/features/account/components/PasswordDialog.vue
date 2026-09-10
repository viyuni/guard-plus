<script setup lang="ts">
import { UserUpdatePasswordSchema, type UpdateUserPasswordBody } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { Field, FieldError, FieldLabel } from '@web/ui/components/ui/field';
import { FormField, toTypedSchema } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { useUpdateCurrentUserPassword } from '../mutations';

const open = defineModel<boolean>('open', { default: false });
const updatePasswordMutation = useUpdateCurrentUserPassword();

const { handleSubmit, meta, resetForm } = useForm<UpdateUserPasswordBody>({
  validationSchema: toTypedSchema(UserUpdatePasswordSchema),
  initialValues: createDefaultValues(),
});
const { isLoading } = updatePasswordMutation;

function createDefaultValues(): UpdateUserPasswordBody {
  return {
    oldPassword: '',
    newPassword: '',
  };
}

const onSubmit = handleSubmit(async values => {
  await updatePasswordMutation.mutateAsync(values);
  open.value = false;
});

watch(open, isOpen => {
  if (!isOpen) resetForm({ values: createDefaultValues() });
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>修改密码</DialogTitle>
        <DialogDescription>请输入当前密码，并设置一个新密码。</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ field, errors }" name="oldPassword">
          <Field :data-invalid="errors.length > 0">
            <FieldLabel required>当前密码</FieldLabel>
            <Input v-bind="field" type="password" autocomplete="current-password" />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors }" name="newPassword">
          <Field :data-invalid="errors.length > 0">
            <FieldLabel required>新密码</FieldLabel>
            <Input v-bind="field" type="password" autocomplete="new-password" />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || !meta.valid">
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
