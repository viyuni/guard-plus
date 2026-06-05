<script setup lang="ts">
import { overlayState, removeOverlay } from './context';

function resolveOverlay(id: symbol, value?: unknown) {
  const item = overlayState.items.find(item => item.id === id);

  if (!item) {
    return;
  }

  item.resolve(value);
  removeOverlay(id);
}

function rejectOverlay(id: symbol, reason?: unknown) {
  const item = overlayState.items.find(item => item.id === id);

  if (!item) {
    return;
  }

  item.reject(reason);
  removeOverlay(id);
}

function getControlledProps(id: symbol) {
  return {
    open: true,
    'onUpdate:open': (value: boolean) => {
      if (!value) {
        resolveOverlay(id);
      }
    },
  };
}
</script>

<template>
  <component
    :is="item.component"
    v-for="item in overlayState.items"
    :key="item.id"
    v-bind="{ ...item.props, ...getControlledProps(item.id) }"
    @resolve="resolveOverlay(item.id, $event)"
    @reject="rejectOverlay(item.id, $event)"
  />
</template>
