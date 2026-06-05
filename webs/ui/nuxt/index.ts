import { addComponent, defineNuxtModule } from '@nuxt/kit';

import components from './components.json' with { type: 'json' };

export default defineNuxtModule({
  meta: {
    name: '@web/ui/nuxt',
  },
  setup() {
    for (const [name, filePath] of Object.entries(components)) {
      addComponent({ name, export: name, filePath });
    }
  },
});
