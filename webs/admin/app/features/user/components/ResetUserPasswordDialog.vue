<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useResetUserPassword } from '../mutations';
import type { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: resetPassword, isLoading: isResettingPassword } = useResetUserPassword();

const resetPasswordResult = ref('');

async function handleResetPassword() {
  const { data } = await resetPassword(props.user.id);

  if (data?.password) {
    resetPasswordResult.value = data.password;
  }
}

async function copyResetPassword() {
  if (resetPasswordResult.value) {
    await navigator.clipboard.writeText(resetPasswordResult.value);
  }
}

watch(open, isOpen => {
  if (!isOpen) {
    resetPasswordResult.value = '';
  }
});
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>重置用户密码</AlertDialogTitle>
        <AlertDialogDescription as-child>
          <div class="w-full space-y-3">
            <p>将为 {{ user.username }} 生成一个新密码，原密码会立即失效</p>
            <div
              v-if="resetPasswordResult"
              class="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm"
            >
              {{ resetPasswordResult }}
            </div>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isResettingPassword">
          {{ resetPasswordResult ? '关闭' : '取消' }}
        </AlertDialogCancel>
        <Button v-if="resetPasswordResult" type="button" @click="copyResetPassword">
          复制密码
        </Button>
        <Button v-else type="button" :disabled="isResettingPassword" @click="handleResetPassword">
          <Loader2 v-if="isResettingPassword" class="animate-spin" />
          确认重置
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
