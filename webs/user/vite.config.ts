import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'nuxt build',
      },
      dev: {
        command: 'nuxt dev',
      },
      generate: {
        command: 'nuxt generate',
      },
      preview: {
        command: 'nuxt preview',
      },
      postinstall: {
        command: 'nuxt prepare',
      },
      typecheck: {
        command: 'nuxt typecheck',
      },
    },
  },
});
