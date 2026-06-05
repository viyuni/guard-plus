<script lang="ts" setup>
import { cn } from '@web/ui/lib/utils';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
  XIcon,
  XCircle,
} from 'lucide-vue-next';
import type { ToasterProps } from 'vue-sonner';
import { Toaster as Sonner } from 'vue-sonner';

const props = defineProps<ToasterProps>();
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="{
      ...props,
      position: 'top-center',
      toastOptions: {
        classes: {
          toast: 'rounded-2xl',
        },
      },
    }"
  >
    <template #success-icon>
      <CircleCheckIcon class="text-success size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="text-info size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="text-warning size-4" />
    </template>
    <template #error-icon>
      <XCircle class="text-error size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>
