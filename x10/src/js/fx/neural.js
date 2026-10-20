// Neural layer for decks whose mark is 'brain': nodes joined by synapses, with
// impulses travelling along them. It follows the background formations:
//   field → a wide, sparse net across the slide
//   mark  → the net folds inside the brain silhouette
//   marks → five neurons in a chain; impulses jump from one axon to the next
// Like the particles, all motion runs in the shaders; the CPU only tweens uniforms.
import {
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  LineSegments,
  Points,
  Color,
  AdditiveBlending,
  NormalBlending,
} from 'three';
import { gsap } from '../core/motion.js';

const NODES = 168;
const NEIGHBOURS = 3;
const AXON_PACKETS = 44;
export const BRAIN_W = 2.9;
export const BRAIN_H = 2.1;
const CHAIN_GAP = 1.85;

// ── Shapes shared with the particle formations ──

const inEllipse = (u, v, cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;

/** Side view of a brain, frontal lobe on the left, in normalised units (~-1..1). */
export function inBrain(u, v) {
  const cerebrum = inEllipse(u, v, 0, 0.12, 1, 0.8) && v > -0.28;
  const temporal = inEllipse(u, v, -0.06, -0.36, 0.64, 0.3);
  const cerebellum = inEllipse(u, v, 0.6, -0.58, 0.3, 0.2);
  const stem = v < -0.4 && v > -1 && Math.abs(u - (0.3 + (v + 0.4) * 0.25)) < 0.075;
  // lateral fissure: a thin gap that separates the temporal lobe
  const fissure = u > -0.62 && u < 0.38 && Math.abs(v - (-0.2 + (u + 0.5) * 0.17)) < 0.022;
  return (cerebrum || temporal || cerebellum || stem) && !fissure;
}

const inCerebellum = (u, v) => v < -0.36 && inEllipse(u, v, 0.6, -0.58, 0.3, 0.2);

// Zero lines of a warped wave read as folds (gyri) when particles gather on them.
const fold = (u, v) =>
  Math.abs(Math.sin(u * 11 + Math.sin(v * 7.3) * 1.8) + Math.cos(v * 12.5 + Math.sin(u * 6.1) * 1.5));

/** A particle of the brain formation: dense outline, folds inside, striped cerebellum. */
export function brainPoint(r) {
  for (let k = 0; k < 80; k++) {
    const u = r() * 2.1 - 1.05;
    const v = r() * 1.95 - 1.02;
    if (!inBrain(u, v)) continue;
    const e = 0.04;
    const edge = !(inBrain(u + e, v) && inBrain(u - e, v) && inBrain(u, v + e) && inBrain(u, v - e));
    const keep = edge
      ? true
      : inCerebellum(u, v)
        ? Math.abs(Math.sin(v * 46 + u * 5)) < 0.4
        : fold(u, v) < 0.26 || r() < 0.035;
    if (keep) return [u * BRAIN_W, v * BRAIN_H, (r() * 2 - 1) * 0.35];
  }
  return [0, 0, 0];
}

const chainX = (k) => (k - 2) * CHAIN_GAP;
const chainY = (k) => (k % 2 ? -0.28 : 0.28);
const smooth = (t) => t * t * (3 - 2 * t);
const hash = (n) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** A particle of neuron k (0..4) in the chain: soma, branching dendrites, axon. */
export function neuronPoint(r, k) {
  const cx = chainX(k);
  const cy = chainY(k);
  const part = r();
  if (part < 0.26) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.17;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (r() * 2 - 1) * 0.12];
  }
  if (part < 0.8) {
    // six dendrites fanning from top through left to bottom, each forking once
    const b = Math.floor(r() * 6);
    const h = hash(k * 13 + b);
    const ang = Math.PI * 0.5 + (b / 5) * Math.PI + (h - 0.5) * 0.35;
    const len = 0.55 + h * 0.3;
    const t = r();
    let x = Math.cos(ang) * (0.15 + t * len);
    let y = Math.sin(ang) * (0.15 + t * len);
    if (t > 0.55) {
      const fa = ang + (r() < 0.5 ? -0.45 : 0.45);
      const s = t - 0.55;
      x = Math.cos(ang) * (0.15 + 0.55 * len) + Math.cos(fa) * s * len;
      y = Math.sin(ang) * (0.15 + 0.55 * len) + Math.sin(fa) * s * len;
    }
    const n = (r() * 2 - 1) * 0.018 * (1.2 - t);
    return [cx + x - Math.sin(ang) * n, cy + y + Math.cos(ang) * n, (r() * 2 - 1) * 0.06];
  }
  // axon towards the next neuron's dendrites (the last one ends in a short tail)
  const t = r();
  const [x0, y0, x1, y1] = axonEnds(k);
  if (t > 0.93 && k < 4) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.07;
    return [x1 + Math.cos(a) * rr, y1 + Math.sin(a) * rr, (r() * 2 - 1) * 0.05];
  }
  const n = (r() * 2 - 1) * 0.012;
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * smooth(t) + n, (r() * 2 - 1) * 0.04];
}

