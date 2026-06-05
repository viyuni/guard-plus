<script setup lang="ts">
import RewardRuleCreateDialog from './RewardRuleCreateDialog.vue';
import type { RewardRule } from './RewardRuleListView.vue';
import RewardRuleUpdateDialog from './RewardRuleUpdateDialog.vue';

defineProps<{
  rule?: RewardRule;
}>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <RewardRuleUpdateDialog v-if="rule" v-model:open="open" :rule="rule" />
  <RewardRuleCreateDialog v-else v-model:open="open" />
</template>
