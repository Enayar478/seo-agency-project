import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://votre-agence.com',
  integrations: [
    tailwind(),
  ],
}); 