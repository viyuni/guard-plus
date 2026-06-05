<script setup lang="ts">
import { cn } from '@web/ui/lib/utils';
import { Repeat2, WalletCards } from 'lucide-vue-next';

defineProps<{
  class?: string;
}>();

const emit = defineEmits<{
  login: [];
  openConversion: [];
}>();

const { balances, isAuthenticated, refreshUser } = useUser();
const hasPointAccounts = computed(() => balances.value.length > 0);
</script>

<template>
  <div
    v-if="isAuthenticated && hasPointAccounts"
    :class="
      cn(
        'border-border bg-card/78 inline-flex min-h-10 max-w-full items-center overflow-hidden rounded-2xl border px-4 py-1 backdrop-blur-xl',
        $props.class,
      )
    "
  >
    <div class="inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-3">
      <div
        v-if="balances?.length"
        class="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 rounded-md outline-none focus-visible:ring-[3px]"
        role="button"
        tabindex="0"
        @click="refreshUser"
        @keydown.enter="refreshUser"
        @keydown.space.prevent="refreshUser"
      >
        <WalletCards class="text-muted-foreground size-5" />
        <span v-for="account in balances" :key="account.id" class="flex items-baseline gap-2">
          <span class="text-muted-foreground truncate text-sm">
            {{ account.pointType?.name ?? '积分' }}
          </span>
          <span class="text-foreground text-lg font-semibold tracking-tight">
            {{ account.balance }}
          </span>
        </span>
      </div>

      <Button
        class="text-primary rounded-full"
        variant="ghost"
        size="sm"
        @click.stop="emit('openConversion')"
      >
        <Repeat2 class="size-4" />
        积分转换
      </Button>
    </div>
  </div>
</template>
