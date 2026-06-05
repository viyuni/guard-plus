<script setup lang="ts">
import PointTypeCreateDialog from './PointTypeCreateDialog.vue';
import type { PointType } from './PointTypeListView.vue';
import PointTypeUpdateDialog from './PointTypeUpdateDialog.vue';

defineProps<{
  pointType?: PointType;
}>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <PointTypeUpdateDialog v-if="pointType" v-model:open="open" :point-type="pointType" />
  <PointTypeCreateDialog v-else v-model:open="open" />
</template>
