<script lang="ts">
import { AdminListView } from '~/features/admin';
import { useAdminSession } from '~/features/auth';
</script>

<script setup lang="ts">
definePageMeta({ title: '管理员管理' });

const { user } = useAdminSession();

watchEffect(() => {
  if (user.value && user.value.role !== 'superAdmin') {
    navigateTo('/app/users', { replace: true });
  }
});
</script>

<template>
  <AdminListView v-if="user?.role === 'superAdmin'" />
</template>
