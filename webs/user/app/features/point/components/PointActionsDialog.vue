<script setup lang="ts">
import { History, RefreshCw, Repeat2 } from 'lucide-vue-next';

type PointActionsDialogAction = 'conversion' | 'transactions';

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  resolve: [action?: PointActionsDialogAction];
}>();

const { balances, refreshUser } = useUser();

async function refreshBalances() {
  await refreshUser();
}

function selectAction(action: PointActionsDialogAction) {
  emit('resolve', action);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>我的积分</DialogTitle>
        <DialogDescription>查看当前积分余额，或进入积分转换和流水记录。</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <button
            v-for="account in balances"
            :key="account.id"
            class="bg-muted/40 flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left"
            type="button"
            @click="refreshBalances"
          >
            <span class="text-muted-foreground min-w-0 truncate text-sm">
              {{ account.pointType?.name ?? '积分' }}
            </span>
            <span class="text-foreground text-lg font-semibold tracking-tight">
              {{ account.balance }}
            </span>
          </button>
        </div>

        <div class="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" class="self-start" @click="refreshBalances">
            <RefreshCw class="size-4" />
            刷新
          </Button>

          <div class="flex gap-2">
            <Button type="button" variant="outline" @click="selectAction('transactions')">
              <History class="size-4" />
              积分流水
            </Button>
            <Button type="button" @click="selectAction('conversion')">
              <Repeat2 class="size-4" />
              积分转换
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
