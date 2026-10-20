// The 3D brain on the home page: cortex dust, neurons, synapses and the light of
// impulses travelling between them. Drag to turn it; the mouse also tilts it and
// fires the neurons it passes over, and a click sets off a burst. Data streams in
// from the edges of the screen and lights up the brain; the brain streams light out
// to the words of the quote below (emit(), driven by quotes.js).
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  LineSegments,
  AdditiveBlending,
  Color,
  Vector3,
} from 'three';
import { buildBrain, LEFT, RIGHT } from './shape.js';
import { Pulses, pointAt } from './pulses.js';

const FOV = 30;
const CAM_Z = 10;
const RADIUS = 1.08; // brain units: a sphere around the brain, for depth fading
const BASE_PITCH = 0.24;
const AUTO_YAW = 0.11; // rad/s
const TRAIL = 6; // points per pulse: the head and a fading tail
const MAX_PULSES = 300;
const MAX_STREAM_PTS = 420;

const PALETTE = {
  gold: new Color('#F4C352'),
  cyan: new Color('#62D9FF'),
  fold: new Color('#7D8DFF'),
  fill: new Color('#4E5BBE'),
  folia: new Color('#9C88FF'),
  node: new Color('#93A8FF'),
  line: new Color('#3C4BA6'),
};

const DEPTH = /* glsl */ `
  uniform vec2 uDepth;
  float depthOf(vec4 mv) { return clamp((-mv.z - uDepth.x) / (uDepth.y - uDepth.x), 0.0, 1.0); }
`;

const dustShader = {
  vertexShader: /* glsl */ `
    ${DEPTH}
    uniform float uTime, uScale, uSize, uAct;
    attribute float aKind;
    attribute float aSeed;
    varying float vA;
    varying float vKind;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      float d = depthOf(mv);
      float tw = 0.72 + 0.28 * sin(uTime * (0.6 + aSeed * 1.7) + aSeed * 43.0);
      float k = aKind < 0.5 ? 1.0 : aKind < 1.5 ? 0.55 : aKind < 2.5 ? 0.9 : 0.75;
      vA = k * tw * mix(1.0, 0.13, d) * (0.82 + uAct * 0.4);
      vKind = aKind;
      gl_PointSize = uSize * uScale / -mv.z * mix(1.0, 0.7, d);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uFold, uFill, uFolia;
    varying float vA;
    varying float vKind;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float r = dot(c, c) * 4.0;
      if (r > 1.0) discard;
      vec3 col = vKind < 0.5 ? uFold : vKind < 1.5 ? uFill : uFolia;
      gl_FragColor = vec4(col, (1.0 - r) * (1.0 - r) * vA);
    }
  `,
};

const lineShader = {
  vertexShader: /* glsl */ `
    ${DEPTH}
    attribute float aGlow;
    attribute float aHue;
    varying float vG;
    varying float vH;
    varying float vD;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      vD = depthOf(mv);
      vG = aGlow;
      vH = aHue;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uBase, uGold, uCyan;
    uniform float uBaseA;
    varying float vG;
    varying float vH;
    varying float vD;
    void main() {
      float g = clamp(vG, 0.0, 1.0);
      vec3 col = mix(uBase, mix(uGold, uCyan, vH), g);
      gl_FragColor = vec4(col, (uBaseA + g * 0.9) * mix(1.0, 0.2, vD));
    }
  `,
};

const nodeShader = {
  vertexShader: /* glsl */ `
    ${DEPTH}
    uniform float uTime, uScale, uSize;
    attribute float aAct;
    attribute float aHue;
    attribute float aSeed;
    varying float vAct;
    varying float vHue;
    varying float vA;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      vAct = aAct;
      vHue = aHue;
      vA = mix(1.0, 0.18, depthOf(mv));
      float breathe = 0.85 + 0.15 * sin(uTime * 1.7 + aSeed * 30.0);
      gl_PointSize = uSize * (1.0 + aAct * 2.8) * breathe * uScale / -mv.z;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uNode, uGold, uCyan;
    varying float vAct;
    varying float vHue;
    varying float vA;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      float core = smoothstep(0.45, 0.0, r);
      float halo = pow(1.0 - r, 2.0);
      vec3 col = mix(uNode, mix(uGold, uCyan, vHue), vAct);
      col = mix(col, vec3(1.0), core * vAct * 0.7);
      gl_FragColor = vec4(col, (core * 0.8 + halo * (0.15 + vAct * 0.7)) * vA * (0.5 + vAct * 0.5));
    }
  `,
};

