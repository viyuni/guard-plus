<script lang="ts">
import type { Treaty } from '@elysia/eden';
import type { AdminPageQuery } from '@shared/schema/admin';
import type { ColumnDef } from '@tanstack/vue-table';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { DataTable } from '@web/ui/components/ui/table';
import { Ban, KeyRound, MoreHorizontal, Pencil, Plus, RotateCcw } from 'lucide-vue-next';

import type { AdminApi } from '~/plugins/api';

import { useBanAdmin, useRestoreAdmin } from '../mutations';
import { adminPageQuery } from '../queries';
import AdminDialog from './AdminDialog.vue';
import ResetAdminPasswordDialog from './ResetAdminPasswordDialog.vue';

export type AdminListPage = Treaty.Data<AdminApi['admin']['get']>;
export type Admin = NonNullable<AdminListPage>['items'][number];
</script>

<script setup lang="ts">
const columns = [
  { accessorKey: 'uid', header: 'UID' },
  { accessorKey: 'username', header: '用户名' },
  { accessorKey: 'role', header: '角色' },
  { accessorKey: 'status', header: '状态' },
  { accessorKey: 'lastLoginAt', header: '最后登录' },
  { accessorKey: 'remark', header: '备注' },
  { id: 'actions', enableHiding: false },
] satisfies ColumnDef<Admin>[];

const {
  stateRefs: { page, pageSize },
  query,
} = useDebouncedPageQuery<AdminPageQuery>();

const {
  items: admins,
  meta: adminMeta,
  isLoading: isTableLoading,
} = usePageQuery(() => adminPageQuery(query.value));
const [openAdminDialog] = useOverlay(AdminDialog);
const [openResetAdminPasswordDialog] = useOverlay(ResetAdminPasswordDialog);
const { mutate: banAdmin, isLoading: isBanning } = useBanAdmin();
const { mutate: restoreAdmin, isLoading: isRestoring } = useRestoreAdmin();

const isUpdatingStatus = computed(() => isBanning.value || isRestoring.value);
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="admins"
    :columns="columns"
    :total="adminMeta?.total"
    :page-size="pageSize"
    :loading="isTableLoading"
  >
    <template #toolbar>
      <DataTableToolbar>
        <template #actions>
          <Button @click="openAdminDialog()">
            <Plus />
            添加管理员
          </Button>
        </template>
      </DataTableToolbar>
    </template>

    <template #role="{ value }">
      <Badge size="sm" variant="secondary">{{
        value === 'superAdmin' ? '超级管理员' : '管理员'
      }}</Badge>
    </template>

    <template #status="{ value }">
      <Badge size="sm" :variant="value === 'active' ? 'outline' : 'destructive'">
        {{ value === 'active' ? '正常' : '封禁' }}
      </Badge>
    </template>

    <template #lastLoginAt="{ value }">
      {{ value ? new Date(value).toLocaleString() : '-' }}
    </template>

    <template #actions="{ rowData }">
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
          <DropdownMenuItem @click="openAdminDialog({ admin: rowData })">
            <Pencil />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem @click="openResetAdminPasswordDialog({ admin: rowData })">
            <KeyRound />
            重置密码
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-if="rowData.status === 'banned'"
            :disabled="isUpdatingStatus || rowData.role === 'superAdmin'"
            @click="restoreAdmin(rowData.id)"
          >
            <RotateCcw />
            恢复
          </DropdownMenuItem>
          <DropdownMenuItem
            v-else
            variant="destructive"
            :disabled="isUpdatingStatus || rowData.role === 'superAdmin'"
            @click="banAdmin(rowData.id)"
          >
            <Ban />
            封禁
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </DataTable>
</template>
