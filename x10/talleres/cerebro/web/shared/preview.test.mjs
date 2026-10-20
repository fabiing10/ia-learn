// Markdown-ish preview of a generated file, with the lines that changed marked.

import test from 'node:test';
import assert from 'node:assert/strict';
import { changedLines, renderPreview } from './preview.js';

const lines = (html) => [...html.matchAll(/<span class="ln([^"]*)">([\s\S]*?)<\/span>(?=<span class="ln|$)/g)].map((m) => ({ cls: m[1], body: m[2] }));

test('changedLines marks only new or edited lines, counting duplicates', () => {
  assert.deepEqual(changedLines('a\nb\nc', 'a\nB\nc'), [false, true, false]);
  assert.deepEqual(changedLines('x\nx', 'x\nx\nx'), [false, false, true]);
  assert.deepEqual(changedLines(undefined, 'a\nb'), [false, false]);
  assert.deepEqual(changedLines('a', 'a'), [false]);
});

test('renderPreview escapes HTML and wraps every line', () => {
  const { html } = renderPreview('<script>alert("x")</script> & más');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; más'));
  assert.equal(lines(html).length, 1);
});

test('line kinds: headings, quotes, fences, code, tables, lists, checks', () => {
  const text = ['# T', '## S', '### Sub', '> nota', '```text', 'código', '```', '| a | b |', '- item', '1. paso', '- [ ] revisar', ''].join('\n');
  const got = lines(renderPreview(text).html).map((l) => l.cls.trim().split(' ')[0]);
  assert.deepEqual(got, ['ln--h1', 'ln--h2', 'ln--h3', 'ln--quote', 'ln--fence', 'ln--code', 'ln--fence', 'ln--table', 'ln--li', 'ln--li', 'ln--check', 'ln--blank']);
});

test('inline tokens: YO DECIDO, traffic lights, pending marks, placeholders, code', () => {
  const { html } = renderPreview('3. YO DECIDO: [VERDE] [AMARILLO] [ROJO] [NO VERIFICADO] [PENDIENTE: dato] {{URL_CORTA}} `03_FUENTES.md` Verificación pendiente');
  for (const cls of ['tok--paso', 'tok--verde', 'tok--amarillo', 'tok--rojo', 'tok--pend', 'ph', 'tok--code', 'tok--verif']) {
    assert.ok(html.includes(`class="${cls}"`), cls);
  }
});

test('changed lines carry is-new and the count is returned', () => {
  const { html, changed } = renderPreview('# T\nnuevo\nigual', '# T\nviejo\nigual');
  assert.equal(changed, 1);
  const ls = lines(html);
  assert.ok(ls[1].cls.includes('is-new'));
  assert.ok(!ls[0].cls.includes('is-new') && !ls[2].cls.includes('is-new'));
});
