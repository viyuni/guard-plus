<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import {
  MoreHorizontal,
  WalletCards,
  Coins,
  Ban,
  RotateCcw,
  KeyRound,
  Pencil,
} from 'lucide-vue-next';

import { useBanUser, useRestoreUser } from '../mutations';
import type { User } from '../types';
import AdjustUserPointsDialog from './AdjustUserPointsDialog.vue';
import EditUserDialog from './EditUserDialog.vue';
import ResetUserPasswordDialog from './ResetUserPasswordDialog.vue';
import UserPointAccountsDialog from './UserPointAccountsDialog.vue';

const props = defineProps<{
  user: User;
}>();

const { mutate: banUser, isLoading: isBanningUser } = useBanUser();
const { mutate: restoreUser, isLoading: isRestoringUser } = useRestoreUser();

const isBanned = computed(() => props.user.status === 'banned');
const [openAdjustUserPointsDialog] = useOverlay(AdjustUserPointsDialog);
const [openEditUserDialog] = useOverlay(EditUserDialog);
const [openResetUserPasswordDialog] = useOverlay(ResetUserPasswordDialog);
const [openUserPointAccountsDialog] = useOverlay(UserPointAccountsDialog);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">打开菜单</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-50">
      <DropdownMenuLabel>操作</DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="openEditUserDialog({ user })">
        <Pencil />
        编辑信息
      </DropdownMenuItem>

      <DropdownMenuItem @click="openAdjustUserPointsDialog({ user })" :disabled="isBanned">
        <Coins />
        操作积分
      </DropdownMenuItem>

      <DropdownMenuItem @click="openUserPointAccountsDialog({ user })">
        <WalletCards />
        查看积分账户
      </DropdownMenuItem>

      <DropdownMenuItem @click="openResetUserPasswordDialog({ user })">
        <KeyRound />
        重置密码
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem v-if="isBanned" :disabled="isRestoringUser" @click="restoreUser(user.id)">
        <RotateCcw />
        恢复
      </DropdownMenuItem>

      <DropdownMenuItem
        v-else
        variant="destructive"
        :disabled="isBanningUser"
        @click="banUser(user.id)"
      >
        <Ban />
        封禁
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
