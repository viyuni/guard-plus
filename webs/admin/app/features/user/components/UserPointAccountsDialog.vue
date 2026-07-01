<script setup lang="ts">
import type { User } from '../types';

const props = defineProps<{
  user: User;
}>();

const open = defineModel<boolean>('open', { default: true });

const pointBalanceFormat = new Intl.NumberFormat('zh-CN');

function formatPointBalance(balance: number | string) {
  return pointBalanceFormat.format(Number(balance));
}

function getPointAccountName(pointAccount: User['pointAccounts'][number]) {
  return pointAccount.pointType?.name ?? '未知积分';
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>积分账户</DialogTitle>
        <DialogDescription>{{ user.username }}（UID：{{ user.biliUid }}）</DialogDescription>
      </DialogHeader>

      <div v-if="user.pointAccounts.length" class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="pointAccount in user.pointAccounts"
          :key="pointAccount.id"
          class="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
        >
          <div class="min-w-0 truncate">
            {{ getPointAccountName(pointAccount) }}
          </div>
          <div class="shrink-0 font-mono text-sm font-semibold tabular-nums">
            {{ formatPointBalance(pointAccount.balance) }}
          </div>
        </div>
      </div>
      <div v-else class="text-muted-foreground py-6 text-center text-sm">暂无积分账户</div>
    </DialogContent>
  </Dialog>
</template>
