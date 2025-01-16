import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://votre-agence.com',
  integrations: [
    tailwind(),
  ],
  output: 'server',
  adapter: vercel(),
}); 