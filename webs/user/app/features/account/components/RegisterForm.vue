<script setup lang="ts">
import { UserRegisterSchema } from '@shared/schema/user';
import { Button } from '@web/ui/components/ui/button';
import { DialogFooter } from '@web/ui/components/ui/dialog';
import { FormFieldItem, useForm } from '@web/ui/components/ui/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@web/ui/components/ui/input-group';
import { Loader2 } from 'lucide-vue-next';
import * as v from 'valibot';

import { useRegister } from '../mutations';
import BiliRegisterCodeDialog, { type BiliRegisterStatus } from './BiliRegisterCodeDialog.vue';

const RegisterFormSchema = v.pipe(
  v.object({
    ...UserRegisterSchema.entries,
    confirmPassword: v.pipe(v.string(), v.nonEmpty('请再次输入密码')),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      values => values.password === values.confirmPassword,
      '两次输入的密码不一致',
    ),
    ['confirmPassword'],
  ),
);

const emit = defineEmits<{
  registered: [];
}>();

const biliRegisterStatus = ref<BiliRegisterStatus>('idle');
const verificationDialog = useTemplateRef('verificationDialog');
const registerMutation = useRegister();

const {
  canSubmit,
  handleSubmit,
  isLoading,
  onSubmitSuccess,
  resetForm: resetRegisterForm,
  setFieldValue,
  values,
} = useForm({
  schema: RegisterFormSchema,
  resetOnSuccess: false,
  initialValues: () => ({
    biliUid: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: undefined,
    address: undefined,
  }),
  mutation: registerMutation,
  transform(values) {
    const { confirmPassword: _, ...registerValues } = values;

    return {
      ...registerValues,
      phone: registerValues.phone || undefined,
      address: registerValues.address || undefined,
    };
  },
});

function handleBiliRegisterMatched(biliUser: { name?: string | null }) {
  if (!values.username) {
    setFieldValue('username', biliUser.name ?? '');
  }
}

function resetForm() {
  verificationDialog.value?.reset();
  resetRegisterForm();
}

onSubmitSuccess(() => {
  resetForm();
  emit('registered');
});

defineExpose({
  resetForm,
});
</script>

<template>
  <form class="grid gap-3" @submit="handleSubmit">
    <FormFieldItem
      v-slot="{ componentField }"
      name="biliUid"
      label="B 站 UID"
      required
      description="需要验证 UID 后才能注册"
    >
      <InputGroup>
        <InputGroupInput
          v-bind="componentField"
          :disabled="biliRegisterStatus === 'matched'"
          placeholder="请输入 B 站 UID"
        />
        <BiliRegisterCodeDialog
          ref="verificationDialog"
          v-model:status="biliRegisterStatus"
          :bili-uid="values.biliUid"
          @matched="handleBiliRegisterMatched"
          #default="{ createCode, isCreating, status }"
        >
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              :disabled="isCreating"
              @click="createCode"
              variant="default"
              class="px-2 py-1"
            >
              <Loader2 v-if="isCreating" class="animate-spin" />
              {{ status === 'matched' ? '重新验证' : '验证' }}
            </InputGroupButton>
          </InputGroupAddon>
        </BiliRegisterCodeDialog>
      </InputGroup>
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
      <Input v-bind="componentField" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="password" label="密码" required>
      <Input v-bind="componentField" type="password" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="confirmPassword" label="确认密码" required>
      <Input v-bind="componentField" type="password" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="phone" label="手机">
      <Input v-bind="componentField" placeholder="如担心信息安全可私发给管理员" />
    </FormFieldItem>

    <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
      <Textarea v-bind="componentField" placeholder="如担心信息安全可私发给管理员" />
    </FormFieldItem>

    <DialogFooter>
      <Button
        type="submit"
        class="w-full"
        :disabled="!canSubmit || biliRegisterStatus !== 'matched'"
      >
        <Loader2 v-if="isLoading" class="animate-spin" />
        注册
      </Button>
    </DialogFooter>
  </form>
</template>
