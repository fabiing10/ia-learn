// Geometry of the 3D brain on the home page, in brain units: x runs from the
// frontal lobe (-1) to the occipital lobe (+1), y points up and z crosses the two
// hemispheres (left < 0 < right). Pure functions over a seeded random source: the
// same brain comes out on every load, and the module runs under node --test.
//
//   dust   points on the cortex, gathered on fold lines so the gyri read at a glance,
//          plus the cerebellum's folia and the brain stem
//   nodes  neurons just under the cortex, deeper hubs, cerebellum and stem
//   conns  synapses: short links between neighbours, plus long curved tracts
//          (corpus callosum across the hemispheres, association fibres front to back)

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dust kinds, read by the shader.
export const FOLD = 0;
export const FILL = 1;
export const FOLIA = 2;
export const STEM = 3;

// Node regions.
export const LEFT = 0;
export const RIGHT = 1;
export const CEREBELLUM = 2;
export const BRAINSTEM = 3;

const HEMI_Z = 0.41; // hemisphere centre, either side of the midline
const HEMI_Y = 0.02;
const CEREB = [
  [0.64, -0.43, -0.2],
  [0.64, -0.43, 0.2],
];
const CEREB_R = [0.3, 0.2, 0.25];
const STEM_A = [0.3, -0.3, 0];
const STEM_B = [0.45, -1.0, 0];

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Half-extents of a hemisphere at front-back position x: the temporal lobe hangs
// lowest a little ahead of the middle, the frontal and occipital poles taper.
function radii(x) {
  const top = 0.66 * (1 - 0.12 * x * x) - 0.05 * smoothstep(0.1, 1, -x);
  const bottom = 0.3 + 0.27 * Math.exp(-(((x + 0.08) / 0.42) ** 2));
  const taper = 1 - 0.12 * smoothstep(0.25, 1, -x) - 0.2 * smoothstep(0.35, 1, x);
  return { top, bottom, lateral: 0.44 * taper, medial: 0.395 * taper };
}

/** Below 1 inside hemisphere s (-1 left, +1 right), 1 on its surface. */
export function hemisphereField(x, y, z, s) {
  const r = radii(x);
  const dy = y - HEMI_Y;
  const qy = dy / (dy > 0 ? r.top : r.bottom);
  const dz = (z - s * HEMI_Z) * s; // > 0 lateral, < 0 towards the midline
  const qz = dz / (dz > 0 ? r.lateral : r.medial);
  // A higher power on the medial side flattens the wall that faces the other hemisphere.
  return x * x + qy * qy + Math.abs(qz) ** (dz > 0 ? 2 : 5);
}

function cerebellumField(x, y, z, k) {
  const [cx, cy, cz] = CEREB[k];
  return ((x - cx) / CEREB_R[0]) ** 2 + ((y - cy) / CEREB_R[1]) ** 2 + ((z - cz) / CEREB_R[2]) ** 2;
}

const inCerebrum = (x, y, z) => hemisphereField(x, y, z, -1) < 1 || hemisphereField(x, y, z, 1) < 1;
const inCerebellum = (x, y, z) => cerebellumField(x, y, z, 0) < 1 || cerebellumField(x, y, z, 1) < 1;

// Warped gyroid: its zero set, cut by the cortex, draws a maze of folds.
function folds(x, y, z) {
  const f = 14.5;
  const wx = x * f + 1.1 * Math.sin(y * 3.3 + 1.7);
  const wy = y * f + 1.1 * Math.sin(z * 2.9 + 0.3);
  const wz = z * f + 1.1 * Math.sin(x * 2.6 + 2.2);
  return Math.sin(wx) * Math.cos(wy) + Math.sin(wy) * Math.cos(wz) + Math.sin(wz) * Math.cos(wx);
}

// The lateral (Sylvian) fissure: a groove that separates the temporal lobe.
const sylvian = (x, y, lateral) =>
  lateral > 0.12 && x > -0.64 && x < 0.34 && Math.abs(y - (-0.17 + 0.33 * (x + 0.64))) < 0.024;

function randomDir(r) {
  const z = r() * 2 - 1;
  const a = r() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a), z, s * Math.sin(a)];
}

// Distance from c along d to the surface where field() crosses 1.
function surfaceDistance(field, c, d, max = 1.6) {
  let lo = 0;
  let hi = max;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (field(c[0] + d[0] * mid, c[1] + d[1] * mid, c[2] + d[2] * mid) < 1) lo = mid;
    else hi = mid;
  }
  return lo;
}

