// Home page (/): the x10 logo, a 3D brain and quotes from the people who built
// modern AI. No menu. The brain needs WebGL; without it the page keeps the logo and
// the quotes, and without JS it shows the first quote from the static list.
import './brain.css';
import { createBrain } from './scene.js';
import { startQuotes } from './quotes.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.querySelector('.brain');
const stage = document.querySelector('.stage');
const logo = document.querySelector('.logo');

// The logo's × glows with the brain's activity; a few updates a second are plenty.
let frames = 0;
const onFrame = (activity) => {
  if (++frames % 4 === 0) logo.style.setProperty('--act', activity.toFixed(2));
};

// Checked first: a failed WebGLRenderer logs errors of its own.
function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

async function start() {
  await document.fonts?.ready;
  let brain = null;
  try {
    if (!hasWebGL()) throw new Error('WebGL no disponible');
    brain = createBrain(canvas, { stage, reduced, onFrame });
    root.classList.add('has-brain');
  } catch (err) {
    root.classList.add('no-webgl');
    console.warn('x10: sin WebGL, el cerebro no se dibuja.', err.message);
  }
  startQuotes({
    list: document.getElementById('frases'),
    figure: document.querySelector('.q'),
    emit: brain?.emit,
    reduced,
    onResize: () => brain?.layout(),
  });
}

start();
