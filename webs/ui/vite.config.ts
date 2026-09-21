import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      check: {
        command: 'vp check',
      },
      typecheck: {
        cache: true,
        command: 'vue-tsc --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
      'generate:manifest': {
        cache: true,
        command: 'bun scripts/generateManifest.ts',
      },
    },
  },
});
