// node --test 'apps/brain/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBrain, hemisphereField } from './shape.js';
import { Pulses } from './pulses.js';
import { splitWords } from './words.js';

const brain = buildBrain({ seed: 7, dust: 6000, nodes: 360 });

test('the same seed always builds the same brain', () => {
  const again = buildBrain({ seed: 7, dust: 6000, nodes: 360 });
  assert.deepEqual([...again.dust.pos.slice(0, 30)], [...brain.dust.pos.slice(0, 30)]);
  assert.equal(again.conns.length, brain.conns.length);
});

test('dust and nodes stay inside the brain bounds', () => {
  for (const arr of [brain.dust.pos, brain.nodes.pos]) {
    for (let i = 0; i < arr.length; i += 3) {
      const [x, y, z] = [arr[i], arr[i + 1], arr[i + 2]];
      assert.ok(Math.abs(x) <= 1.12 && y >= -1.08 && y <= 0.82 && Math.abs(z) <= 0.95, `out of bounds: ${x} ${y} ${z}`);
    }
  }
});

test('the hemispheres are split by the longitudinal fissure', () => {
  const { pos, kind } = brain.dust;
  let left = 0;
  let right = 0;
  for (let i = 0; i < kind.length; i++) {
    if (kind[i] > 1) continue; // cerebellum and stem cross the midline
    const z = pos[i * 3 + 2];
    assert.ok(Math.abs(z) > 0.012, `cortex point on the midline: z=${z}`);
    z < 0 ? left++ : right++;
  }
  assert.ok(left > 1000 && right > 1000);
  assert.ok(Math.abs(left - right) / (left + right) < 0.1, 'hemispheres should be balanced');
});

test('hemisphere field is below 1 at the centre and above 1 far away', () => {
  assert.ok(hemisphereField(0, 0.02, 0.4, 1) < 1);
  assert.ok(hemisphereField(0, 0.02, -0.4, -1) < 1);
  assert.ok(hemisphereField(0, 0.02, -0.4, 1) > 1);
  assert.ok(hemisphereField(1.5, 0, 0.4, 1) > 1);
});

test('every neuron has a synapse and every synapse joins two different neurons', () => {
  const n = brain.nodes.pos.length / 3;
  assert.equal(brain.adj.length, n);
  brain.adj.forEach((list, i) => assert.ok(list.length > 0, `node ${i} is isolated`));
  const seen = new Set();
  for (const c of brain.conns) {
    assert.notEqual(c.a, c.b);
    const key = Math.min(c.a, c.b) * n + Math.max(c.a, c.b);
    assert.ok(!seen.has(key), `duplicate synapse ${c.a}-${c.b}`);
    seen.add(key);
    // the path starts on node a and ends on node b
    const [ax, ay, az] = brain.nodes.pos.slice(c.a * 3, c.a * 3 + 3);
    const [bx, by, bz] = brain.nodes.pos.slice(c.b * 3, c.b * 3 + 3);
    const m = c.pts.length;
    assert.ok(Math.hypot(c.pts[0] - ax, c.pts[1] - ay, c.pts[2] - az) < 1e-6);
    assert.ok(Math.hypot(c.pts[m - 3] - bx, c.pts[m - 2] - by, c.pts[m - 1] - bz) < 1e-6);
    assert.ok(c.len > 0 && Math.abs(c.cum[c.cum.length - 1] - c.len) < 1e-6);
  }
});

test('long tracts link the two hemispheres', () => {
  const region = brain.nodes.region;
  const crossing = brain.conns.filter((c) => region[c.a] !== region[c.b] && region[c.a] < 2 && region[c.b] < 2);
  assert.ok(crossing.length >= 8, `only ${crossing.length} callosal tracts`);
});

test('an impulse travels its synapse and fires the next neuron', () => {
  const pulses = new Pulses(brain, { max: 50, rand: () => 0.5 });
  const spawned = pulses.seed(0, { fan: 1, gen: 3 });
  assert.equal(spawned, 1);
  const arrived = [];
  for (let k = 0; k < 400 && arrived.length < 2; k++) pulses.update(1 / 60, (node, p) => arrived.push({ node, gen: p.gen }));
  assert.ok(arrived.length >= 2, 'the cascade should hop at least twice');
  assert.equal(arrived[0].gen, 3);
  assert.equal(arrived[1].gen, 4);
});

test('cascades die out and never exceed the cap', () => {
  let i = 0;
  const pulses = new Pulses(brain, { max: 40, rand: () => ((i = (i * 9301 + 49297) % 233280) / 233280) });
  for (let s = 0; s < 10; s++) pulses.seed(s * 7, { fan: 4, gen: 0, maxGen: 12 });
  let peak = 0;
  for (let k = 0; k < 60 * 30; k++) {
    pulses.update(1 / 60);
    peak = Math.max(peak, pulses.count);
  }
  assert.ok(peak <= 40, `peak ${peak}`);
  assert.equal(pulses.count, 0, 'all cascades should end');
});

test('pulse positions lie on their synapse', () => {
  const pulses = new Pulses(brain, { max: 10, rand: () => 0.3 });
  pulses.seed(5, { fan: 1, gen: 0 });
  pulses.update(0.05);
  const out = [0, 0, 0];
  pulses.position(0, 0, out);
  const c = brain.conns[pulses.list[0].conn];
  const pts = c.pts;
  let best = Infinity;
  for (let j = 0; j + 5 < pts.length; j += 3) {
    // distance from the point to segment j
    const [x0, y0, z0, x1, y1, z1] = pts.slice(j, j + 6);
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((out[0] - x0) * dx + (out[1] - y0) * dy + (out[2] - z0) * dz) / (dx * dx + dy * dy + dz * dz)));
    best = Math.min(best, Math.hypot(x0 + dx * t - out[0], y0 + dy * t - out[1], z0 + dz * t - out[2]));
  }
  assert.ok(best < 1e-6, `pulse off its path by ${best}`);
});

test('quotes split into words that keep their punctuation', () => {
  assert.deepEqual(splitWords('  El lenguaje de programación   más popular, hoy: el inglés. '), [
    'El', 'lenguaje', 'de', 'programación', 'más', 'popular,', 'hoy:', 'el', 'inglés.',
  ]);
  assert.deepEqual(splitWords(''), []);
});
