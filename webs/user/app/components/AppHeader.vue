<script setup lang="ts">
import { LogIn, WalletCards } from 'lucide-vue-next';

import { useUserSession } from '~/composables/useUserSession';
import { AccountDropdown, useLogout } from '~/features/account';

const emit = defineEmits<{
  editProfile: [];
  login: [];
  viewPoints: [];
  viewOrders: [];
  viewTransactions: [];
}>();

const logoutMutation = useLogout();
const { isLoading: isLoggingOut } = logoutMutation;
const { balances, isAuthenticated } = useUserSession();
const hasPointAccounts = computed(() => balances.value.length > 0);

async function logout() {
  try {
    await logoutMutation.mutateAsync();
  } catch {
    // The global mutation handler reports request errors.
  }
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-b-gray-200 bg-white/75 backdrop-blur">
    <div class="relative flex h-16 w-full items-center justify-end gap-4 px-5 md:px-8">
      <a class="absolute left-5 flex items-center gap-2 md:left-1/2 md:-translate-x-1/2" href="#">
        <MiShengHead class="w-9" />
        <span class="text-primary font-limelight block text-xl font-bold select-none">
          MiSheng Shop
        </span>
      </a>

      <div class="flex items-center justify-end gap-1">
        <Button v-if="!isAuthenticated" variant="quaternary" @click="emit('login')">
          <LogIn class="size-4" />
          <span>登录 / 注册</span>
        </Button>
        <Button
          v-if="isAuthenticated && hasPointAccounts"
          variant="quaternary"
          size="icon-sm"
          aria-label="查看积分"
          @click="emit('viewPoints')"
        >
          <WalletCards class="size-4" />
        </Button>
        <AccountDropdown
          v-if="isAuthenticated"
          :is-logging-out="isLoggingOut"
          @edit-profile="emit('editProfile')"
          @view-transactions="emit('viewTransactions')"
          @view-orders="emit('viewOrders')"
          @logout="logout"
        />
      </div>
    </div>
  </header>
</template>
