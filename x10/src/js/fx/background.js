// WebGL background: gold particles that drift, gather into one ×, split into
// ten ×, or multiply (1 → 2 → 4 → … → 4096) on the waiting screen.
// All motion happens in the vertex shader; the CPU only animates a few uniforms.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Color,
  AdditiveBlending,
  NormalBlending,
} from 'three';
import { gsap } from '../core/motion.js';

const COUNT = 4096; // 2^12: the multiply loop doubles up to exactly this
const FIELD_W = 26;

const vertex = /* glsl */ `
  attribute vec3 aField;
  attribute vec3 aParent;
  attribute vec3 aCross;
  attribute vec3 aTen;
  attribute vec4 aSeed;   // x,y: phase  z: size  w: type/tint
  attribute float aGen;   // generation in the 1→4096 doubling tree

  uniform float uTime;
  uniform float uField;
  uniform float uCross;
  uniform float uTen;
  uniform float uGen;
  uniform float uOffset;
  uniform float uPulse;
  uniform float uPulseR;
  uniform float uAlpha;
  uniform float uDensity;
  uniform float uFormAlpha;
  uniform float uSize;
  uniform vec2 uCenter;

  varying float vAlpha;
  varying float vType;
  varying float vTint;

  float wrapX(float x, float depth) {
    return mod(x + uOffset * (0.35 + depth) + ${FIELD_W / 2}.0, ${FIELD_W}.0) - ${FIELD_W / 2}.0;
  }

  void main() {
    float depth = clamp((aField.z + 8.0) / 11.0, 0.0, 1.0);
    float t = uTime * 0.14;
    vec3 drift = vec3(
      sin(t + aSeed.x * 6.2831),
      cos(t * 0.83 + aSeed.y * 6.2831),
      sin(t * 0.61 + aSeed.x * 3.14)
    ) * 0.28;

    // Multiplication: a particle of generation g is born at its parent's place
    float g = floor(uGen);
    float born = step(aGen, g - 0.5);
    float growing = step(abs(aGen - g), 0.25);
    float s = born + growing * smoothstep(0.0, 1.0, fract(uGen));
    vec3 home = mix(aParent, aField, clamp(s, 0.0, 1.0));
    vec3 f = home + drift * s;
    f.x = wrapX(f.x, depth);

    vec3 c = aCross + vec3(uCenter, 0.0);
    c += vec3(sin(uTime * 0.7 + aSeed.x * 20.0), cos(uTime * 0.6 + aSeed.y * 20.0), 0.0) * 0.045;
    vec3 tn = aTen + vec3(uCenter, 0.0);
    tn += vec3(sin(uTime * 0.8 + aSeed.y * 20.0), cos(uTime * 0.7 + aSeed.x * 20.0), 0.0) * 0.03;

    vec3 p = f * uField + c * uCross + tn * uTen;

    // Slide-change ripple travelling outwards
    float d = length(p.xy);
    float wave = exp(-pow((d - uPulseR) * 1.15, 2.0)) * uPulse;
    p.xy += normalize(p.xy + 1e-4) * wave * 0.35;
    p.z += wave * 0.9;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float form = clamp(uCross + uTen, 0.0, 1.0);
    float size = mix(1.4, 5.2, aSeed.z * aSeed.z) * (1.0 + wave * 1.4);
    size *= mix(1.0, 0.62, form);
    gl_PointSize = size * uSize / -mv.z;

    float alive = clamp(s, 0.0, 1.0) * step(aGen, g + 0.5);
    // dense formations get fainter per particle so they read as light, not paint
    // the free field shows only a fraction of the particles (uDensity)
    float density = mix(1.0, step(aSeed.y, uDensity), uField);
    vAlpha = uAlpha * alive * density * mix(0.25, 1.0, depth) * (1.0 + wave) * mix(1.0, uFormAlpha, form);
    vType = aSeed.w;
    vTint = step(0.9, fract(aSeed.w * 7.31));
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uGold;
  uniform vec3 uCyan;
  varying float vAlpha;
  varying float vType;
  varying float vTint;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float a;
    if (vType > 0.93) {
      // tiny ×: distance to both diagonals
      float d = min(abs(uv.x - uv.y), abs(uv.x + uv.y)) * 0.7071;
      a = smoothstep(0.075, 0.025, d) * smoothstep(0.5, 0.36, length(uv));
    } else {
      float d = length(uv);
      a = smoothstep(0.5, 0.0, d);
      a *= a;
    }
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uGold, uCyan, vTint), a * vAlpha);
  }
`;

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crossPoint(r, size, thick) {
  const arm = r() < 0.5 ? 1 : -1;
  const t = (r() * 2 - 1) * size;
  const n = (r() * 2 - 1) * thick;
  // along the diagonal (1, arm) with normal offset
  const x = (t + n * arm) * 0.7071;
  const y = (t * arm - n) * 0.7071;
  return [x, y, (r() * 2 - 1) * 0.25];
}

