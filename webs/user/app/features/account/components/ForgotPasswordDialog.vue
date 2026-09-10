<script setup lang="ts">
import { UserResetPasswordSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@web/ui/components/ui/field';
import { FormField, toTypedSchema } from '@web/ui/components/ui/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@web/ui/components/ui/input-group';
import { Loader2 } from 'lucide-vue-next';
import * as v from 'valibot';
import { useForm } from 'vee-validate';

import { useResetUserPassword } from '../mutations';
import BiliRegisterCodeDialog, { type BiliRegisterStatus } from './BiliRegisterCodeDialog.vue';

const ForgotPasswordSchema = v.pipe(
  v.object({
    ...UserResetPasswordSchema.entries,
    confirmPassword: v.pipe(v.string(), v.nonEmpty('请再次输入密码')),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      values => values.newPassword === values.confirmPassword,
      '两次输入的密码不一致',
    ),
    ['confirmPassword'],
  ),
);

const open = defineModel<boolean>('open', { default: false });
const verificationStatus = ref<BiliRegisterStatus>('idle');
const verificationDialog = useTemplateRef('verificationDialog');
const resetPasswordMutation = useResetUserPassword();

function createDefaultValues() {
  return {
    biliUid: '',
    newPassword: '',
    confirmPassword: '',
  };
}

const { handleSubmit, meta, resetForm, values } = useForm({
  validationSchema: toTypedSchema(ForgotPasswordSchema),
  initialValues: createDefaultValues(),
});
const { isLoading } = resetPasswordMutation;

const onSubmit = handleSubmit(async values => {
  await resetPasswordMutation.mutateAsync({
    biliUid: values.biliUid,
    newPassword: values.newPassword,
  });
  open.value = false;
});

watch(open, isOpen => {
  if (!isOpen) {
    verificationDialog.value?.reset();
    verificationStatus.value = 'idle';
    resetForm({ values: createDefaultValues() });
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>忘记密码</DialogTitle>
        <DialogDescription>验证 B 站 UID 归属后，即可设置新密码。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit="onSubmit">
        <FormField v-slot="{ field, errors }" name="biliUid">
          <Field :data-invalid="errors.length > 0">
            <FieldLabel required>B 站 UID</FieldLabel>
            <InputGroup>
              <InputGroupInput
                v-bind="field"
                :disabled="verificationStatus === 'matched'"
                placeholder="请输入 B 站 UID"
              />
              <BiliRegisterCodeDialog
                ref="verificationDialog"
                v-model:status="verificationStatus"
                :bili-uid="values.biliUid ?? ''"
                purpose="password-reset"
                #default="{ createCode, isCreating, status }"
              >
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    variant="default"
                    class="px-2 py-1"
                    :disabled="isCreating"
                    @click="createCode"
                  >
                    <Loader2 v-if="isCreating" class="animate-spin" />
                    {{ status === 'matched' ? '重新验证' : '验证' }}
                  </InputGroupButton>
                </InputGroupAddon>
              </BiliRegisterCodeDialog>
            </InputGroup>
            <FieldDescription class="text-xs">
              <span class="block">需要验证 UID 后才能重置密码</span>
              <span class="block">如多次验证失败，请联系管理员处理</span>
            </FieldDescription>
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

        <FormField v-slot="{ field, errors }" name="confirmPassword">
          <Field :data-invalid="errors.length > 0">
            <FieldLabel required>确认新密码</FieldLabel>
            <Input v-bind="field" type="password" autocomplete="new-password" />
            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button
            type="submit"
            :disabled="isLoading || !meta.valid || verificationStatus !== 'matched'"
          >
            <Loader2 v-if="isLoading" class="animate-spin" />
            重置密码
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
