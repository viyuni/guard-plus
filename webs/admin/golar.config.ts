import { defineConfig } from 'golar/unstable';
import '@golar/vue';

export default defineConfig({
  typecheck: {
    include: ['**/*.{ts,vue}'],
    exclude: ['**/.output', '**/dist'],
  },
});
