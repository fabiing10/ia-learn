// x10 — entry point. Reveal.js drives navigation, notes and PDF;
// GSAP animates on Reveal events; Three.js paints the background only.
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';

import 'reveal.js/dist/reveal.css';
import './styles/tokens.css';
import './styles/theme-dark.css';
import './styles/theme-light.css';
import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';

import { state, onModeChange, watchReducedMotion } from './js/core/state.js';
import { applyConfig } from './js/core/config.js';
import { createNavPlugin } from './js/core/nav.js';
import { mountHud } from './js/core/hud.js';
import { buildSlides, initSlides, printSlide, fragmentsChanged, enterSlide } from './js/core/motion.js';
import { fx } from './js/core/fxhub.js';
import { createTransitions } from './js/core/transitions.js';
import { createBackground } from './js/fx/background.js';

// Slide controllers register themselves (data-ctrl="…")
import.meta.glob('./js/slides/*.js', { eager: true });

const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

async function boot() {
  applyConfig();
  buildSlides();
  await fontsReady();

  const deck = new Reveal(document.querySelector('.reveal'), {
    width: 1920,
    height: 1080,
    margin: 0,
    minScale: 0.05,
    maxScale: 4,
    center: false,
    // Every slide is a flex column; layouts that need grid use an inner wrapper.
    display: 'flex',
    hash: true,
    respondToHashChanges: true,
    fragmentInURL: true,
    controls: false,
    progress: false,
    slideNumber: false,
    transition: 'none',
    backgroundTransition: 'none',
    viewDistance: 3,
    mobileViewDistance: 2,
    preloadIframes: false,
    jumpToSlide: true,
    hideCursorTime: 2500,
    pdfSeparateFragments: false,
    pdfMaxPagesPerSlide: 1,
    showNotes: false,
    plugins: [RevealNotes, createNavPlugin()],
  });

  await deck.initialize();

  const slides = [...document.querySelectorAll('.reveal .slides section:not(.stack)')];
  mountHud(document.querySelector('.reveal .slides'));
  initSlides(slides);

  if (state.print) {
    slides.forEach(printSlide);
    return;
  }

  let bg = null;
  const ensureBg = () => {
    if (bg || state.lite) return bg;
    bg = createBackground(document.getElementById('gl'));
    bg?.setTheme(state.theme);
    fx.bg = bg;
    return bg;
  };
  ensureBg();
  bg?.start();

  const transitions = createTransitions(deck, () => bg);

  deck.on('slidechanged', transitions.onChange);
  deck.on('fragmentshown', (e) => fragmentsChanged(deck.getCurrentSlide(), e.fragments, true));
  deck.on('fragmenthidden', (e) => fragmentsChanged(deck.getCurrentSlide(), e.fragments, false));

  let wasLite = state.lite;
  onModeChange(() => {
    bg?.setTheme(state.theme);
    if (state.lite === wasLite) return;
    wasLite = state.lite;
    if (state.lite) {
      bg?.stop();
    } else {
      ensureBg();
      bg?.start();
      transitions.refreshBackground();
    }
    // Replay the current slide in the new mode so nothing is left half-animated.
    enterSlide(deck.getCurrentSlide());
  });

  watchReducedMotion();
  transitions.start();
  window.x10 = { deck, state };
}

boot();