function buildGeometry() {
  const r = rand(1010);
  const field = new Float32Array(COUNT * 3);
  const parent = new Float32Array(COUNT * 3);
  const cross = new Float32Array(COUNT * 3);
  const ten = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 4);
  const gen = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    field[i * 3] = (r() * 2 - 1) * (FIELD_W / 2);
    field[i * 3 + 1] = (r() * 2 - 1) * 6.2;
    field[i * 3 + 2] = -8 + r() * 11;

    // generation: 0 for the first particle, then 1,2,2,3,3,3,3,...
    const g = i === 0 ? 0 : Math.floor(Math.log2(i)) + 1;
    gen[i] = g;
    const p = i === 0 ? 0 : i - 2 ** (g - 1);
    // parent position is filled in a second pass

    const [cx, cy, cz] = crossPoint(r, 3.2, 0.36);
    cross.set([cx, cy, cz], i * 3);

    // ten small × in two rows of five
    const k = i % 10;
    const col = k % 5;
    const row = Math.floor(k / 5);
    const [tx, ty, tz] = crossPoint(r, 0.56, 0.085);
    ten.set([tx + (col - 2) * 1.5, ty + (row === 0 ? 0.95 : -0.95), tz], i * 3);

    seed.set([r(), r(), r(), r()], i * 4);
    parent[i * 3] = p; // temp: parent index
  }
  for (let i = 0; i < COUNT; i++) {
    const p = i === 0 ? 0 : parent[i * 3];
    parent[i * 3] = field[p * 3];
    parent[i * 3 + 1] = field[p * 3 + 1];
    parent[i * 3 + 2] = field[p * 3 + 2];
  }
  // the root particle starts at the center of the view
  field.set([0, 0, 0], 0);
  parent.set([0, 0, 0], 0);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(field, 3));
  geo.setAttribute('aField', new BufferAttribute(field, 3));
  geo.setAttribute('aParent', new BufferAttribute(parent, 3));
  geo.setAttribute('aCross', new BufferAttribute(cross, 3));
  geo.setAttribute('aTen', new BufferAttribute(ten, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 4));
  geo.setAttribute('aGen', new BufferAttribute(gen, 1));
  geo.boundingSphere = null;
  return geo;
}

const PALETTE = {
  dark: { gold: '#E8B53A', cyan: '#3AC7E8', alpha: 0.7, form: 0.26, blending: AdditiveBlending },
  light: { gold: '#A8720A', cyan: '#1597B5', alpha: 0.6, form: 0.7, blending: NormalBlending },
};

