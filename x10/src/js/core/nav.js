// Reveal plugin that owns navigation rules and presenter hotkeys.
//
// Backup slides (videos, captures) live as vertical slides under the slide they
// back up. The clicker's "next/previous" never walks into them; the presenter
// jumps there with 1–4 and comes back with R.
import { state, toggleLite, toggleTheme, toast } from './state.js';

const KEY = { M: 77, T: 84, R: 82, D1: 49, D2: 50, D3: 51, D4: 52 };

export const BACKUP_KEYS = {
  1: 'Respaldo ejercicio 1 (capturas)',
  2: 'Respaldo demo talento (video)',
  3: 'Respaldo ejercicio 3 (captura)',
  4: 'Respaldo demo Lovable (video)',
};

/** In the speaker view, iframes forward mode keys to the projected window. */
function forwardToMain(cmd) {
  try {
    const main = window.parent?.opener;
    if (main) main.postMessage(JSON.stringify({ namespace: 'x10', cmd }), '*');
  } catch {
    /* cross-origin opener: nothing to forward to */
  }
}

export function runCommand(cmd) {
  if (cmd === 'lite') toast(toggleLite() ? 'Modo ligero activado' : 'Modo completo activado');
  if (cmd === 'theme') toast(toggleTheme() === 'light' ? 'Tema claro' : 'Tema oscuro');
}

export function createNavPlugin() {
  let R;
  let returnTo = null;

  const isBackup = (s) => s?.hasAttribute('data-backup');
  const horizontal = () => R.getHorizontalSlides();

  function next(original, opts = {}) {
    if (!opts.skipFragments && R.availableFragments().next) return original(opts);
    const { h } = R.getIndices();
    const cur = R.getCurrentSlide();
    // From a parent or one of its backups, "next" moves on horizontally.
    const stack = cur.parentElement.matches('section') ? cur.parentElement : null;
    const hasBackups = stack && [...stack.children].some(isBackup);
    if (hasBackups || isBackup(cur)) {
      if (h + 1 < horizontal().length) R.slide(h + 1, 0);
      return;
    }
    return original(opts);
  }

  function prev(original, opts = {}) {
    if (!opts.skipFragments && R.availableFragments().prev) return original(opts);
    const { h, v } = R.getIndices();
    if (v > 0) return R.slide(h, 0);
    if (h > 0) {
      const target = horizontal()[h - 1];
      const hasBackups = [...target.querySelectorAll(':scope > section')].some(isBackup);
      if (hasBackups) return R.slide(h - 1, 0);
    }
    return original(opts);
  }

  function jumpToBackup(n) {
    const target = document.querySelector(`section[data-backup="${n}"]`);
    if (!target) return;
    const cur = R.getCurrentSlide();
    if (!isBackup(cur)) returnTo = R.getIndices();
    const { h, v } = R.getIndices(target);
    R.slide(h, v);
  }

  function goBack() {
    if (returnTo) {
      R.slide(returnTo.h, returnTo.v, returnTo.f);
      returnTo = null;
    } else if (isBackup(R.getCurrentSlide())) {
      R.slide(R.getIndices().h, 0);
    }
  }

  const modeKey = (cmd) => () => {
    if (state.receiver) forwardToMain(cmd);
    else runCommand(cmd);
  };

  return {
    id: 'x10-nav',
    init(reveal) {
      R = reveal;
      const origNext = R.next;
      const origPrev = R.prev;
      // Controllers call through this internal object, so keyboard, clicker,
      // touch and the speaker view all follow the same rules.
      R.next = R.navigateNext = (opts) => next(origNext, opts);
      R.prev = R.navigatePrev = (opts) => prev(origPrev, opts);

      R.addKeyBinding({ keyCode: KEY.M, key: 'M', description: 'Modo ligero (sin WebGL ni animaciones pesadas)' }, modeKey('lite'));
      R.addKeyBinding({ keyCode: KEY.T, key: 'T', description: 'Tema claro / oscuro' }, modeKey('theme'));
      R.addKeyBinding({ keyCode: KEY.R, key: 'R', description: 'Volver del respaldo' }, goBack);
      [KEY.D1, KEY.D2, KEY.D3, KEY.D4].forEach((code, i) => {
        R.addKeyBinding({ keyCode: code, key: String(i + 1), description: BACKUP_KEYS[i + 1] }, () => jumpToBackup(i + 1));
      });

      window.addEventListener('message', (e) => {
        if (typeof e.data !== 'string' || !e.data.includes('"x10"')) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.namespace === 'x10') runCommand(msg.cmd);
        } catch {
          /* not ours */
        }
      });
    },
  };
}
