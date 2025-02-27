import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  site: 'https://horizonreach.vercel.app',
  output: 'static',
  integrations: [
    tailwind()
  ],
  adapter: vercel()
}); 