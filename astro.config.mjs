import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  site: 'https://seo-data-agency.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [tailwind()]
}); 