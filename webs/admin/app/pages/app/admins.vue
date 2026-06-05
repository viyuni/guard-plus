<script lang="ts">
import { AdminListView } from '~/features/admin';
import { useAuthStore } from '~/features/auth/store';
</script>

<script setup lang="ts">
definePageMeta({ title: '管理员管理' });

const { user } = storeToRefs(useAuthStore());

watchEffect(() => {
  if (user.value && user.value.role !== 'superAdmin') {
    navigateTo('/app/users', { replace: true });
  }
});
</script>

<template>
  <AdminListView v-if="user?.role === 'superAdmin'" />
</template>
