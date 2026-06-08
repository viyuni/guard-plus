import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      typecheck: {
        command: 'golar typecheck',
        input: [{ auto: true }, '!**/*.tsbuildinfo', '!.nuxt/**'],
      },
    },
  },
});
