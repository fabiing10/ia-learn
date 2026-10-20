// Test helper: pulls verbatim blocks out of plan-taller.md so the tests can check
// that the catalog and the generated files still say what the plan says.

import { readFileSync } from 'node:fs';

export const PLAN = readFileSync(new URL('../../plan-taller.md', import.meta.url), 'utf8');

/** Content of the first fenced block (``` or ~~~~) after `marker` in the plan. */
export function blockAfter(marker, { from = 0 } = {}) {
  const at = PLAN.indexOf(marker, from);
  if (at < 0) throw new Error(`Marker not found in plan: ${marker}`);
  const open = /^(```+|~~~~+)[^\n]*\n/m;
  const rest = PLAN.slice(at + marker.length);
  const m = rest.match(open);
  if (!m) throw new Error(`No fenced block after: ${marker}`);
  const start = m.index + m[0].length;
  const fence = m[1];
  const end = rest.indexOf(`\n${fence}`, start);
  return rest.slice(start, end);
}

/** Collapses every run of whitespace, so hard-wrapped text compares to unwrapped text. */
export const squash = (s) => s.replace(/\s+/g, ' ').trim();
