import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { UPLOAD_TOTAL_MAX_BYTES } from './src/lib/fieldRules.ts';

// SITE_URL debe ser el origen público real en producción (p. ej.
// https://portal.grupocap.hn). Astro usa el Host/X-Forwarded-Host de cada
// request para calcular su origen, pero solo confía en ese encabezado si
// coincide con security.allowedDomains — de lo contrario cae a "localhost"
// y el chequeo de origen (CSRF) rechaza cualquier POST real con 403.
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const siteUrl = new URL(site);

export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    checkOrigin: true,
    // Por defecto Astro corta las acciones en 1 MB. Global a propósito (Astro no lo
    // permite por acción): los archivos de un guardado más 1 MB para los demás campos.
    actionBodySizeLimit: UPLOAD_TOTAL_MAX_BYTES + 1024 * 1024,
    allowedDomains: [
      {
        hostname: siteUrl.hostname,
        protocol: siteUrl.protocol.replace(':', ''),
        ...(siteUrl.port ? { port: siteUrl.port } : {}),
      },
    ],
  },
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
