import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SLIDES_DIR = resolve(import.meta.dirname, 'src/slides');

// Inlines every src/slides/*.html file (alphabetical order) where index.html
// says <!-- @slides -->. One file per block keeps the deck editable.
function slideIncludes() {
  const render = () =>
    readdirSync(SLIDES_DIR)
      .filter((f) => f.endsWith('.html'))
      .sort()
      .map((f) => `\n<!-- ${f} -->\n` + readFileSync(resolve(SLIDES_DIR, f), 'utf8'))
      .join('\n');

  return {
    name: 'x10-slide-includes',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!-- @slides -->', render()),
    },
    configureServer(server) {
      server.watcher.add(SLIDES_DIR);
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(SLIDES_DIR)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [slideIncludes(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: 'es2020',
    // Everything (JS, CSS, fonts) is inlined into dist/index.html so the deck
    // opens with a double click, without a server and without internet.
    // Media in public/media is copied as plain files next to it.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    reportCompressedSize: false,
  },
  server: { port: 5173, open: false },
});
