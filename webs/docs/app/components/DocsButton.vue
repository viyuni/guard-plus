<script setup lang="ts">
defineProps<{
  to: string;
  variant?: 'default' | 'outline';
}>();
</script>

<template>
  <NuxtLink
    :to="to"
    :class="[
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
      variant === 'outline'
        ? 'hover:bg-accent border'
        : 'bg-primary text-primary-foreground hover:bg-primary/90',
    ]"
  >
    <slot />
  </NuxtLink>
</template>
