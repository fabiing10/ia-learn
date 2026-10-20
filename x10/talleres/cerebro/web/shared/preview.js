// Turns a generated Markdown file into the live preview: one escaped <span> per
// line, a class per line kind for the monospace styling, a few highlighted tokens
// (YO DECIDO, the contract traffic lights, pending marks), and `is-new` on the
// lines that differ from the previous version so the landing can flash them.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** For each line of `next`, true when it is not in `prev` (multiset, so duplicates count). */
export function changedLines(prev, next) {
  const out = next.split('\n');
  if (prev === undefined || prev === null) return out.map(() => false);
  const pool = new Map();
  for (const l of prev.split('\n')) pool.set(l, (pool.get(l) || 0) + 1);
  return out.map((l) => {
    const n = pool.get(l) || 0;
    if (n > 0) {
      pool.set(l, n - 1);
      return false;
    }
    return true;
  });
}

const TOKENS = [
  [/\b(YO DECIDO|YO entrego|IA hace|VERIFICO)\b/g, 'tok--paso'],
  [/\[VERDE\]/g, 'tok--verde'],
  [/\[AMARILLO\]/g, 'tok--amarillo'],
  [/\[ROJO\]/g, 'tok--rojo'],
  [/\[(?:NO VERIFICADO|PENDIENTE[^\]]*)\]/g, 'tok--pend'],
  [/Verificación pendiente/g, 'tok--verif'],
  [/\{\{[A-Z0-9_]+\}\}/g, 'ph'],
];

function inline(escaped) {
  let s = escaped.replace(/`([^`]+)`/g, '<code class="tok--code">$1</code>');
  for (const [re, cls] of TOKENS) s = s.replace(re, (m) => `<span class="${cls}">${m}</span>`);
  return s;
}

function kind(line, inFence) {
  if (/^(```|~~~)/.test(line)) return 'fence';
  if (inFence) return 'code';
  if (!line.trim()) return 'blank';
  if (line.startsWith('# ')) return 'h1';
  if (line.startsWith('## ')) return 'h2';
  if (/^#{3,} /.test(line)) return 'h3';
  if (line.startsWith('>')) return 'quote';
  if (line.startsWith('|')) return 'table';
  if (/^- \[[ x]\]/.test(line)) return 'check';
  if (/^\s*(?:[-*] |\d+\. )/.test(line)) return 'li';
  if (line === '---') return 'hr';
  return 'p';
}

/** → { html, changed } where `changed` is the number of lines marked is-new. */
export function renderPreview(text, prev) {
  const flags = changedLines(prev, text);
  let inFence = false;
  let changed = 0;
  const html = text
    .split('\n')
    .map((line, i) => {
      const k = kind(line, inFence);
      if (k === 'fence') inFence = !inFence;
      const isNew = flags[i] && k !== 'blank';
      if (isNew) changed++;
      const body = k === 'blank' ? ' ' : k === 'fence' || k === 'code' ? esc(line) || ' ' : inline(esc(line));
      return `<span class="ln ln--${k}${isNew ? ' is-new' : ''}">${body}</span>`;
    })
    .join('');
  return { html, changed };
}
