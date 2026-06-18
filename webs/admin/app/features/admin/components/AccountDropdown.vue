<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { KeyRound, LogOut, UserRound } from 'lucide-vue-next';

import { useAdminSession } from '../../auth';
import { useLogout } from '../../auth/mutations';
import AccountPasswordDialog from './AccountPasswordDialog.vue';
import AccountProfileDialog from './AccountProfileDialog.vue';

const { user } = useAdminSession();
const { mutate: logout } = useLogout();

const [openAccountProfileDialog] = useOverlay(AccountProfileDialog);
const [openAccountPasswordDialog] = useOverlay(AccountPasswordDialog);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="max-w-44 gap-2 px-2">
        <UserRound class="h-4 w-4 shrink-0" />
        <span class="truncate">{{ user?.username ?? '账户' }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-48">
      <DropdownMenuLabel>
        <div class="truncate">{{ user?.username ?? '账户' }}</div>
        <div class="text-muted-foreground truncate text-xs font-normal">
          {{ user?.uid ?? '-' }}
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem @click="openAccountProfileDialog">
        <UserRound />
        修改账户信息
      </DropdownMenuItem>

      <DropdownMenuItem @click="openAccountPasswordDialog">
        <KeyRound />
        修改账户密码
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem variant="destructive" @click="logout">
        <LogOut />
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
