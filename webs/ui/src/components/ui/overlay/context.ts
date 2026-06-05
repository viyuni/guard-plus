import type { Component } from 'vue';
import { markRaw, reactive } from 'vue';

export interface OverlayItem {
  id: symbol;
  component: Component;
  props?: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export const overlayState = reactive({
  items: [] as OverlayItem[],
});

export function pushOverlay(item: OverlayItem) {
  overlayState.items.push({
    ...item,
    component: markRaw(item.component),
  });
}

export function removeOverlay(id: symbol) {
  const index = overlayState.items.findIndex(item => item.id === id);

  if (index !== -1) {
    overlayState.items.splice(index, 1);
  }
}
