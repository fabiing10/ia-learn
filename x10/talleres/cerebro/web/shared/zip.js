// Minimal store-only ZIP writer (no compression): enough for a handful of
// Markdown files, with UTF-8 names (general purpose bit 11) and nested folders.
// Spec: PKWARE APPNOTE 6.3.x, sections 4.3.7 (local header), 4.3.12 (central
// directory) and 4.3.16 (end of central directory).

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const UTF8 = 0x0800;
const VERSION = 20; // 2.0: folders
const MADE_BY = (3 << 8) | VERSION; // Unix, so unzip restores the permissions below
const FILE_ATTR = (0o100644 << 16) >>> 0;
const DIR_ATTR = ((0o040755 << 16) | 0x10) >>> 0;

/** MS-DOS date and time (local time, 2-second resolution). */
function dosDateTime(date) {
  const y = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    day: ((y - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

const enc = new TextEncoder();

/** { 'a/b.md': text } or [{ name, data }] → [{ name, data: Uint8Array }] with parent folders first. */
function entriesOf(files) {
  const list = Array.isArray(files) ? files.map((f) => [f.name, f.data]) : Object.entries(files);
  const out = [];
  const seen = new Set();
  for (const [rawName, data] of list) {
    const name = String(rawName).replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = name.split('/');
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/') + '/';
      if (!seen.has(dir)) {
        seen.add(dir);
        out.push({ name: dir, data: new Uint8Array(), dir: true });
      }
    }
    if (name.endsWith('/') || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, data: typeof data === 'string' ? enc.encode(data) : new Uint8Array(data ?? []), dir: false });
  }
  return out;
}

/**
 * Builds a ZIP archive. `date` stamps every entry (pass a fixed one for
 * reproducible bytes). Returns a Uint8Array ready for `new Blob([bytes])`.
 */
export function zip(files, { date = new Date() } = {}) {
  const { time, day } = dosDateTime(date);
  const entries = entriesOf(files);
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, VERSION, true);
    lv.setUint16(6, UTF8, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, day, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, MADE_BY, true);
    cv.setUint16(6, VERSION, true);
    cv.setUint16(8, UTF8, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, day, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk
    cv.setUint16(36, 0, true); // internal attributes
    cv.setUint32(38, e.dir ? DIR_ATTR : FILE_ATTR, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local, e.data);
    centrals.push(central);
    offset += local.length + size;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const out = new Uint8Array(offset + centralSize + end.length);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