export function createBackground(canvas) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL: the static CSS background stays
  }
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 60);
  camera.position.set(0, 0, 10);

  const uniforms = {
    uTime: { value: 0 },
    uField: { value: 1 },
    uCross: { value: 0 },
    uTen: { value: 0 },
    uGen: { value: 13 },
    uOffset: { value: 0 },
    uPulse: { value: 0 },
    uPulseR: { value: 0 },
    uAlpha: { value: 0.9 },
    uDensity: { value: 0.32 },
    uFormAlpha: { value: 0.26 },
    uSize: { value: 60 },
    uCenter: { value: [4.2, 0.2] },
    uGold: { value: new Color(PALETTE.dark.gold) },
    uCyan: { value: new Color(PALETTE.dark.cyan) },
  };

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });

  const points = new Points(buildGeometry(), material);
  points.frustumCulled = false;
  scene.add(points);

  let running = false;
  let raf = 0;
  let last = performance.now();
  let slow = 0;
  let baseAlpha = PALETTE.dark.alpha;
  let alphaScale = 1;
  let multiplyTl = null;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uSize.value = h * renderer.getPixelRatio() * 0.055;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(now - last, 100);
    last = now;
    uniforms.uTime.value += dt / 1000;
    // Adaptive quality: if frames are slow for ~2 s, render fewer pixels.
    if (dt > 22) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 120 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
      slow = 0;
    }
    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    canvas.classList.add('is-on');
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    canvas.classList.remove('is-on');
  }

  function setTheme(theme) {
    const p = PALETTE[theme] || PALETTE.dark;
    uniforms.uGold.value.set(p.gold);
    uniforms.uCyan.value.set(p.cyan);
    material.blending = p.blending;
    uniforms.uFormAlpha.value = p.form;
    material.needsUpdate = true;
    baseAlpha = p.alpha;
    uniforms.uAlpha.value = baseAlpha * alphaScale;
  }

  function stopMultiply() {
    multiplyTl?.kill();
    multiplyTl = null;
  }

  /** 1 → 2 → 4 → … → 4096 and back to 1, on a slow loop. */
  function multiply() {
    stopMultiply();
    uniforms.uGen.value = 0;
    multiplyTl = gsap.timeline({ repeat: -1 });
    multiplyTl
      .set(uniforms.uGen, { value: 0 })
      .to(uniforms.uAlpha, { value: baseAlpha * alphaScale, duration: 1.2, ease: 'power1.out' })
      .to(uniforms.uGen, { value: 13, duration: 26, ease: 'none' }, 0.6)
      .to({}, { duration: 6 })
      .to(uniforms.uAlpha, { value: 0, duration: 1.6, ease: 'power2.in' });
  }

  const FORMS = {
    field: { uField: 1, uCross: 0, uTen: 0 },
    cross: { uField: 0, uCross: 1, uTen: 0 },
    ten: { uField: 0, uCross: 0, uTen: 1 },
    multiply: { uField: 1, uCross: 0, uTen: 0 },
  };

  let current = 'field';

  /**
   * Called on every slide change.
   * @param {object} o
   * @param {string} o.form      field | cross | ten | multiply
   * @param {number} o.alpha     0..1 multiplier, lower on dense text slides
   * @param {number} o.index     absolute slide index (drives the parallax drift)
   * @param {number[]} [o.center] where the ×/ten formation sits
   */
  function onSlide({ form = 'field', alpha = 1, index = 0, center }) {
    const target = FORMS[form] ? form : 'field';
    alphaScale = alpha;
    if (target !== 'multiply') {
      stopMultiply();
      gsap.to(uniforms.uGen, { value: 13, duration: 0.01 });
    }
    gsap.to(uniforms.uField, { value: FORMS[target].uField, duration: 1.6, ease: 'expo.inOut' });
    gsap.to(uniforms.uCross, { value: FORMS[target].uCross, duration: 1.6, ease: 'expo.inOut' });
    gsap.to(uniforms.uTen, { value: FORMS[target].uTen, duration: 1.6, ease: 'expo.inOut' });
    if (center) gsap.to(uniforms.uCenter.value, { 0: center[0], 1: center[1], duration: 1.4, ease: 'expo.inOut' });
    gsap.to(uniforms.uOffset, { value: -index * 0.9, duration: 1.8, ease: 'expo.out' });
    gsap.to(uniforms.uAlpha, { value: baseAlpha * alpha, duration: 0.8, ease: 'power2.out' });
    gsap.to(uniforms.uDensity, { value: target === 'multiply' ? 1 : 0.32, duration: 1, ease: 'power1.inOut' });
    gsap.fromTo(uniforms.uPulse, { value: 1 }, { value: 0, duration: 1.5, ease: 'power2.out' });
    gsap.fromTo(uniforms.uPulseR, { value: 0 }, { value: 14, duration: 1.5, ease: 'power1.out' });
    if (target === 'multiply' && current !== 'multiply') multiply();
    current = target;
  }

  /** Morph to a formation without the slide-change ripple (e.g. odometer reaching 10). */
  function morph(form, duration = 1.2) {
    const f = FORMS[form] || FORMS.field;
    gsap.to(uniforms.uField, { value: f.uField, duration, ease: 'expo.inOut' });
    gsap.to(uniforms.uCross, { value: f.uCross, duration, ease: 'expo.inOut' });
    gsap.to(uniforms.uTen, { value: f.uTen, duration, ease: 'expo.inOut' });
    current = form;
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (running) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  return { start, stop, setTheme, onSlide, morph, get running() { return running; } };
}
