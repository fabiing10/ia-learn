// Formulario de salida (plan, bloque 6): validation, the row the landing
// inserts into public.workshop_submissions (CONTRACT.md), and what the panel
// derives from the rows. Pure functions, no DOM: salida.test.mjs runs them.

import { CHECKPOINTS, MESAS, checkpointName } from './content.js';

export const WORKSHOP = 'vibecoding';
export const FORM = 'salida';
export const DEFAULT_SESSION = 'clase-1';
export const PAYLOAD_KEYS = ['nombre', 'url_app', 'url_repo', 'duda', 'punto_control'];
export const MAX = { nombre: 80, duda: 1000, url: 300 };

const str = (v) => (v === null || v === undefined ? '' : String(v));
const line = (v) => str(v).replace(/\s+/g, ' ').trim();
const text = (v) => str(v).replace(/\r\n?/g, '\n').trim();

/** ?s=<code>: slug [a-z0-9-], ≤ 40, starting with a letter or digit. */
export function cleanSession(raw) {
  const s = str(raw).trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,39}$/.test(s) ? s : DEFAULT_SESSION;
}

/**
 * Loose web-link check for what students paste (lovable.app, lovable.dev,
 * github.com…). Adds https:// when missing. Returns the link or null.
 */
export function normalizeUrl(raw) {
  let s = str(raw).trim();
  if (!s || /\s/.test(s) || s.length > MAX.url) return null;
  const scheme = s.match(/^([a-z][a-z0-9+.-]*):/i);
  const hasScheme = scheme && !/^\d/.test(s.slice(scheme[0].length)); // "host:8080" is a port, not a scheme
  if (hasScheme) {
    if (!/^https?:\/\//i.test(s)) return null;
  } else {
    s = `https://${s}`;
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  const host = u.hostname;
  if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) return null;
  return s;
}

/** Integer 1–5 or null. */
export function parsePunto(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
  const s = str(v).trim();
  return /^[1-5]$/.test(s) ? Number(s) : null;
}

const isGithub = (url) => {
  try {
    return /(^|\.)github\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** Field errors block the submit; warnings are shown but never block. */
export function validateSalida(form) {
  const errors = {};
  const warnings = {};
  const punto = parsePunto(form.punto_control);

  if (line(form.nombre).length < 2) errors.nombre = 'Escribe tu nombre.';

  const app = line(form.url_app);
  if (app && !normalizeUrl(app)) errors.url_app = 'Eso no parece un enlace. Cópialo tal cual desde la barra del navegador.';
  else if (!app && punto >= 4) errors.url_app = 'Marcaste que la publicaste: pega aquí la URL de tu app.';

  const repo = line(form.url_repo);
  if (repo && !normalizeUrl(repo)) errors.url_repo = 'Eso no parece un enlace. Cópialo tal cual desde la barra del navegador.';
  else if (!repo && punto === 5) errors.url_repo = 'Marcaste que la conectaste a GitHub: pega aquí el enlace del repositorio.';
  else if (repo && !isGithub(normalizeUrl(repo))) warnings.url_repo = 'Normalmente el repositorio está en github.com. Revisa que sea ese enlace.';

  if (!text(form.duda)) errors.duda = 'Escribe tu principal duda, por tonta que parezca.';
  if (punto === null) errors.punto_control = 'Elige hasta qué punto de control llegaste.';
  if (form.consent !== true) errors.consent = 'Para enviar necesitamos tu autorización.';

  return { errors, warnings };
}

/** The payload column: exactly the five contract keys. */
export function buildPayload(form) {
  const punto = parsePunto(form.punto_control);
  if (punto === null) throw new RangeError('punto_control must be an integer from 1 to 5');
  return {
    nombre: line(form.nombre).slice(0, MAX.nombre),
    url_app: normalizeUrl(form.url_app),
    url_repo: normalizeUrl(form.url_repo),
    duda: text(form.duda).slice(0, MAX.duda),
    punto_control: punto,
  };
}

/** One row for public.workshop_submissions. Consent is mandatory (Ley 1581 de 2012). */
export function buildRow(form, { session, consentAt } = {}) {
  if (form.consent !== true) throw new Error('consent is required to submit');
  return {
    workshop: WORKSHOP,
    form: FORM,
    session: cleanSession(session),
    payload: buildPayload(form),
    consent_at: consentAt ?? new Date().toISOString(),
  };
}

// ── Panel side ────────────────────────────────────────────
// Anyone can insert, so rows are untrusted: coerce every field and only keep
// http(s) links. HTML escaping stays the renderer's job.

const safeUrl = (v) => (typeof v === 'string' && /^https?:\/\//i.test(v.trim()) ? normalizeUrl(v) : null);

export function readSubmission(row) {
  const p = row?.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload : {};
  return {
    id: str(row?.id),
    created_at: str(row?.created_at),
    session: str(row?.session),
    consent_at: row?.consent_at ? str(row.consent_at) : null,
    nombre: line(p.nombre).slice(0, 120),
    url_app: safeUrl(p.url_app),
    url_repo: safeUrl(p.url_repo),
    duda: text(p.duda).slice(0, 2000),
    punto: parsePunto(p.punto_control),
  };
}

export function aggregate(subs) {
  const byPunto = Object.fromEntries(CHECKPOINTS.map((c) => [c.n, 0]));
  let sinPunto = 0;
  for (const s of subs) {
    if (s.punto) byPunto[s.punto] += 1;
    else sinPunto += 1;
  }
  return { total: subs.length, byPunto, sinPunto };
}

/** Suggested mesa for class 2. "Abrir la caja" needs punto 5 and a repository link. */
export function mesaFor(sub) {
  if (!sub.punto) return null;
  if (sub.punto <= 2) return MESAS[0];
  if (sub.punto === 5 && sub.url_repo) return MESAS[2];
  return MESAS[1];
}

export function groupForClase2(subs) {
  const out = Object.fromEntries([...MESAS.map((m) => [m.id, []]), ['sin-punto', []]]);
  for (const s of subs) {
    const mesa = mesaFor(s);
    const note = s.punto === 5 && !s.url_repo ? 'Marcó 5 sin enlace del repositorio' : '';
    out[mesa ? mesa.id : 'sin-punto'].push({ ...s, note });
  }
  return out;
}

// ── CSV ───────────────────────────────────────────────────

const CSV_HEADER = ['fecha', 'sesion', 'nombre', 'url_app', 'url_repo', 'duda', 'punto_control', 'punto_nombre', 'mesa_sugerida', 'consentimiento'];

function csvCell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formulas: every text column here is typed by a student.
  if (/^[=+\-@\t\r]/.test(s) || /^\s+[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(subs) {
  const lines = [CSV_HEADER.join(',')];
  for (const s of subs) {
    lines.push(
      [
        s.created_at, s.session, s.nombre, s.url_app, s.url_repo, s.duda, s.punto,
        s.punto ? checkpointName(s.punto) : '', mesaFor(s)?.name ?? '', s.consent_at,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}