// Same path as the impulses in axonVertex: from the soma to the next dendrites.
function axonEnds(k) {
  const x0 = chainX(k) + 0.17;
  const y0 = chainY(k);
  if (k >= 4) return [x0, y0, x0 + 0.9, y0 + 0.12];
  return [x0, y0, chainX(k) + CHAIN_GAP - 0.62, chainY(k + 1)];
}

// ── GLSL shared by the three layers ──

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform float uNField;
  uniform float uNBrain;
  uniform float uNFive;
  uniform vec2 uCenter;

  vec3 nodePos(vec3 f, vec3 b, vec3 v, vec2 s) {
    vec3 c = vec3(uCenter, 0.0);
    vec3 p = f * uNField + (b + c) * uNBrain + (v + c) * uNFive;
    float loose = uNField + 0.25 * (uNBrain + uNFive);
    p += vec3(
      sin(uTime * 0.31 + s.x * 6.2831),
      cos(uTime * 0.27 + s.y * 6.2831),
      sin(uTime * 0.2 + s.x * 3.0)
    ) * 0.14 * loose;
    return p;
  }

  float maxLen() { return uNField * 2.5 + uNBrain * 1.1 + uNFive * 0.95; }
`;

const HASH = /* glsl */ `
  float hash(float n) { return fract(sin(n) * 43758.5453); }
`;

// Every line vertex knows both ends of its synapse so it can fade long ones.
const EDGE_ATTRS = /* glsl */ `
  attribute vec3 aFA; attribute vec3 aBA; attribute vec3 aVA; attribute vec2 aSA;
  attribute vec3 aFB; attribute vec3 aBB; attribute vec3 aVB; attribute vec2 aSB;
  attribute vec3 aRun;  // x: end (0|1), y: phase, z: speed
`;

const lineVertex = /* glsl */ `
  ${COMMON}
  ${EDGE_ATTRS}
  varying float vT;
  varying vec2 vRun;
  varying float vFade;
  void main() {
    vec3 a = nodePos(aFA, aBA, aVA, aSA);
    vec3 b = nodePos(aFB, aBB, aVB, aSB);
    float m = maxLen();
    vFade = 1.0 - smoothstep(m * 0.55, m, length(a - b));
    vFade *= mix(0.35, 1.0, clamp((a.z + 4.0) / 6.0, 0.0, 1.0));
    vT = aRun.x;
    vRun = aRun.yz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(a, 1.0);
  }
`;

const lineFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform float uRate;
  uniform float uBase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vT;
  varying vec2 vRun;
  varying float vFade;
  ${HASH}
  void main() {
    float run = uTime * vRun.y + vRun.x;
    float on = step(1.0 - uRate, hash(floor(run) + vRun.x * 113.0));
    float t = mix(vT, 1.0 - vT, step(0.5, fract(vRun.x * 7.0)));
    float d = fract(run) - t;
    float glow = step(0.0, d) * (1.0 - smoothstep(0.0, 0.24, d)) * on;
    float a = (uBase + glow * 0.95) * vFade * uAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uColorA, uColorB, glow), a);
  }
`;

// The bright head of each impulse, riding the same timing as its synapse glow.
const packetVertex = /* glsl */ `
  ${COMMON}
  ${EDGE_ATTRS}
  ${HASH}
  uniform float uAlpha;
  uniform float uRate;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    vec3 a = nodePos(aFA, aBA, aVA, aSA);
    vec3 b = nodePos(aFB, aBB, aVB, aSB);
    float m = maxLen();
    float fade = 1.0 - smoothstep(m * 0.55, m, length(a - b));
    float run = uTime * aRun.z + aRun.y;
    float on = step(1.0 - uRate, hash(floor(run) + aRun.y * 113.0));
    float t = fract(run);
    vec3 from = mix(a, b, step(0.5, fract(aRun.y * 7.0)));
    vec3 to = mix(b, a, step(0.5, fract(aRun.y * 7.0)));
    vec3 p = mix(from, to, t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * 3.0 / -mv.z;
    vAlpha = on * fade * uAlpha * sin(3.14159 * t);
  }
`;

