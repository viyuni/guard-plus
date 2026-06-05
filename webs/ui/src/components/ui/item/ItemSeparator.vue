<script setup lang="ts">
import { Separator } from '@web/ui/components/ui/separator';
import { cn } from '@web/ui/lib/utils';
import type { SeparatorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>();
</script>

<template>
  <Separator data-slot="item-separator" orientation="horizontal" :class="cn('my-2', props.class)" />
</template>
