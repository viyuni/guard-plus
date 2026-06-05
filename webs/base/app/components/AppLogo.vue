<script setup lang="ts">
import { useTheme } from '@web/ui/components/ui/theme-toggle';

const { width = 120 } = defineProps<{
  width?: number | string;
}>();

const { isDark } = useTheme();
</script>

<template>
  <span class="inline-flex">
    <img
      :width
      class="select-none"
      draggable="false"
      :src="
        isDark
          ? 'https://assets.viyuni.top/guard-plus-dark.svg'
          : 'https://assets.viyuni.top/guard-plus-light.svg'
      "
      alt="Viyuni Logo"
    />
  </span>
</template>
