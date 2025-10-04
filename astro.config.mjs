// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@assets': new URL('./src/assets', import.meta.url).pathname,
        '@components': new URL('./src/components', import.meta.url).pathname,
        '@layouts': new URL('./src/layouts', import.meta.url).pathname,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
        '@scripts': new URL('./src/scripts', import.meta.url).pathname,
        '@styles': new URL('./src/styles', import.meta.url).pathname,
      },
    },
    plugins: [tailwindcss()],
  },

  integrations: [svelte()],
});
