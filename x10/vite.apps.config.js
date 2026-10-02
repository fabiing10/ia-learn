// Second build: the online companion pages served next to the deck.
//   /test      public profiling form (Supabase insert)
//   /panel     presenter dashboard (Supabase auth + realtime)
//   /playbook  take-home playbook
//   /          workshop landing (apps/index.html, assets in apps/home/)
// Every apps/<name>/index.html becomes dist/<name>/index.html.
import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, 'apps');
const input = Object.fromEntries(
  readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(root, d.name, 'index.html')))
    .map((d) => [d.name, resolve(root, d.name, 'index.html')]),
);
if (existsSync(resolve(root, 'index.html'))) input.home = resolve(root, 'index.html');

export default defineConfig({
  root,
  base: '/',
  envDir: import.meta.dirname,
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
    target: 'es2020',
    rollupOptions: { input },
  },
  server: { port: 5174, open: false },
});
