// The store-only ZIP writer, checked against the system unzip (Info-ZIP on macOS).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, zip } from './zip.js';

const FIXED = new Date(2026, 9, 19, 15, 30, 42);
const FILES = {
  'cerebro-juridico/README.md': '# Mi cerebro jurídico\n',
  'cerebro-juridico/00_ADN.md': 'Eres mi asistente jurídico. Llámame Laura — ñandú, acción, “comillas”.\n',
  'cerebro-juridico/10_CASOS/CLIENTE-01 — Petición de documentos.md': '---\ntipo: expediente\n---\n',
  'cerebro-juridico/20_FUENTES/Normas/Ley 1755 de 2015.md': 'Días hábiles.\n',
  'cerebro-juridico/vacío.md': '',
};

const tmp = () => mkdtempSync(join(tmpdir(), 'cj-zip-'));

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});

test('zip returns bytes that start with a local header and end with the central directory', () => {
  const bytes = zip(FILES, { date: FIXED });
  assert.ok(bytes instanceof Uint8Array);
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  const eocd = bytes.length - 22;
  assert.deepEqual([...bytes.slice(eocd, eocd + 4)], [0x50, 0x4b, 0x05, 0x06]);
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const dirs = ['cerebro-juridico/', 'cerebro-juridico/10_CASOS/', 'cerebro-juridico/20_FUENTES/', 'cerebro-juridico/20_FUENTES/Normas/'];
  assert.equal(view.getUint16(eocd + 10, true), Object.keys(FILES).length + dirs.length);
  // General purpose flag of the first local header: bit 11 (UTF-8 names), no compression.
  assert.equal(view.getUint16(6, true), 0x0800);
  assert.equal(view.getUint16(8, true), 0);
});

test('same input and date give the same bytes', () => {
  assert.deepEqual(zip(FILES, { date: FIXED }), zip(FILES, { date: FIXED }));
  assert.deepEqual(zip(FILES, { date: FIXED }), zip(Object.entries(FILES).map(([name, data]) => ({ name, data })), { date: FIXED }));
});

test('unzip -t passes and unzip -l lists every entry; a second reader sees the UTF-8 names', () => {
  const dir = tmp();
  try {
    const file = join(dir, 'cerebro-juridico.zip');
    writeFileSync(file, zip(FILES, { date: FIXED }));
    const t = execFileSync('unzip', ['-t', file], { encoding: 'utf8' });
    assert.match(t, /No errors detected/);
    const l = execFileSync('unzip', ['-l', file], { encoding: 'utf8' });
    assert.match(l, /\s9 files\n/);
    assert.match(l, /10-19-2026 15:30/);
    // Apple's unzip prints C1-range UTF-8 bytes (— í) as "?" in listings only;
    // ASCII names must appear as is, and Python's zipfile must decode all of them.
    for (const name of Object.keys(FILES).filter((n) => /^[\x20-\x7e]+$/.test(n))) {
      assert.ok(l.includes(name), `listing lacks ${name}`);
    }
    const py = execFileSync('python3', ['-I', '-c', 'import sys, zipfile, json; print(json.dumps(zipfile.ZipFile(sys.argv[1]).namelist()))', file], { encoding: 'utf8' });
    const names = JSON.parse(py);
    for (const name of Object.keys(FILES)) assert.ok(names.includes(name), `zipfile lacks ${name}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extracted files are byte-identical, in nested folders', () => {
  const dir = tmp();
  try {
    const file = join(dir, 'x.zip');
    writeFileSync(file, zip({ ...FILES, 'bin/raw.bin': new Uint8Array([0, 1, 2, 255, 254]) }, { date: FIXED }));
    execFileSync('unzip', ['-q', file, '-d', join(dir, 'out')]);
    for (const [name, text] of Object.entries(FILES)) {
      const path = join(dir, 'out', name);
      assert.ok(existsSync(path), `missing ${name}`);
      assert.equal(readFileSync(path, 'utf8'), text, name);
    }
    assert.deepEqual([...readFileSync(join(dir, 'out', 'bin/raw.bin'))], [0, 1, 2, 255, 254]);
    assert.ok(statSync(join(dir, 'out', 'cerebro-juridico/20_FUENTES/Normas')).isDirectory());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
