<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { ArrowRight, Github } from 'lucide-vue-next';
import { createMarkdownExit } from 'markdown-exit';

import { useAdminSession } from '~/features/auth';

import changeLog from '../../../../CHANGELOG.md?raw';
import { version } from '../../../../package.json';

const md = createMarkdownExit();
const changeLogContent = md.render(changeLog);

const { authenticated } = useAdminSession();
</script>

<template>
  <div class="grid min-h-dvh w-full grid-rows-[auto_1fr]">
    <div
      class="border-base-300 container mx-auto flex items-center justify-between border-x border-b px-5 py-4 sm:px-8"
    >
      <div class="flex gap-2 select-none">
        <AppLogo />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-muted-foreground text-sm font-medium select-none"> v{{ version }} </span>

        <Button as-child variant="ghost" size="icon-sm" class="rounded-full" aria-label="GitHub">
          <a href="https://github.com/viyuni/guard-plus" target="_blank" rel="noreferrer">
            <Github />
          </a>
        </Button>

        <ThemeToggle />
      </div>
    </div>
    <main class="border-base-300 container mx-auto border-x">
      <section
        class="grid items-center gap-10 px-5 py-12 sm:px-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_minmax(260px,40%)] lg:py-20"
      >
        <div class="max-w-3xl">
          <a class="text-muted-foreground flex items-center gap-2 text-xs tracking-wide">
            BY <img class="h-2.5" src="https://assets.viyuni.top/viyuni-light.svg" />
          </a>

          <h1 class="mt-8 max-w-2xl text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
            欢迎使用
            <br />
            Guard Plus
          </h1>

          <p class="text-muted-foreground mt-6 max-w-lg text-lg leading-8">
            管理商品、订单与舰长积分，让权益发放保持清晰、稳定和高效。
          </p>

          <div class="mt-12 flex flex-wrap items-center gap-3">
            <Button v-if="authenticated" as-child size="lg" class="px-5">
              <NuxtLink to="/app">
                进入控制台
                <ArrowRight data-icon="inline-end" />
              </NuxtLink>
            </Button>
            <Button v-else as-child variant="outline" size="lg" class="px-5">
              <NuxtLink to="/login">管理员登录</NuxtLink>
            </Button>
          </div>
        </div>

        <div class="relative hidden items-center justify-center overflow-hidden py-8 md:flex">
          <MiShengHead class="relative z-10 w-64 drop-shadow-2xl lg:w-80" />
        </div>
      </section>

      <section class="border-base-300 border-t px-5 py-8 sm:px-8">
        <h2 class="text-xl font-semibold">更新日志</h2>

        <div class="changelog" v-html="changeLogContent" />
      </section>
    </main>

    <FluidCursor class="z-[-1] opacity-50" />
  </div>
</template>