const axonVertex = /* glsl */ `
  uniform float uTime;
  uniform float uNFive;
  uniform vec2 uCenter;
  uniform float uAlpha;
  uniform float uSize;
  attribute vec3 aAxon;  // x: neuron 0..3, y: phase, z: speed
  varying float vAlpha;
  void main() {
    float k = aAxon.x;
    float t = fract(uTime * aAxon.z + aAxon.y);
    float cx = (k - 2.0) * ${CHAIN_GAP.toFixed(2)};
    float cy = mod(k, 2.0) > 0.5 ? -0.28 : 0.28;
    vec2 p0 = vec2(cx + 0.17, cy);
    vec2 p1 = vec2(cx + ${(CHAIN_GAP - 0.62).toFixed(2)}, -cy);
    vec2 p = vec2(mix(p0.x, p1.x, t), mix(p0.y, p1.y, smoothstep(0.0, 1.0, t)));
    vec4 mv = modelViewMatrix * vec4(p + uCenter, 0.05, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * 3.6 / -mv.z;
    vAlpha = uNFive * uAlpha * sin(3.14159 * t);
  }
`;

const nodeVertex = /* glsl */ `
  ${COMMON}
  attribute vec3 aF; attribute vec3 aB; attribute vec3 aV; attribute vec2 aS;
  uniform float uAlpha;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    vec3 p = nodePos(aF, aB, aV, aS);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aS.x) + aS.y * 40.0);
    gl_PointSize = uSize * mix(1.8, 3.8, aS.x * aS.x) / -mv.z;
    vAlpha = uAlpha * twinkle * mix(0.35, 1.0, clamp((p.z + 4.0) / 6.0, 0.0, 1.0));
  }
`;

const glowFragment = (color) => /* glsl */ `
  uniform vec3 ${color};
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    if (a * vAlpha < 0.004) discard;
    gl_FragColor = vec4(${color}, a * vAlpha);
  }
`;

// ── Geometry ──

function layouts(r) {
  const field = [];
  const brain = [];
  const five = [];
  const seed = [];
  for (let i = 0; i < NODES; i++) {
    let u = 0;
    let v = 0;
    for (let k = 0; k < 200; k++) {
      u = r() * 2.1 - 1.05;
      v = r() * 1.95 - 1.02;
      if (inBrain(u, v)) break;
    }
    const b = [u * BRAIN_W, v * BRAIN_H, (r() * 2 - 1) * 0.45];
    brain.push(b);
    field.push([b[0] * 2.65 + (r() - 0.5) * 0.7, b[1] * 1.5 + (r() - 0.5) * 0.7, -3.2 + r() * 4]);
    // around one of the five neurons, mostly on its dendrite side
    const k = i % 5;
    const a = Math.PI * 0.45 + r() * Math.PI * 1.1;
    const rr = 0.22 + r() * 0.6;
    five.push([chainX(k) + Math.cos(a) * rr, chainY(k) + Math.sin(a) * rr, (r() * 2 - 1) * 0.2]);
    seed.push([r(), r()]);
  }
  return { field, brain, five, seed };
}

function synapses(brain) {
  const pairs = new Set();
  const out = [];
  for (let i = 0; i < brain.length; i++) {
    const near = brain
      .map((p, j) => [j, (p[0] - brain[i][0]) ** 2 + (p[1] - brain[i][1]) ** 2 + (p[2] - brain[i][2]) ** 2])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, NEIGHBOURS);
    for (const [j] of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      out.push([i, j]);
    }
  }
  return out;
}

function edgeGeometry(L, edges, vertsPerEdge) {
  const n = edges.length * vertsPerEdge;
  const attr = {
    aFA: new Float32Array(n * 3), aBA: new Float32Array(n * 3), aVA: new Float32Array(n * 3), aSA: new Float32Array(n * 2),
    aFB: new Float32Array(n * 3), aBB: new Float32Array(n * 3), aVB: new Float32Array(n * 3), aSB: new Float32Array(n * 2),
    aRun: new Float32Array(n * 3),
  };
  let w = 0;
  edges.forEach(([i, j], e) => {
    const phase = hash(e * 3.7 + 1);
    const speed = 0.35 + hash(e * 5.1 + 2) * 0.45;
    for (let s = 0; s < vertsPerEdge; s++) {
      const [own, other] = s === 0 ? [i, j] : [j, i];
      attr.aFA.set(L.field[own], w * 3); attr.aBA.set(L.brain[own], w * 3); attr.aVA.set(L.five[own], w * 3); attr.aSA.set(L.seed[own], w * 2);
      attr.aFB.set(L.field[other], w * 3); attr.aBB.set(L.brain[other], w * 3); attr.aVB.set(L.five[other], w * 3); attr.aSB.set(L.seed[other], w * 2);
      attr.aRun.set([s, phase, speed], w * 3);
      w++;
    }
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(attr.aFA, 3));
  for (const [k, v] of Object.entries(attr)) geo.setAttribute(k, new BufferAttribute(v, k.startsWith('aS') ? 2 : 3));
  return geo;
}

function nodeGeometry(L) {
  const geo = new BufferGeometry();
  const flat = (arr) => new Float32Array(arr.flat());
  geo.setAttribute('position', new BufferAttribute(flat(L.field), 3));
  geo.setAttribute('aF', new BufferAttribute(flat(L.field), 3));
  geo.setAttribute('aB', new BufferAttribute(flat(L.brain), 3));
  geo.setAttribute('aV', new BufferAttribute(flat(L.five), 3));
  geo.setAttribute('aS', new BufferAttribute(flat(L.seed), 2));
  return geo;
}

function axonGeometry() {
  const axon = new Float32Array(AXON_PACKETS * 3);
  for (let i = 0; i < AXON_PACKETS; i++) axon.set([i % 4, hash(i * 9.3), 0.28 + hash(i * 4.4) * 0.22], i * 3);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(AXON_PACKETS * 3), 3));
  geo.setAttribute('aAxon', new BufferAttribute(axon, 3));
  return geo;
}

