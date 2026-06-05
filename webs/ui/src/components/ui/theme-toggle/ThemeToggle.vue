<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';
import { Button } from '@web/ui/components/ui/button';
import { Moon, Sun } from 'lucide-vue-next';

import { useTheme } from './useTheme';

const { isDark } = useTheme();

const toggleDark = useToggle(isDark);
</script>

<template>
  <Button @click="toggleDark()" variant="ghost" size="icon-sm" class="rounded-full">
    <Sun v-if="isDark"></Sun>
    <Moon v-else></Moon>
  </Button>
</template>