// A point on hemisphere s, about uniform per unit of area: directions from the centre
// crowd near the poles of a long ellipsoid, so far points are kept more often. The
// keep test uses a plain ellipsoid estimate, which is cheaper than the exact search.
function hemispherePoint(r, s) {
  const c = [0, HEMI_Y, s * HEMI_Z];
  const field = (x, y, z) => hemisphereField(x, y, z, s);
  for (;;) {
    const d = randomDir(r);
    const ry = d[1] > 0 ? 0.66 : 0.45;
    const rz = d[2] * s > 0 ? 0.44 : 0.395;
    const estimate = 1 / Math.sqrt(d[0] * d[0] + (d[1] / ry) ** 2 + (d[2] / rz) ** 2);
    if (r() > estimate * estimate) continue;
    const dist = surfaceDistance(field, c, d);
    return { c, d, dist, p: [c[0] + d[0] * dist, c[1] + d[1] * dist, c[2] + d[2] * dist] };
  }
}

function cerebellumPoint(r, k) {
  const c = CEREB[k];
  const field = (x, y, z) => cerebellumField(x, y, z, k);
  const d = randomDir(r);
  const dist = surfaceDistance(field, c, d, 0.5);
  return { c, d, dist, p: [c[0] + d[0] * dist, c[1] + d[1] * dist, c[2] + d[2] * dist] };
}

const lerp = (a, b, t) => a + (b - a) * t;
const stemAxis = (t) => [lerp(STEM_A[0], STEM_B[0], t), lerp(STEM_A[1], STEM_B[1], t), 0];
const stemRadius = (t) => lerp(0.13, 0.08, t);

function buildDust(r, total) {
  const pos = new Float32Array(total * 3);
  const kind = new Float32Array(total);
  const seed = new Float32Array(total);
  let n = 0;
  const push = (p, k) => {
    pos.set(p, n * 3);
    kind[n] = k;
    seed[n] = r();
    n++;
  };

  const cortex = Math.round(total * 0.84);
  const cerebellum = Math.round(total * 0.12);
  let guard = total * 400;
  while (n < cortex && guard-- > 0) {
    const s = r() < 0.5 ? -1 : 1;
    const { p, d } = hemispherePoint(r, s);
    const lateral = d[2] * s;
    if (sylvian(p[0], p[1], lateral)) continue;
    if (lateral < -0.35 && r() < 0.45) continue; // the hidden medial wall needs fewer points
    const g = Math.abs(folds(p[0], p[1], p[2]));
    if (g < 0.2) {
      // fold line: sink it a touch, like the groove of a sulcus
      push([p[0] - d[0] * 0.012, p[1] - d[1] * 0.012, p[2] - d[2] * 0.012], FOLD);
    } else if (r() < 0.035) {
      push(p, FILL);
    }
  }
  while (n < cortex + cerebellum && guard-- > 0) {
    const { p } = cerebellumPoint(r, r() < 0.5 ? 0 : 1);
    if (inCerebrum(...p)) continue;
    if (cerebellumField(...p, 0) < 0.999 || cerebellumField(...p, 1) < 0.999) continue;
    const band = Math.abs(Math.sin((p[1] - 0.35 * (p[0] - 0.64)) * 64));
    if (band < 0.45 || r() < 0.08) push(p, FOLIA);
  }
  while (n < total && guard-- > 0) {
    const t = r();
    const a = r() * Math.PI * 2;
    const [x, y] = stemAxis(t);
    const rad = stemRadius(t);
    const p = [x + Math.cos(a) * rad * 0.55, y + Math.sin(a) * rad * 0.15, Math.sin(a) * rad];
    if (inCerebrum(...p) || inCerebellum(...p)) continue;
    push(p, STEM);
  }
  return { pos: pos.subarray(0, n * 3), kind: kind.subarray(0, n), seed: seed.subarray(0, n) };
}

function buildNodes(r, total) {
  const pos = [];
  const region = [];
  const add = (p, g) => {
    pos.push(...p);
    region.push(g);
  };
  const cortex = Math.round(total * 0.72);
  const deep = Math.round(total * 0.15);
  const cerebellum = Math.round(total * 0.09);
  for (let i = 0; i < cortex; i++) {
    const s = i % 2 ? 1 : -1;
    const { c, d, dist } = hemispherePoint(r, s);
    const k = dist * (0.9 + r() * 0.08);
    add([c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k], s < 0 ? LEFT : RIGHT);
  }
  for (let i = 0; i < deep; i++) {
    const s = i % 2 ? 1 : -1;
    const { c, d, dist } = hemispherePoint(r, s);
    const k = dist * (0.3 + r() * 0.45);
    add([c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k], s < 0 ? LEFT : RIGHT);
  }
  for (let i = 0; i < cerebellum; i++) {
    const { c, d, dist } = cerebellumPoint(r, i % 2);
    const k = dist * (0.55 + r() * 0.35);
    const p = [c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k];
    if (inCerebrum(...p)) {
      i--;
      continue;
    }
    add(p, CEREBELLUM);
  }
  const stem = total - cortex - deep - cerebellum;
  for (let i = 0; i < stem; i++) {
    const [x, y] = stemAxis((i + 0.5) / stem);
    add([x + (r() - 0.5) * 0.05, y, (r() - 0.5) * 0.08], BRAINSTEM);
  }
  return { pos: new Float32Array(pos), region: Uint8Array.from(region) };
}

