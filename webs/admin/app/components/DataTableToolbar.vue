<script setup lang="ts">
import { Comment, defineComponent, Fragment, isVNode } from 'vue';
import type { PropType, Slot, VNode } from 'vue';

const slots = defineSlots<{
  default?: () => VNode[];
  actions?: () => VNode[];
}>();

const SlotNode = defineComponent({
  props: {
    node: {
      type: Object as PropType<VNode>,
      required: true,
    },
  },
  setup: props => () => props.node,
});

function flattenNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap(node => {
    if (node.type === Comment) return [];

    if (node.type === Fragment && Array.isArray(node.children)) {
      return flattenNodes(node.children.filter(isVNode));
    }

    return node;
  });
}

function getSlotNodes(slot?: Slot) {
  return flattenNodes(slot?.() ?? []);
}
</script>

<template>
  <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div
      v-if="slots.default"
      class="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center"
    >
      <div
        v-for="(node, index) in getSlotNodes(slots.default)"
        :key="node.key ?? index"
        class="w-full min-w-0 *:w-full sm:w-auto sm:*:w-auto"
      >
        <SlotNode :node="node" />
      </div>
    </div>

    <div
      v-if="slots.actions"
      class="grid w-full shrink-0 grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end"
    >
      <div
        v-for="(node, index) in getSlotNodes(slots.actions)"
        :key="node.key ?? index"
        class="min-w-0 *:w-full only:col-start-2 sm:*:w-auto sm:only:col-start-auto"
      >
        <SlotNode :node="node" />
      </div>
    </div>
  </div>
</template>
