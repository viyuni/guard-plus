<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useResetAdminPassword } from '../mutations';
import type { Admin } from './AdminListView.vue';

const props = defineProps<{
  admin: Admin;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: resetAdminPassword, isLoading } = useResetAdminPassword();

const password = ref('');

async function handleResetPassword() {
  const { data } = await resetAdminPassword(props.admin.id);

  if (data) {
    password.value = data;
  }
}

async function copyPassword() {
  if (password.value) {
    await navigator.clipboard.writeText(password.value);
  }
}

watch(open, isOpen => {
  if (!isOpen) {
    password.value = '';
  }
});
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>重置管理员密码</AlertDialogTitle>
        <AlertDialogDescription as-child>
          <div class="w-full space-y-3">
            <p>将为 {{ admin.username }} 生成一个新密码，原密码会立即失效。</p>
            <div v-if="password" class="bg-muted rounded-md px-3 py-2 font-mono text-sm">
              {{ password }}
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isLoading">
          {{ password ? '关闭' : '取消' }}
        </AlertDialogCancel>
        <Button v-if="password" type="button" @click="copyPassword">复制密码</Button>
        <Button v-else type="button" :disabled="isLoading" @click="handleResetPassword">
          <Loader2 v-if="isLoading" class="animate-spin" />
          确认重置
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
