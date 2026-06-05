<script setup lang="ts">
import { Repeat2, WalletCards } from 'lucide-vue-next';
import { motion } from 'motion-v';

defineProps<{
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  expand: [];
  login: [];
  openConversion: [];
}>();

const { balances, isAuthenticated, refreshUser } = useUser();

const spring = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.8,
} as const;
</script>

<template>
  <motion.div
    v-if="isAuthenticated"
    layout
    class="border-border bg-card/78 inline-flex max-w-full items-center overflow-hidden border shadow-sm backdrop-blur-xl"
    :class="
      collapsed
        ? 'min-w-9 justify-center rounded-b-full border-t-0 px-1.5 pt-1 pb-1.5'
        : 'rounded-2xl px-4 py-1'
    "
    :animate="{
      minHeight: collapsed ? 36 : 40,
    }"
    :transition="spring"
  >
    <motion.button
      v-if="collapsed"
      layout
      class="text-primary hover:text-primary/80 focus-visible:border-ring focus-visible:ring-ring/50 flex size-5 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-[3px]"
      type="button"
      aria-label="展开积分条"
      :initial="false"
      :animate="{ opacity: 1, scale: 1 }"
      :transition="spring"
      @click="emit('expand')"
    >
      <WalletCards class="size-4.5" />
    </motion.button>

    <motion.div
      v-else
      layout
      class="inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-3"
      :initial="false"
      :animate="{ opacity: 1, scale: 1 }"
      :transition="spring"
    >
      <button
        v-if="balances?.length"
        class="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2"
        type="button"
        @click="refreshUser"
      >
        <WalletCards class="text-muted-foreground size-5" />
        <span v-for="account in balances" :key="account.id" class="flex items-baseline gap-2">
          <span class="text-muted-foreground truncate text-sm">
            {{ account.pointType?.name ?? '积分' }}
          </span>
          <span class="text-foreground text-xl font-semibold tracking-tight">
            {{ account.balance }}
          </span>
        </span>
      </button>

      <Button
        class="text-primary rounded-full"
        variant="ghost"
        size="sm"
        @click.stop="emit('openConversion')"
      >
        <Repeat2 class="size-4" />
        积分转换
      </Button>
    </motion.div>
  </motion.div>
</template>