// ── Layer ──

const FORM_WEIGHTS = {
  field: { uNField: 1, uNBrain: 0, uNFive: 0 },
  cross: { uNField: 0, uNBrain: 1, uNFive: 0 },
  ten: { uNField: 0, uNBrain: 0, uNFive: 1 },
  multiply: { uNField: 1, uNBrain: 0, uNFive: 0 },
};
FORM_WEIGHTS.mark = FORM_WEIGHTS.brain = FORM_WEIGHTS.cross;
FORM_WEIGHTS.marks = FORM_WEIGHTS.neurons = FORM_WEIGHTS.ten;

const BASE_RATE = 0.42;

/**
 * @param {object} shared  uniforms owned by the background: { uTime, uCenter, uSize }
 * @param {(seed:number)=>()=>number} rand  the background's seeded RNG
 */
export function createNeural(shared, rand) {
  const r = rand(4242);
  const L = layouts(r);
  const edges = synapses(L.brain);

  const uniforms = {
    uTime: shared.uTime,
    uCenter: shared.uCenter,
    uSize: shared.uSize,
    uNField: { value: 1 },
    uNBrain: { value: 0 },
    uNFive: { value: 0 },
    uAlpha: { value: 0.9 },
    uRate: { value: BASE_RATE },
    uBase: { value: 0.16 },
    uColorA: { value: new Color('#9D86FF') },
    uColorB: { value: new Color('#4FE0C0') },
  };

  const material = (vertexShader, fragmentShader) =>
    new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });

  const lines = new LineSegments(edgeGeometry(L, edges, 2), material(lineVertex, lineFragment));
  // one packet per synapse, at the head of its glow
  const packets = new Points(edgeGeometry(L, edges, 1), material(packetVertex, glowFragment('uColorB')));
  const nodes = new Points(nodeGeometry(L), material(nodeVertex, glowFragment('uColorA')));
  const axons = new Points(axonGeometry(), material(axonVertex, glowFragment('uColorB')));
  const objects = [lines, nodes, packets, axons];
  objects.forEach((o) => {
    o.frustumCulled = false;
  });

  let baseAlpha = 0.9;
  let alphaScale = 1;

  function setForm(form, duration = 1.6) {
    const w = FORM_WEIGHTS[form] || FORM_WEIGHTS.field;
    for (const k of Object.keys(w)) gsap.to(uniforms[k], { value: w[k], duration, ease: 'expo.inOut' });
  }

  function setAlpha(scale) {
    alphaScale = scale;
    gsap.to(uniforms.uAlpha, { value: baseAlpha * scale, duration: 0.8, ease: 'power2.out' });
  }

  /** A burst of impulses through every synapse (slide change, a key moment). */
  function fire(strength = 1) {
    gsap.killTweensOf(uniforms.uRate);
    gsap.fromTo(
      uniforms.uRate,
      { value: Math.min(1, BASE_RATE + strength * 0.58) },
      { value: BASE_RATE, duration: 2.4, ease: 'power2.out' },
    );
  }

  function setTheme(palette) {
    uniforms.uColorA.value.set(palette.gold);
    uniforms.uColorB.value.set(palette.cyan);
    uniforms.uBase.value = palette.blending === NormalBlending ? 0.22 : 0.16;
    baseAlpha = palette.blending === NormalBlending ? 0.75 : 0.9;
    objects.forEach((o) => {
      o.material.blending = palette.blending;
      o.material.needsUpdate = true;
    });
    uniforms.uAlpha.value = baseAlpha * alphaScale;
  }

  return { objects, setForm, setAlpha, fire, setTheme };
}
