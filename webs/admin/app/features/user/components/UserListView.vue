<script lang="ts">
import type { UserPageQuery } from '@shared/schema/user';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { UserPlus } from 'lucide-vue-next';

import { userPageQuery } from '../queries';
import type { User } from '../types';
import CreateUserDialog from './CreateUserDialog.vue';
import UserActionsDropdown from './UserActionsDropdown.vue';
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'biliUid', header: 'UID' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'email', header: '邮箱' },
  { accessorKey: 'phone', header: '手机号' },
  { accessorKey: 'address', header: '地址' },
  { id: 'points' as const, header: '积分' },
  { accessorKey: 'status', header: '状态' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<User>[];

const userStatusOptions = [
  { label: '正常', value: 'active' },
  { label: '封禁', value: 'banned' },
] as const;

const {
  stateRefs: { page, pageSize, keyword, status },
  query,
} = useDebouncedPageQuery<UserPageQuery>({
  status: undefined,
});

const [handleCreateUser] = useOverlay(CreateUserDialog);
const { items: users, meta: userMeta } = usePageQuery(() => userPageQuery(query.value));

const pointBalanceFormat = new Intl.NumberFormat('zh-CN');

function formatPointBalance(balance: number | string) {
  return pointBalanceFormat.format(Number(balance));
}

function getPointAccountName(pointAccount: User['pointAccounts'][number]) {
  return pointAccount.pointType?.name ?? '未知积分';
}
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="users"
    :columns="columns"
    :total="userMeta?.total"
    :page-size="pageSize"
  >
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2">
        <Input class="max-w-xs" placeholder="搜索用户名 / UID" v-model:model-value.trim="keyword" />

        <NativeSelect v-model:model-value="status">
          <NativeSelectOption value="">选择用户状态</NativeSelectOption>
          <NativeSelectOption
            v-for="option in userStatusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </NativeSelectOption>
        </NativeSelect>

        <Button class="ml-auto" @click="handleCreateUser">
          <UserPlus />
          添加用户
        </Button>
      </div>
    </template>

    <template #username="{ value }">
      <div class="capitalize">{{ value }}</div>
    </template>

    <template #status="{ value }">
      <Badge
        class="text-xs uppercase"
        size="sm"
        :variant="value === 'active' ? 'outline' : 'destructive'"
      >
        {{ value === 'active' ? '正常' : '封禁' }}
      </Badge>
    </template>

    <template #actions="{ row }">
      <UserActionsDropdown :user="row.original" @view-point-accounts="row.toggleExpanded()" />
    </template>

    <template #expanded="{ rowData }">
      <div class="bg-muted/30 px-4 py-3">
        <div v-if="rowData.pointAccounts.length" class="space-y-3">
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="pointAccount in rowData.pointAccounts"
              :key="pointAccount.id"
              class="border-border bg-background flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div class="min-w-0">
                {{ getPointAccountName(pointAccount) }}
              </div>
              <div class="font-mono text-sm font-semibold tabular-nums">
                {{ formatPointBalance(pointAccount.balance) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-muted-foreground py-4 text-center text-sm">暂无积分账户</div>
      </div>
    </template>
  </DataTable>
</template>
