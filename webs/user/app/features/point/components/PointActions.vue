<script setup lang="ts">
import { Repeat2, WalletCards } from 'lucide-vue-next';

defineProps<{
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  expand: [];
  login: [];
  openConversion: [];
}>();

const { balances, isAuthenticated, refreshUser } = useUser();
</script>

<template>
  <div
    v-if="isAuthenticated"
    class="border-border bg-card/78 inline-flex max-w-full items-center overflow-hidden border backdrop-blur-xl transition-[border-radius,min-height,padding,box-shadow] duration-150 ease-out"
    :class="
      collapsed
        ? 'min-w-9 justify-center rounded-b-full border-t-0 px-1.5 pt-1 pb-1'
        : 'rounded-2xl px-4 py-1 shadow-sm'
    "
    :style="{ minHeight: collapsed ? '36px' : '40px' }"
  >
    <button
      v-if="collapsed"
      class="text-primary hover:text-primary/80 focus-visible:border-ring focus-visible:ring-ring/50 flex size-4 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px]"
      type="button"
      aria-label="展开积分条"
      @click="emit('expand')"
    >
      <WalletCards class="size-4" />
    </button>

    <div v-else class="inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-3">
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
