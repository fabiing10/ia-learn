// Deck build for one workshop. TALLER selects it (default x10):
//   npx vite                       → x10 deck (dev)
//   TALLER=vibecoding npx vite     → Vibe Coding deck (dev)
// `npm run build` builds every workshop through scripts/build.mjs.
import { defineConfig } from 'vite';
import { deckConfig } from './scripts/vite-deck.js';

export default defineConfig(deckConfig(process.env.TALLER || 'x10'));
