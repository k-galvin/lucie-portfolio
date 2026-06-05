// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://luciegalvin.com',
  integrations: [
    sitemap({
      filter: (page) => page !== 'https://luciegalvin.com/admin/'
    })
  ]
});
