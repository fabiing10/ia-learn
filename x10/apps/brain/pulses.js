// Impulses travelling the brain's synapses. A pulse runs along one connection;
// when it reaches the far neuron it fires it and usually carries on along one or two
// of that neuron's other synapses, one generation older. Cascades branch, wander
// across the brain and die out at maxGen, or sooner when the cap is full.
// Pure logic (no Three.js): the renderer reads positions with position().

export class Pulses {
  constructor(brain, { max = 320, rand = Math.random } = {}) {
    this.brain = brain;
    this.max = max;
    this.rand = rand;
    this.list = [];
  }

  get count() {
    return this.list.length;
  }

  /**
   * Fires `node`: up to `fan` pulses leave along its synapses (never back along `from`).
   * hue 0 = gold (thought), 1 = cyan (incoming data). Returns how many left.
   */
  seed(node, { fan = 2, gen = 0, maxGen = 16, hue = 0, from = -1, speed = 1 } = {}) {
    const options = this.brain.adj[node].filter((c) => c !== from);
    let spawned = 0;
    for (let k = 0; k < fan && options.length && this.list.length < this.max; k++) {
      const conn = options.splice(Math.floor(this.rand() * options.length), 1)[0];
      const c = this.brain.conns[conn];
      // Long tracts conduct faster, like myelinated fibres.
      const v = (c.len > 0.5 ? 1.5 : 0.62 + this.rand() * 0.38) * speed;
      this.list.push({ conn, forward: c.a === node, d: 0, v, gen, maxGen, hue, speed });
      spawned++;
    }
    return spawned;
  }

  /** Advances every pulse by dt seconds; onArrive(node, pulse) runs as each one lands. */
  update(dt, onArrive) {
    const arrived = [];
    this.list = this.list.filter((p) => {
      p.d += p.v * dt;
      if (p.d < this.brain.conns[p.conn].len) return true;
      arrived.push(p);
      return false;
    });
    for (const p of arrived) {
      const c = this.brain.conns[p.conn];
      const node = p.forward ? c.b : c.a;
      onArrive?.(node, p);
      if (p.gen + 1 >= p.maxGen) continue;
      const roll = this.rand();
      const fan = roll < 0.07 ? 0 : roll < 0.8 ? 1 : 2;
      this.seed(node, { fan, gen: p.gen + 1, maxGen: p.maxGen, hue: p.hue, from: p.conn, speed: p.speed });
    }
  }

  /** Position of pulse i, `back` units behind its head (for trails), written into out. */
  position(i, back, out) {
    const p = this.list[i];
    const { pts, cum, len } = this.brain.conns[p.conn];
    const d = Math.max(0, p.d - back);
    pointAt(pts, cum, p.forward ? d : len - d, out);
    return out;
  }
}

/** Point at arc length s along a polyline. */
export function pointAt(pts, cum, s, out) {
  const last = cum.length - 1;
  let j = 0;
  while (j < last - 1 && cum[j + 1] < s) j++;
  const span = cum[j + 1] - cum[j] || 1;
  const t = Math.min(1, Math.max(0, (s - cum[j]) / span));
  const i = j * 3;
  out[0] = pts[i] + (pts[i + 3] - pts[i]) * t;
  out[1] = pts[i + 1] + (pts[i + 4] - pts[i + 1]) * t;
  out[2] = pts[i + 2] + (pts[i + 5] - pts[i + 2]) * t;
  return j;
}