const get = (pos, i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

// A connection is a polyline from node a to node b; cum holds the arc length at each point.
function connection(a, b, points) {
  const pts = new Float32Array(points.flat());
  const cum = new Float32Array(points.length);
  for (let i = 1; i < points.length; i++) cum[i] = cum[i - 1] + Math.sqrt(dist2(points[i - 1], points[i]));
  return { a, b, pts, cum, len: cum[points.length - 1] };
}

function arc(p, q, ctrl, segments = 12) {
  const out = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    out.push([0, 1, 2].map((k) => u * u * p[k] + 2 * u * t * ctrl[k] + t * t * q[k]));
  }
  return out;
}

function buildConnections(r, nodes) {
  const { pos, region } = nodes;
  const n = region.length;
  const conns = [];
  const adj = Array.from({ length: n }, () => []);
  const seen = new Set();
  const link = (a, b, points) => {
    if (a === b) return false;
    const key = Math.min(a, b) * n + Math.max(a, b);
    if (seen.has(key)) return false;
    seen.add(key);
    adj[a].push(conns.length);
    adj[b].push(conns.length);
    conns.push(connection(a, b, points));
    return true;
  };

  // Local synapses: each neuron to its nearest neighbours in the same region.
  for (let i = 0; i < n; i++) {
    const p = get(pos, i);
    const k = region[i] === BRAINSTEM ? 2 : 3;
    const near = [];
    for (let j = 0; j < n; j++) {
      if (j === i || region[j] !== region[i]) continue;
      near.push([dist2(p, get(pos, j)), j]);
    }
    near.sort((u, v) => u[0] - v[0]);
    for (const [, j] of near.slice(0, k)) link(i, j, [p, get(pos, j)]);
  }

  const of = (g, test = () => true) => [...region.keys()].filter((i) => region[i] === g && test(get(pos, i)));
  const pick = (list) => list[Math.floor(r() * list.length)];
  const nearest = (p, list) => list.reduce((best, j) => (dist2(p, get(pos, j)) < dist2(p, get(pos, best)) ? j : best), list[0]);

  // Corpus callosum: arcs over the midline between mirrored points of both hemispheres.
  const leftTop = of(LEFT, (p) => p[1] > 0.02 && Math.abs(p[0]) < 0.62);
  const rightTop = of(RIGHT, (p) => p[1] > 0.02 && Math.abs(p[0]) < 0.62);
  for (let k = 0; k < 18; k++) {
    const a = pick(leftTop);
    const pa = get(pos, a);
    const b = nearest([pa[0] + (r() - 0.5) * 0.2, pa[1], -pa[2]], rightTop);
    const pb = get(pos, b);
    link(a, b, arc(pa, pb, [(pa[0] + pb[0]) / 2, Math.min(pa[1], pb[1]) - 0.12, 0]));
  }

  // Association fibres: long arcs inside one hemisphere, bowed towards its core.
  for (const g of [LEFT, RIGHT]) {
    const front = of(g, (p) => p[0] < -0.35);
    const back = of(g, (p) => p[0] > 0.3);
    const s = g === LEFT ? -1 : 1;
    for (let k = 0; k < 12; k++) {
      const a = pick(front);
      const b = pick(back);
      const pa = get(pos, a);
      const pb = get(pos, b);
      const mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2];
      const core = [0, HEMI_Y, s * HEMI_Z * 0.8];
      link(a, b, arc(pa, pb, mid.map((v, i) => lerp(v, core[i], 0.75))));
    }
  }

  // Stem to cerebellum and to both hemispheres (the way in for the senses).
  const stem = of(BRAINSTEM);
  const cereb = of(CEREBELLUM);
  const deepOf = (g) => of(g, (p) => Math.abs(p[2]) < 0.4 && p[1] < 0.15 && Math.abs(p[0]) < 0.4);
  const top = stem[0];
  for (let k = 0; k < 4; k++) {
    const a = stem[Math.floor(stem.length * (0.2 + k * 0.15))];
    const b = nearest(get(pos, a), cereb);
    link(a, b, [get(pos, a), get(pos, b)]);
  }
  for (const g of [LEFT, RIGHT]) {
    const hubs = deepOf(g);
    for (let k = 0; k < 3 && hubs.length; k++) {
      const b = pick(hubs);
      const pa = get(pos, top);
      const pb = get(pos, b);
      link(top, b, arc(pa, pb, [(pa[0] + pb[0]) / 2, pa[1] + 0.1, pb[2] * 0.4]));
    }
  }
  return { conns, adj };
}

/**
 * The whole brain. `dust` and `nodes` are counts; the result is plain typed arrays
 * ready for GPU buffers.
 */
export function buildBrain({ seed = 10, dust = 18000, nodes = 640 } = {}) {
  const r = mulberry32(seed);
  const d = buildDust(r, dust);
  const nd = buildNodes(r, nodes);
  const { conns, adj } = buildConnections(r, nd);
  return { dust: d, nodes: nd, conns, adj };
}
