<script setup lang="ts">
import AdminCreateDialog from './AdminCreateDialog.vue';
import type { Admin } from './AdminListView.vue';
import AdminUpdateDialog from './AdminUpdateDialog.vue';

defineProps<{
  admin?: Admin;
}>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <AdminUpdateDialog v-if="admin" v-model:open="open" :admin="admin" />
  <AdminCreateDialog v-else v-model:open="open" />
</template>
