<script setup lang="ts">
import { FormFieldItem } from '@web/ui/components/ui/form';

defineProps<{
  showPassword?: boolean;
}>();
</script>

<template>
  <FormFieldItem v-slot="{ componentField }" name="username" label="用户名" required>
    <Input v-bind="componentField" placeholder="3-32 位用户名" />
  </FormFieldItem>

  <FormFieldItem
    v-if="showPassword"
    v-slot="{ componentField }"
    name="password"
    label="初始密码"
    required
  >
    <Input v-bind="componentField" type="password" placeholder="12-32 位，包含字母和数字" />
  </FormFieldItem>

  <FormFieldItem v-slot="{ componentField }" name="email" label="邮箱">
    <Input v-bind="componentField" type="email" placeholder="可选" />
  </FormFieldItem>

  <FormFieldItem v-slot="{ componentField }" name="phone" label="手机号">
    <Input v-bind="componentField" placeholder="可选" />
  </FormFieldItem>

  <FormFieldItem v-slot="{ componentField }" name="address" label="收货地址">
    <Input v-bind="componentField" placeholder="可选" />
  </FormFieldItem>
</template>
