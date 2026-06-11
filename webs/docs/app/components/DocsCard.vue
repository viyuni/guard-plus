<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  icon?: string;
  variant?: 'default' | 'primary';
}>();

const IconComponent = computed(() => {
  if (!props.icon) return null;
  return (LucideIcons as Record<string, any>)[props.icon] ?? null;
});
</script>

<template>
  <div
    :class="[
      'rounded-lg border p-6 transition-colors',
      variant === 'primary' ? 'border-primary/30 bg-primary/5' : 'bg-card hover:border-primary/30',
    ]"
  >
    <h3 class="mb-2 flex items-center gap-2 text-base font-semibold">
      <component :is="IconComponent" v-if="IconComponent" class="text-primary size-5" />
      {{ title }}
    </h3>
    <div class="text-muted-foreground text-sm leading-relaxed">
      <slot />
    </div>
  </div>
</template>
