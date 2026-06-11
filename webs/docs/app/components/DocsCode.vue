<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next';

const props = defineProps<{
  language?: string;
  label?: string;
  filename?: string;
  code?: string;
}>();

const preRef = ref<HTMLElement | null>(null);
const copied = ref(false);

async function copy() {
  const text = props.code || preRef.value?.textContent || '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // clipboard not available
  }
}

const displayLabel = computed(() => props.label || props.filename || props.language || 'code');
</script>

<template>
  <div class="overflow-hidden rounded-lg border">
    <div class="bg-muted/40 flex items-center justify-between border-b px-4 py-2 backdrop-blur-sm">
      <span class="text-muted-foreground text-xs font-medium">{{ displayLabel }}</span>
      <button
        class="hover:bg-background/50 rounded p-1 transition-colors"
        aria-label="Copy code"
        @click="copy"
      >
        <Check v-if="copied" class="size-3.5 text-green-500" />
        <Copy v-else class="text-muted-foreground size-3.5" />
      </button>
    </div>
    <div class="bg-background/30 overflow-x-auto backdrop-blur-sm">
      <pre ref="preRef" class="p-4 text-sm"><code><slot /></code></pre>
    </div>
  </div>
</template>
