import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';
import speedInsights from '@vercel/speed-insights/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://horizonreach.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [
    tailwind(),
    speedInsights()
  ]
}); 