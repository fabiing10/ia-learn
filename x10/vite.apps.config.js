// Web pages of one workshop (landing, playbook, test, panel…). TALLER selects it:
//   npx vite -c vite.apps.config.js                    → x10 pages (apps/)
//   TALLER=vibecoding npx vite -c vite.apps.config.js  → Vibe Coding pages
// Every index.html under the workshop's web root becomes a page at that path.
import { defineConfig } from 'vite';
import { webConfig } from './scripts/vite-deck.js';

export default defineConfig(webConfig(process.env.TALLER || 'x10'));
