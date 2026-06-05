import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      check: {
        command: 'vp check',
      },
      typecheck: {
        command: 'vp exec vue-tsc --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
      'generate:manifest': {
        command: 'bun scripts/generateManifest.ts',
      },
    },
  },
});
