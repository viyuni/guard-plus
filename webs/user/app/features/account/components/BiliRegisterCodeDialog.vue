<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@web/ui/components/ui/dialog';
import { Copy, ExternalLink, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useConfirmBiliRegisterCode, useCreateBiliRegisterCode } from '../mutations';

export type BiliRegisterStatus = 'idle' | 'pending' | 'matched' | 'expired';

const FRONTEND_CODE_TTL_MILLISECONDS = 3 * 60 * 1000;

const props = defineProps<{
  biliUid: string;
}>();

const emit = defineEmits<{
  matched: [biliUser: { uid: string; name?: string | null }];
}>();

const status = defineModel<BiliRegisterStatus>('status', { default: 'idle' });

const biliRoomId = ref<number>();
const biliRoomUrl = computed(() =>
  biliRoomId.value ? `https://live.bilibili.com/${biliRoomId.value}` : undefined,
);
const code = ref<string>();
const expiresAt = ref<string>();
const remainingSeconds = ref(0);
const open = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | undefined;
const createMutation = useCreateBiliRegisterCode();
const confirmMutation = useConfirmBiliRegisterCode();
const { isLoading: isCreating } = createMutation;
const { isLoading: isConfirming } = confirmMutation;

const remainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function expireCode() {
  stopCountdown();
  remainingSeconds.value = 0;
  status.value = 'expired';
}

function updateCountdown() {
  if (!expiresAt.value) {
    remainingSeconds.value = 0;
    return;
  }

  const remainingMilliseconds = new Date(expiresAt.value).getTime() - Date.now();
  remainingSeconds.value = Math.max(0, Math.ceil(remainingMilliseconds / 1000));

  if (remainingSeconds.value === 0) {
    expireCode();
  }
}

function startCountdown(serverExpiresAt: string) {
  stopCountdown();
  expiresAt.value = new Date(
    Math.min(new Date(serverExpiresAt).getTime(), Date.now() + FRONTEND_CODE_TTL_MILLISECONDS),
  ).toISOString();
  updateCountdown();

  if (remainingSeconds.value > 0) {
    countdownTimer = setInterval(updateCountdown, 1000);
  }
}

async function createCode() {
  if (!props.biliUid) {
    toast.error('请先输入 B 站 UID');
    return;
  }

  try {
    const { data } = await createMutation.mutateAsync();

    if (!data) {
      toast.error('生成注册码失败');
      return;
    }

    code.value = data.code;
    biliRoomId.value = data.roomId;
    status.value = 'pending';
    startCountdown(data.expiresAt);
    open.value = true;
  } catch {
    // The global mutation handler reports request errors.
  }
}

async function confirmCode() {
  if (!code.value) return;

  try {
    const data = await confirmMutation.mutateAsync({
      biliUid: props.biliUid,
    });

    status.value = data.status;
    biliRoomId.value = data.roomId;

    if (data.status === 'expired') {
      expireCode();
      return;
    }

    if (data.status === 'matched' && data.biliUser.uid === props.biliUid) {
      emit('matched', data.biliUser);
      open.value = false;
    }
  } catch {
    // The global mutation handler reports request errors.
  }
}

async function copyCode() {
  if (!code.value) return;

  try {
    await navigator.clipboard.writeText(code.value);
    toast.success('验证码已复制');
  } catch {
    toast.error('复制验证码失败');
  }
}

function reset() {
  stopCountdown();
  code.value = undefined;
  expiresAt.value = undefined;
  remainingSeconds.value = 0;
  status.value = 'idle';
  open.value = false;
}

onBeforeUnmount(stopCountdown);

defineExpose({
  reset,
});
</script>

<template>
  <slot :create-code="createCode" :is-creating="isCreating" :status="status" />

  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>验证 UID 归属</DialogTitle>
        <DialogDescription>
          请使用 UID {{ biliUid }} 在直播间发送以下验证码，然后点击确认。
          <a
            v-if="biliRoomUrl"
            :href="biliRoomUrl"
            target="_blank"
            rel="noreferrer"
            class="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-2"
          >
            前往直播间
            <ExternalLink class="size-3" />
          </a>
        </DialogDescription>
      </DialogHeader>

      <div class="bg-muted flex items-center gap-2 rounded-md py-2 pr-2 pl-3">
        <strong class="min-w-0 flex-1 text-center font-mono text-lg">
          {{ code }}
        </strong>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="复制验证码"
          @click="copyCode"
        >
          <Copy />
        </Button>
      </div>

      <p v-if="status === 'expired'" class="text-destructive text-sm">验证码已失效，请重新获取。</p>
      <p v-else class="text-muted-foreground text-sm">验证码将在 {{ remainingTime }} 后过期。</p>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          :disabled="isCreating || isConfirming"
          @click="createCode"
        >
          <Loader2 v-if="isCreating" class="animate-spin" />
          重新获取
        </Button>
        <Button
          type="button"
          :disabled="isCreating || isConfirming || status === 'expired'"
          @click="confirmCode"
        >
          <Loader2 v-if="isConfirming" class="animate-spin" />
          确认验证
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