const pulseShader = {
  vertexShader: /* glsl */ `
    ${DEPTH}
    uniform float uScale, uSize;
    attribute float aAlpha;
    attribute float aSize;
    attribute float aHue;
    varying float vA;
    varying float vHue;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      vA = aAlpha * mix(1.0, 0.3, depthOf(mv));
      vHue = aHue;
      gl_PointSize = uSize * aSize * uScale / -mv.z;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uGold, uCyan;
    varying float vA;
    varying float vHue;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      float core = smoothstep(0.3, 0.0, r);
      float halo = pow(1.0 - r, 2.4);
      vec3 col = mix(mix(uGold, uCyan, vHue), vec3(1.0, 0.98, 0.92), core);
      gl_FragColor = vec4(col, (core + halo * 0.7) * vA);
    }
  `,
};

function material(shader, uniforms) {
  return new ShaderMaterial({
    ...shader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
}

function geometry(attrs) {
  const g = new BufferGeometry();
  for (const [name, [array, size, dynamic]] of Object.entries(attrs)) {
    const a = new BufferAttribute(array, size);
    if (dynamic) a.setUsage(35048); // DynamicDrawUsage
    g.setAttribute(name, a);
  }
  return g;
}

const ease = (t) => t * t * (3 - 2 * t);

/**
 * Builds the scene on `canvas` and starts it. `stage` is the element whose box the
 * brain fills; `onFrame(activity)` runs every frame with how busy the brain is (0..1).
 * Throws when WebGL is unavailable.
 */
export function createBrain(canvas, { stage, reduced = false, onFrame } = {}) {
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_Z);
  const scene = new Scene();
  const pivot = new Group(); // position, scale and rotation (around the brain's centre)
  const inner = new Group(); // lifts the brain so its centre sits on the pivot
  inner.position.y = 0.16;
  pivot.add(inner);
  scene.add(pivot);

  const brain = buildBrain({ seed: 10, dust: small ? 9500 : 16000, nodes: small ? 420 : 640 });
  const nodeCount = brain.nodes.region.length;
  const pulses = new Pulses(brain, { max: MAX_PULSES });

  // Shared uniforms: point scale and depth range change on resize.
  const uScale = { value: 1 };
  const uDepth = { value: [CAM_Z - 2, CAM_Z + 2] };
  const uTime = { value: 0 };
  const uAct = { value: 0 };
  const gold = { value: PALETTE.gold };
  const cyan = { value: PALETTE.cyan };

  // Cortex dust.
  const dustMat = material(dustShader, {
    uTime, uScale, uDepth, uAct,
    uSize: { value: 0.013 },
    uFold: { value: PALETTE.fold },
    uFill: { value: PALETTE.fill },
    uFolia: { value: PALETTE.folia },
  });
  inner.add(new Points(geometry({ position: [brain.dust.pos, 3], aKind: [brain.dust.kind, 1], aSeed: [brain.dust.seed, 1] }), dustMat));

  // Synapses: one line segment per polyline step; glow and hue per vertex.
  const segStart = new Int32Array(brain.conns.length);
  let segs = 0;
  brain.conns.forEach((c, i) => {
    segStart[i] = segs;
    segs += c.cum.length - 1;
  });
  const linePos = new Float32Array(segs * 6);
  brain.conns.forEach((c, i) => {
    for (let j = 0; j < c.cum.length - 1; j++) linePos.set(c.pts.subarray(j * 3, j * 3 + 6), (segStart[i] + j) * 6);
  });
  const glow = new Float32Array(segs * 2);
  const glowHue = new Float32Array(segs * 2);
  const lineGeo = geometry({ position: [linePos, 3], aGlow: [glow, 1, true], aHue: [glowHue, 1, true] });
  const lineMat = material(lineShader, { uDepth, uBase: { value: PALETTE.line }, uGold: gold, uCyan: cyan, uBaseA: { value: 0.085 } });
  inner.add(new LineSegments(lineGeo, lineMat));

  // Neurons.
  const act = new Float32Array(nodeCount);
  const actHue = new Float32Array(nodeCount);
  const nodeSeed = Float32Array.from({ length: nodeCount }, () => Math.random());
  const nodeGeo = geometry({ position: [brain.nodes.pos, 3], aAct: [act, 1, true], aHue: [actHue, 1, true], aSeed: [nodeSeed, 1] });
  const nodeMat = material(nodeShader, { uTime, uScale, uDepth, uSize: { value: 0.024 }, uNode: { value: PALETTE.node }, uGold: gold, uCyan: cyan });
  inner.add(new Points(nodeGeo, nodeMat));

  // Pulses (brain space) and streams (world space) share one look.
  const makeSprites = (max, size, depth) => {
    const pos = new Float32Array(max * 3);
    const alpha = new Float32Array(max);
    const sz = new Float32Array(max);
    const hue = new Float32Array(max);
    const geo = geometry({ position: [pos, 3, true], aAlpha: [alpha, 1, true], aSize: [sz, 1, true], aHue: [hue, 1, true] });
    geo.setDrawRange(0, 0);
    const mat = material(pulseShader, { uScale, uDepth: depth, uSize: { value: size }, uGold: gold, uCyan: cyan });
    return { pos, alpha, sz, hue, geo, points: new Points(geo, mat), mat };
  };
  const pulseSprites = makeSprites(MAX_PULSES * TRAIL, 0.075, uDepth);
  inner.add(pulseSprites.points);
  const streamDepth = { value: [CAM_Z - 6, CAM_Z + 6] };
  const streamSprites = makeSprites(MAX_STREAM_PTS, 0.075, streamDepth);
  scene.add(streamSprites.points);

  // ── Layout ──
  let width = 0;
  let height = 0;
  let unit = 1; // world units per brain unit (the pivot's scale)
  const worldPerPx = () => (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / height;

  /** World point on the plane z = planeZ under screen pixel (px, py). */
  const screenToWorld = (px, py, out, planeZ = 0) => {
    out.set((px / width) * 2 - 1, -(py / height) * 2 + 1, 0.5).unproject(camera);
    out.sub(camera.position).normalize();
    const t = (planeZ - camera.position.z) / out.z;
    return out.multiplyScalar(t).add(camera.position);
  };

  function layout() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, small ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // gl_PointSize = size × uScale / depth gives `size` world units at that depth.
    uScale.value = (height * dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
    const box = stage.getBoundingClientRect();
    const wpp = worldPerPx();
    // Fit the brain stem's tip too; on narrow screens the side view may touch the edges.
    unit = Math.min((box.width * wpp) / (box.width < 600 ? 2.05 : 2.3), (box.height * wpp) / 2.02);
    pivot.scale.setScalar(unit);
    screenToWorld(box.left + box.width / 2, box.top + box.height * 0.47, pivot.position);
    const r = RADIUS * unit;
    uDepth.value = [CAM_Z - r, CAM_Z + r];
    // Sizes are in brain units; the pivot scales positions, not point sizes.
    dustMat.uniforms.uSize.value = (small ? 0.017 : 0.013) * unit;
    nodeMat.uniforms.uSize.value = 0.024 * unit;
    pulseSprites.mat.uniforms.uSize.value = 0.075 * unit;
    streamSprites.mat.uniforms.uSize.value = 0.06 * unit;
  }

  // ── Rotation: auto-turn, drag with inertia, mouse parallax ──
  const rot = { yaw: -0.55, pitch: BASE_PITCH, vyaw: reduced ? 0 : AUTO_YAW };
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag = null;
  let pointer = null; // last mouse position, for hover firing

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
    rot.vyaw = 0;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const now = performance.now();
    const dt = Math.max(8, now - drag.t) / 1000;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = now;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    const k = 0.0062;
    rot.yaw += dx * k;
    rot.pitch = Math.min(0.9, Math.max(-0.6, rot.pitch + dy * k * 0.7));
    rot.vyaw = rot.vyaw * 0.6 + ((dx * k) / dt) * 0.4;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved < 6) burst(e.clientX, e.clientY);
    drag = null;
    canvas.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer = { x: e.clientX, y: e.clientY, fresh: true };
    if (!reduced) {
      tilt.tx = (e.clientX / width - 0.5) * 0.5;
      tilt.ty = (e.clientY / height - 0.5) * 0.28;
    }
  });
  document.addEventListener('mouseleave', () => {
    pointer = null;
    tilt.tx = 0;
    tilt.ty = 0;
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') rot.yaw -= 0.3;
    if (e.key === 'ArrowRight') rot.yaw += 0.3;
  });
  addEventListener('resize', layout);

  // ── Neurons on screen ──
  const tmp = new Vector3();
  const center = new Vector3();
  const nodeWorld = (i, out) => out.fromArray(brain.nodes.pos, i * 3).applyMatrix4(inner.matrixWorld);

  /** Nearest neuron facing the camera within maxPx of the screen point, or -1. */
  function nodeAt(px, py, maxPx) {
    pivot.getWorldPosition(center);
    let best = -1;
    let bestD = maxPx * maxPx;
    for (let i = 0; i < nodeCount; i++) {
      nodeWorld(i, tmp);
      if (tmp.z < center.z - 0.1 * unit) continue;
      tmp.project(camera);
      const d = ((tmp.x + 1) * 0.5 * width - px) ** 2 + ((1 - tmp.y) * 0.5 * height - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  const fire = (node, opts) => {
    act[node] = 1;
    actHue[node] = opts.hue ?? 0;
    pulses.seed(node, opts);
  };

  function burst(px, py) {
    const n = nodeAt(px, py, 90);
    if (n >= 0) fire(n, { fan: 5, maxGen: 22, hue: 0, speed: 1.15 });
  }

  let lastHover = { node: -1, t: 0 };
  function hover(time) {
    if (!pointer?.fresh || drag) return;
    pointer.fresh = false;
    if (time - lastHover.t < 0.07) return;
    const n = nodeAt(pointer.x, pointer.y, 30);
    if (n < 0 || (n === lastHover.node && time - lastHover.t < 0.6)) return;
    lastHover = { node: n, t: time };
    fire(n, { fan: 2, maxGen: 9, hue: 0, speed: 1.2 });
  }

  // ── Streams: data in from the screen edges, words out to the quote ──
  const streams = [];
  const cortex = [...brain.nodes.region.keys()].filter((i) => brain.nodes.region[i] === LEFT || brain.nodes.region[i] === RIGHT);

  function streamIn() {
    const node = cortex[Math.floor(Math.random() * cortex.length)];
    const side = Math.floor(Math.random() * 4);
    const along = Math.random();
    const px = side === 0 ? -40 : side === 1 ? width + 40 : along * width;
    const py = side === 2 ? -40 : side === 3 ? height + 40 : along * height;
    const from = screenToWorld(px, py, new Vector3(), (Math.random() - 0.5) * 3);
    nodeWorld(node, tmp);
    const ctrl = from.clone().lerp(tmp, 0.5).add(new Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, Math.random() * 2));
    streams.push({ from, ctrl, node, t: 0, dur: 1.6 + Math.random() * 0.9, n: 7, gap: 0.03, hue: 1, landed: false });
  }

  /**
   * Sends one packet of light from the brain to the screen point target() returns
   * (read every frame, so it follows the layout) and calls onArrive when it lands.
   */
  function emit(target, onArrive) {
    // Leave from a lower neuron facing the viewer, the side nearest the quote.
    let node = cortex[0];
    let lowest = Infinity;
    pivot.getWorldPosition(center);
    for (let k = 0; k < 24; k++) {
      const i = cortex[Math.floor(Math.random() * cortex.length)];
      nodeWorld(i, tmp);
      const score = tmp.y - (tmp.z - center.z) * 0.6 + Math.random() * 0.3 * unit;
      if (score < lowest) {
        lowest = score;
        node = i;
      }
    }
    act[node] = 1;
    actHue[node] = 0;
    streams.push({ node, target, onArrive, t: 0, dur: 0.85, n: 5, gap: 0.035, hue: 0, out: true, side: (Math.random() - 0.5) * 1.6 });
  }

  const p0 = new Vector3();
  const p1 = new Vector3();
  const p2 = new Vector3();
  const bez = (u, out) => {
    const v = 1 - u;
    return out.set(
      v * v * p0.x + 2 * v * u * p1.x + u * u * p2.x,
      v * v * p0.y + 2 * v * u * p1.y + u * u * p2.y,
      v * v * p0.z + 2 * v * u * p1.z + u * u * p2.z,
    );
  };

  function updateStreams(dt) {
    const s = streamSprites;
    let k = 0;
    for (let i = streams.length - 1; i >= 0; i--) {
      const st = streams[i];
      st.t += dt / st.dur;
      if (st.out) {
        nodeWorld(st.node, p0);
        const [tx, ty] = st.target();
        screenToWorld(tx, ty, p2);
        p1.set((p0.x + p2.x) / 2 + st.side * unit, p0.y + (p2.y - p0.y) * 0.25, 1.4 * unit);
      } else {
        p0.copy(st.from);
        p1.copy(st.ctrl);
        nodeWorld(st.node, p2);
      }
      if (!st.landed && st.t >= 1) {
        st.landed = true;
        if (st.out) st.onArrive?.();
        else fire(st.node, { fan: 3, maxGen: 18, hue: 1, speed: 1 });
      }
      if (st.t - st.n * st.gap >= 1) {
        streams.splice(i, 1);
        continue;
      }
      for (let j = 0; j < st.n && k < MAX_STREAM_PTS; j++) {
        const u = st.t - j * st.gap;
        if (u < 0 || u > 1) continue;
        bez(st.out ? 1 - (1 - u) * (1 - u) : u ** 1.25, tmp).toArray(s.pos, k * 3);
        s.alpha[k] = (1 - j / st.n) ** 1.6 * Math.min(1, u * 6);
        s.sz[k] = j === 0 ? 1 : 0.7 - j * 0.07;
        s.hue[k] = st.hue;
        k++;
      }
    }
    s.geo.setDrawRange(0, k);
    for (const name of ['position', 'aAlpha', 'aSize', 'aHue']) s.geo.attributes[name].needsUpdate = true;
  }

  // ── Pulses ──
  const out = [0, 0, 0];
  function updatePulses(dt) {
    pulses.update(dt, (node, p) => {
      act[node] = 1;
      actHue[node] = p.hue;
    });
    const s = pulseSprites;
    let k = 0;
    for (let i = 0; i < pulses.count; i++) {
      const p = pulses.list[i];
      const c = brain.conns[p.conn];
      // light the segment under the head
      const j = pointAt(c.pts, c.cum, p.forward ? p.d : c.len - p.d, out);
      const seg = (segStart[p.conn] + j) * 2;
      glow[seg] = glow[seg + 1] = 1;
      glowHue[seg] = glowHue[seg + 1] = p.hue;
      for (let t = 0; t < TRAIL; t++) {
        pulses.position(i, t * 0.022, out);
        s.pos.set(out, k * 3);
        s.alpha[k] = t === 0 ? 1 : (1 - t / TRAIL) ** 1.8 * 0.55;
        s.sz[k] = t === 0 ? 1 : 0.55 - t * 0.05;
        s.hue[k] = p.hue;
        k++;
      }
    }
    s.geo.setDrawRange(0, k);
    for (const name of ['position', 'aAlpha', 'aSize', 'aHue']) s.geo.attributes[name].needsUpdate = true;
  }

  function decay(dt) {
    const g = Math.exp(-dt * 1.7);
    for (let i = 0; i < glow.length; i++) glow[i] *= g;
    const a = Math.exp(-dt * 3);
    for (let i = 0; i < nodeCount; i++) act[i] *= a;
    lineGeo.attributes.aGlow.needsUpdate = true;
    lineGeo.attributes.aHue.needsUpdate = true;
    nodeGeo.attributes.aAct.needsUpdate = true;
    nodeGeo.attributes.aHue.needsUpdate = true;
  }

  // ── Loop ──
  let last = performance.now();
  let clock = 0;
  let nextSeed = 0;
  let nextStream = 0.6;
  let activity = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    uTime.value = clock;

    if (!drag) {
      rot.vyaw += ((reduced ? 0 : AUTO_YAW) - rot.vyaw) * (1 - Math.exp(-dt * 1.4));
      rot.yaw += rot.vyaw * dt;
      rot.pitch += (BASE_PITCH - rot.pitch) * (1 - Math.exp(-dt * 0.5));
    }
    tilt.x += (tilt.tx - tilt.x) * (1 - Math.exp(-dt * 2.5));
    tilt.y += (tilt.ty - tilt.y) * (1 - Math.exp(-dt * 2.5));
    pivot.rotation.set(rot.pitch + tilt.y, rot.yaw + tilt.x, 0);
    pivot.updateMatrixWorld();

    // Spontaneous thought, and data arriving from outside.
    if (clock >= nextSeed) {
      nextSeed = clock + (reduced ? 0.7 : 0.16 + Math.random() * 0.2);
      const n = Math.floor(Math.random() * nodeCount);
      fire(n, { fan: 1 + (Math.random() < 0.4), maxGen: 12 + Math.floor(Math.random() * 8), hue: 0, speed: reduced ? 0.6 : 1 });
    }
    if (!reduced && clock >= nextStream) {
      nextStream = clock + 1.0 + Math.random() * 0.9;
      streamIn();
    }

    hover(clock);
    updatePulses(dt);
    updateStreams(dt);
    decay(dt);

    activity += (Math.min(1, pulses.count / (MAX_PULSES * 0.55)) - activity) * (1 - Math.exp(-dt * 3));
    uAct.value = activity;
    onFrame?.(activity);
    renderer.render(scene, camera);
  }

  layout();
  renderer.setAnimationLoop(frame);
  return { emit, layout };
}
