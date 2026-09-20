import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: 'nuxt dev',
      },
      generate: {
        command: 'nuxt generate',
      },
      preview: {
        command: 'nuxt preview',
      },
      typecheck: {
        command: 'nuxt typecheck',
        input: [{ auto: true }, '!**/*.tsbuildinfo', '!.nuxt/**'],
      },
    },
  },
});
