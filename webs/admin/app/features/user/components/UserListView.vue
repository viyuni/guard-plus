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
const {
  items: users,
  meta: userMeta,
  isLoading: isTableLoading,
} = usePageQuery(() => userPageQuery(query.value));
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="users"
    :columns="columns"
    :total="userMeta?.total"
    :page-size="pageSize"
    :loading="isTableLoading"
  >
    <template #toolbar>
      <DataTableToolbar>
        <Input placeholder="搜索用户名 / UID" v-model:model-value.trim="keyword" />

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

        <template #actions>
          <Button @click="handleCreateUser">
            <UserPlus />
            添加用户
          </Button>
        </template>
      </DataTableToolbar>
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

    <template #actions="{ rowData }">
      <UserActionsDropdown :user="rowData" />
    </template>
  </DataTable>
</template>
