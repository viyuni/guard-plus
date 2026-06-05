<script setup lang="ts">
import { computed } from 'vue';

import AccountDropdown from '~/features/admin/components/AccountDropdown.vue';

const route = useRoute();

const breadcrumbs = computed(() => {
  return route.matched
    .filter(item => item.meta.title)
    .map(item => ({
      title: item.meta.title as string,
      to: item.path,
    }));
});
</script>

<template>
  <SidebarProvider class="h-svh overflow-hidden">
    <AppSidebar />

    <SidebarInset class="min-h-0">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" class="my-auto mr-2 h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            <template v-for="(item, index) in breadcrumbs" :key="item.to">
              <BreadcrumbItem>
                <BreadcrumbPage v-if="index === breadcrumbs.length - 1">
                  {{ item.title }}
                </BreadcrumbPage>

                <BreadcrumbLink v-else as-child>
                  <NuxtLink :to="item.to">
                    {{ item.title }}
                  </NuxtLink>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" class="hidden md:block" />
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <div class="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AccountDropdown />
        </div>
      </header>

      <div class="min-h-0 w-full flex-1 overflow-auto p-5">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
