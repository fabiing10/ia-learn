// Vite config factories shared by every workshop.
//   deckConfig(slug)  one Reveal deck → a single self-contained index.html
//   webConfig(slug)   the workshop's web pages (landing, playbook, panel, …)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { tallerBySlug } from '../talleres.config.js';

export const ROOT = resolve(import.meta.dirname, '..');
const abs = (p) => resolve(ROOT, p);
// Root-relative import ids work the same in dev and build.
const rootId = (p) => '/' + relative(ROOT, abs(p)).split('\\').join('/');

export function getTaller(slug = process.env.TALLER || 'x10') {
  const t = tallerBySlug(slug);
  if (!t) throw new Error(`Taller desconocido: ${slug}`);
  return t;
}

const listFiles = (dir, ext) =>
  dir && existsSync(abs(dir)) ? readdirSync(abs(dir)).filter((f) => f.endsWith(ext)).sort() : [];

/**
 * Inlines the taller's slides where index.html says <!-- @slides -->, sets the
 * page title from config.titulo, and serves two virtual modules:
 *   virtual:deck              { config, qr }  data for src/js/core/config.js
 *   virtual:deck-controllers  side effects: the taller's own controllers + CSS
 */
function deckPlugin(t) {
  const { deck } = t;
  const slidesDir = abs(deck.slides);
  const readConfig = () => JSON.parse(readFileSync(abs(deck.config), 'utf8'));

  const renderSlides = () =>
    listFiles(deck.slides, '.html')
      .map((f) => `\n<!-- ${f} -->\n` + readFileSync(join(slidesDir, f), 'utf8'))
      .join('\n');

  const VIRTUAL = { data: 'virtual:deck', ctrl: 'virtual:deck-controllers' };

  return {
    name: 'taller-deck',
    resolveId(id) {
      if (id === VIRTUAL.data || id === VIRTUAL.ctrl) return '\0' + id;
    },
    load(id) {
      if (id === '\0' + VIRTUAL.data) {
        const qrs = listFiles(deck.qr, '.svg');
        return [
          `import config from '${rootId(deck.config)}';`,
          ...qrs.map((f, i) => `import qr${i} from '${rootId(join(deck.qr, f))}?raw';`),
          `export const qr = { ${qrs.map((f, i) => `${JSON.stringify(f.replace(/\.svg$/, ''))}: qr${i}`).join(', ')} };`,
          `export const taller = ${JSON.stringify(t.slug)};`,
          'export { config };',
        ].join('\n');
      }
      if (id === '\0' + VIRTUAL.ctrl) {
        const lines = listFiles(deck.js, '.js').map((f) => `import '${rootId(join(deck.js, f))}';`);
        if (deck.css && existsSync(abs(deck.css))) lines.push(`import '${rootId(deck.css)}';`);
        return lines.join('\n') || 'export {};';
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const { titulo } = readConfig();
        let out = html.replace('<!-- @slides -->', renderSlides());
        if (titulo) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${titulo}</title>`);
        return out;
      },
    },
    configureServer(server) {
      server.watcher.add([slidesDir, abs(deck.config)]);
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(slidesDir) || file === abs(deck.config)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export function deckConfig(slug) {
  const t = getTaller(slug);
  return {
    root: ROOT,
    base: './',
    envDir: ROOT,
    publicDir: t.deck.public ? abs(t.deck.public) : false,
    resolve: { alias: { '@engine': abs('src/js') } },
    plugins: [deckPlugin(t), viteSingleFile({ removeViteModuleLoader: true })],
    build: {
      outDir: abs(t.deck.out),
      emptyOutDir: true,
      target: 'es2020',
      // Everything (JS, CSS, fonts) is inlined into index.html so the deck opens
      // with a double click, without a server and without internet.
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 4000,
      reportCompressedSize: false,
    },
    server: { port: 5173, open: false },
  };
}

/** Every index.html under the web root becomes a page at the same path. */
function pagesUnder(dir, base = dir, out = {}) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pagesUnder(full, base, out);
    else if (entry === 'index.html') {
      const rel = relative(base, dir).split('\\').join('/');
      out[rel || 'home'] = full;
    }
  }
  return out;
}

/**
 * One web page as a single self-contained HTML file in <web.out>/offline/:
 * JS, CSS and fonts inlined, so it opens from a USB stick without network.
 */
export function offlineConfig(slug, page) {
  const t = getTaller(slug);
  const root = abs(t.web.root);
  return {
    root,
    base: './',
    envDir: ROOT,
    publicDir: false,
    resolve: { alias: { '@platform': ROOT, '@engine': abs('src/js') } },
    plugins: [viteSingleFile({ removeViteModuleLoader: true })],
    build: {
      outDir: abs(join(t.web.out, 'offline')),
      emptyOutDir: true,
      target: 'es2020',
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
      reportCompressedSize: false,
      rollupOptions: { input: { offline: join(root, page) } },
    },
  };
}

export function webConfig(slug) {
  const t = getTaller(slug);
  const root = abs(t.web.root);
  return {
    root,
    base: t.web.base,
    envDir: ROOT,
    publicDir: false,
    resolve: { alias: { '@platform': ROOT, '@engine': abs('src/js') } },
    build: {
      outDir: abs(t.web.out),
      emptyOutDir: false,
      target: 'es2020',
      rollupOptions: { input: pagesUnder(root) },
    },
    server: { port: 5174, open: false, fs: { allow: [ROOT] } },
  };
}
