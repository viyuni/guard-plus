import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      typecheck: {
        command: 'tsc --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
    },
  },
});
