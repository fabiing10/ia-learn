// Display names for the answer keys stored by /test, taken from the same
// questionnaire definition the form uses (apps/shared/questions.js is pure data).
// Unknown keys fall back to a readable version, never a blank row.
import { ROLES, INDUSTRIES, USAGE, USE_AREAS } from '../../../apps/shared/questions.js';

const fromList = (list) => Object.fromEntries(list.map((o) => [o.value, o.label]));

const LABELS = {
  role: fromList(ROLES),
  industry: fromList(INDUSTRIES),
  usage: fromList(USAGE),
  use_areas: USE_AREAS,
};

export function labelFor(group, key) {
  const known = LABELS[group]?.[key];
  if (known) return known;
  const text = String(key).replace(/[_-]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
