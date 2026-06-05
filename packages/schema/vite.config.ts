import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      typecheck: {
        command: 'tsgo --build',
        input: [{ auto: true }, '!**/*.tsbuildinfo'],
      },
    },
  },
});
