export const basePackageExports = {
  '.': './src/index.ts',
  './nuxt': './nuxt/index.ts',
  './nuxt/components.json': './nuxt/components.json',
  './style.css': './src/style.css',
  './types': './types.d.ts',
  './components/*': './src/components/*',
  './lib/*': './src/lib/*',
} as const;
