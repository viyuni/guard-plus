<script setup lang="ts">
defineSlots<{
  default?: () => unknown;
  actions?: () => unknown;
}>();
</script>

<template>
  <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div v-if="$slots.default" class="flex w-full flex-wrap items-center gap-2">
      <slot />
    </div>

    <div
      v-if="$slots.actions"
      class="flex w-full shrink-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
