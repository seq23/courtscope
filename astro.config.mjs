import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://courtscope.org',
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: false }, imageService: 'compile' }),
  security: { checkOrigin: true }
});
