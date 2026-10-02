// "Copiar prompt": puts the demo prompt on the clipboard so the presenter can
// paste it into Claude or ChatGPT without retyping it on stage.
import { gsap, defineCtrl } from '../core/motion.js';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block the async clipboard on file://
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

defineCtrl('copy', {
  init(slide) {
    const btn = slide.querySelector('[data-copy]');
    const src = slide.querySelector('[data-copy-src]');
    if (!btn || !src) return;
    const label = btn.querySelector('.copy__label');
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await copyText(src.textContent.trim());
      btn.classList.toggle('is-done', ok);
      label.textContent = ok ? 'Copiado' : 'Selecciona y copia';
      gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'expo.out' });
      gsap.fromTo(src, { boxShadow: '0 0 0 0 rgba(232,181,58,0.6)' }, { boxShadow: '0 0 0 18px rgba(232,181,58,0)', duration: 0.9, ease: 'power2.out', clearProps: 'boxShadow' });
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.classList.remove('is-done');
        label.textContent = 'Copiar prompt';
      }, 2600);
    });
  },
});
