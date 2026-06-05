<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { cn } from '@web/ui/lib/utils';
import { PanelLeftIcon } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';

import { useSidebar } from './utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon-sm"
    :class="cn('', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeftIcon class="cn-rtl-flip" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
