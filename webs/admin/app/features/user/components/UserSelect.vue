<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { Button } from '@web/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/ui/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/ui/components/ui/popover';
import { cn } from '@web/ui/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';

import { userPageQuery } from '../queries';

const props = withDefaults(
  defineProps<{
    ariaInvalid?: boolean;
    class?: HTMLAttributes['class'];
    id?: string;
    pageSize?: number;
    placeholder?: string;
  }>(),
  {
    pageSize: 50,
    placeholder: '选择用户',
  },
);

const model = defineModel<string>({ default: '' });

const open = ref(false);
const keyword = ref('');
const page = ref(1);
const debouncedKeyword = refDebounced(keyword, 150);
const query = computed(() => ({
  keyword: debouncedKeyword.value.trim() || undefined,
  page: page.value,
  pageSize: props.pageSize,
  status: 'active' as const,
}));

const { data } = useQuery(() => userPageQuery(query.value));

const users = computed(() => data.value?.items ?? []);
const meta = computed(() => data.value?.meta);
const selectedUser = computed(() => users.value.find(user => user.id === model.value));
const selectedUserLabel = computed(() =>
  selectedUser.value ? `${selectedUser.value.biliUid} - ${selectedUser.value.username}` : undefined,
);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((meta.value?.total ?? 0) / (meta.value?.pageSize ?? props.pageSize))),
);

function selectUser(userId: string) {
  model.value = userId;
  open.value = false;
}

function goPreviousPage() {
  page.value = Math.max(1, page.value - 1);
}

function goNextPage() {
  page.value = Math.min(totalPages.value, page.value + 1);
}

watch(debouncedKeyword, () => {
  page.value = 1;
});

defineExpose({
  reset() {
    open.value = false;
    keyword.value = '';
    page.value = 1;
  },
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        :id="id"
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :aria-invalid="ariaInvalid"
        :class="cn('w-full justify-between font-normal', props.class)"
      >
        <span class="truncate">{{ selectedUserLabel ?? placeholder }}</span>
        <ChevronsUpDown class="text-muted-foreground opacity-60" />
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
      <Command v-model:search-term="keyword" :filter-function="() => true">
        <CommandInput placeholder="搜索 UID / 用户名" />
        <CommandList>
          <CommandEmpty>没有找到用户</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="user in users"
              :key="user.id"
              :value="`${user.biliUid} ${user.username}`"
              @select="selectUser(user.id)"
            >
              <Check :class="cn('mr-2 size-4', model === user.id ? 'opacity-100' : 'opacity-0')" />
              {{ user.biliUid }} - {{ user.username }}
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div class="border-border flex items-center justify-between gap-2 border-t p-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            :disabled="page <= 1"
            @click="goPreviousPage"
          >
            上一页
          </Button>
          <span class="text-muted-foreground text-sm">{{ page }} / {{ totalPages }}</span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            :disabled="page >= totalPages"
            @click="goNextPage"
          >
            下一页
          </Button>
        </div>
      </Command>
    </PopoverContent>
  </Popover>
</template>
