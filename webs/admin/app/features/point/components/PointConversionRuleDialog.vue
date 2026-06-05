<script setup lang="ts">
import type { PointConversion } from './PointConversionListView.vue';
import PointConversionRuleCreateDialog from './PointConversionRuleCreateDialog.vue';
import PointConversionRuleUpdateDialog from './PointConversionRuleUpdateDialog.vue';

defineProps<{
  conversion?: PointConversion;
}>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <PointConversionRuleUpdateDialog v-if="conversion" v-model:open="open" :conversion="conversion" />
  <PointConversionRuleCreateDialog v-else v-model:open="open" />
</template>
