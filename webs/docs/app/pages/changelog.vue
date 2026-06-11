<script setup lang="ts">
import { createMarkdownExit } from 'markdown-exit';

import changeLog from '../../../../CHANGELOG.md?raw';

const md = createMarkdownExit();
const changeLogContent = md.render(changeLog);
</script>

<template>
  <DocsLayout>
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Changelog</h1>
    <div class="markdown mt-6" v-html="changeLogContent" />
  </DocsLayout>
</template>
