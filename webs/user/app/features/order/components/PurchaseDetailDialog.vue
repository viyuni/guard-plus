<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';

const props = defineProps<{
  detail?: string | null;
  orderNo?: string | null;
}>();

const open = defineModel<boolean>('open', { required: true });

const detailParts = computed(() => {
  const detail = props.detail ?? '';
  const urlPattern = /(https?:\/\/[^\s<>"']+)/g;
  const parts: Array<{ type: 'text' | 'link'; value: string }> = [];
  let lastIndex = 0;

  for (const match of detail.matchAll(urlPattern)) {
    const index = match.index ?? 0;
    const value = match[0];

    if (index > lastIndex) {
      parts.push({ type: 'text', value: detail.slice(lastIndex, index) });
    }

    parts.push({ type: 'link', value });
    lastIndex = index + value.length;
  }

  if (lastIndex < detail.length) {
    parts.push({ type: 'text', value: detail.slice(lastIndex) });
  }

  return parts;
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>兑换信息</DialogTitle>
        <DialogDescription v-if="orderNo">订单号：{{ orderNo }}</DialogDescription>
      </DialogHeader>

      <div class="bg-muted max-h-[55vh] overflow-auto rounded-lg border p-4 text-sm">
        <p class="leading-6 wrap-break-word whitespace-pre-wrap">
          <template v-for="(part, index) in detailParts" :key="index">
            <a
              v-if="part.type === 'link'"
              :href="part.value"
              target="_blank"
              rel="noreferrer"
              class="text-primary inline-flex items-center gap-1 break-all underline underline-offset-2"
            >
              {{ part.value }}
              <ExternalLink class="size-3 shrink-0" />
            </a>
            <template v-else>{{ part.value }}</template>
          </template>
        </p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button">知道了</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
