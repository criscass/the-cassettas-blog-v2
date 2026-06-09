// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';

import remarkImageCaptions from './src/lib/remark-image-captions.js';

// Astro 5 merged "hybrid" into `output: 'static'` (the default): pages are
// prerendered unless they opt out with `export const prerender = false`.
// That's what /api/**, /keystatic/** etc. will do once they exist.
export default defineConfig({
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: {
      prefixDefaultLocale: true,
      // Don't let i18n auto-redirect `/` to `/it/`. Our SSR `src/pages/index.astro`
      // owns `/` so it can pick the locale from the visitor's Accept-Language.
      redirectToDefaultLocale: false
    }
  },
  site: 'http://www.cassettas-reboot.xyz/',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), mdx(), sitemap(), pagefind(), keystatic()],
  adapter: vercel(),
  markdown: {
    remarkPlugins: [remarkImageCaptions],
    shikiConfig: {
      theme: 'css-variables'
    }
  }
});
