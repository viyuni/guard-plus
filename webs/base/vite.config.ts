import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      typecheck: {
        command: 'nuxt typecheck',
        input: [{ auto: true }, '!**/*.tsbuildinfo', '!.nuxt/**'],
      },
    },
  },
});
