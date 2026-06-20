// @ts-check
import { defineConfig } from 'astro/config';
import { execSync } from 'node:child_process';

import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';

const tailwindPlugins = /** @type {any} */ (tailwindcss());

const gitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
})();

// https://astro.build/config
export default defineConfig({
  server: {
    host: 'localhost',
    port: 4321,
  },
  vite: {
    define: {
      __BUILD_SHA__: JSON.stringify(gitSha),
    },
    server: {
      hmr: {
        host: 'localhost',
        clientPort: 4321,
        protocol: 'ws',
      },
    },
    optimizeDeps: {
      include: ['nspell'],
    },
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
    plugins: tailwindPlugins,
  },

  integrations: [svelte()],
});
