/* ══════════════════════════════════════════════════════════════
   BROWSER STATEVECTOR SIMULATOR

   The uploaded circuit builder sent every run to a FastAPI +
   Qiskit Aer server on 127.0.0.1:8001. This site has no backend
   and is served statically, so the same physics lives here in
   ~200 lines of TypeScript. Three qubits is eight complex
   amplitudes; H/X/Y/Z are 2x2 unitaries applied over index pairs
   and CNOT is a permutation. Nothing here needs a dependency.

   CONVENTIONS — these mirror Qiskit exactly, because engine.ts
   may substitute the real Aer result for this one and the two
   must be interchangeable:

     · statevector index i holds qubit q in bit (i >> q) & 1
       (little-endian, what Qiskit's save_statevector gives)
     · a counts key reads LEFT to RIGHT as q2 q1 q0
       (big-endian, what Qiskit's measure_all reports)

   Those two are opposite ends of the same convention and mixing
   them up is the one bug that would make the Bloch spheres and
   the histogram quietly disagree.
   ══════════════════════════════════════════════════════════════ */

export type GateName = 'H' | 'X' | 'Y' | 'Z' | 'CNOT';

/** Wire format shared with main.py's `Gate` model, so it POSTs as-is. */
export interface PlacedGate {
  gate: GateName;
  qubit?: number;
  control?: number;
  target?: number;
  column: number;
}

export interface Amp {
  real: number;
  imaginary: number;
}

export type EngineId = 'browser' | 'qiskit';

export interface SimResult {
  /** Sampled outcomes, 1024 shots. Only observed keys appear, as Aer does. */
  counts: Record<string, number>;
  /** counts / shots — sampled, matching main.py's `probabilities`. */
  probabilities: Record<string, number>;
  /** Exact |amplitude|². Identical under both engines, to floating point. */
  ideal: Record<string, number>;
  statevector: Amp[];
  /** ASCII circuit drawing. */
  circuit: string;
  engine: EngineId;
  shots: number;
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export const NUM_QUBITS = 3;
export const NUM_COLUMNS = 6;
export const SHOTS = 1024;

/* ── Gate matrices ────────────────────────────────────────────
   Flattened as [a.re, a.im, b.re, b.im, c.re, c.im, d.re, d.im]
   for [[a, b], [c, d]] — a plain array beats an object here
   because apply1 runs it once per amplitude pair.            */

type M2 = readonly [number, number, number, number, number, number, number, number];

const R2 = Math.SQRT1_2;

const MATRICES: Record<'H' | 'X' | 'Y' | 'Z', M2> = {
  H: [R2, 0, R2, 0, R2, 0, -R2, 0],
  X: [0, 0, 1, 0, 1, 0, 0, 0],
  Y: [0, 0, 0, -1, 0, 1, 0, 0],
  Z: [1, 0, 0, 0, 0, 0, -1, 0],
};

/* ── State evolution ──────────────────────────────────────── */

function apply1(re: Float64Array, im: Float64Array, qubit: number, m: M2): void {
  const bit = 1 << qubit;
  for (let i = 0; i < re.length; i++) {
    if (i & bit) continue; // visit each pair once, from the |0> side
    const j = i | bit;
    const ar = re[i];
    const ai = im[i];
    const br = re[j];
    const bi = im[j];

    re[i] = m[0] * ar - m[1] * ai + m[2] * br - m[3] * bi;
    im[i] = m[0] * ai + m[1] * ar + m[2] * bi + m[3] * br;
    re[j] = m[4] * ar - m[5] * ai + m[6] * br - m[7] * bi;
    im[j] = m[4] * ai + m[5] * ar + m[6] * bi + m[7] * br;
  }
}

/** CNOT never mixes amplitudes — it just swaps the two the control selects. */
function applyCnot(re: Float64Array, im: Float64Array, control: number, target: number): void {
  if (control === target) return;
  const cb = 1 << control;
  const tb = 1 << target;
  for (let i = 0; i < re.length; i++) {
    if (!(i & cb)) continue; // control must be |1>
    if (i & tb) continue; // pair visited from the target-|0> side
    const j = i | tb;
    const tr = re[i];
    const ti = im[i];
    re[i] = re[j];
    im[i] = im[j];
    re[j] = tr;
    im[j] = ti;
  }
}

/* ── Labels ───────────────────────────────────────────────── */

/** Index 3 with 3 qubits → "011": leftmost char is the highest qubit. */
export function labelFor(index: number, numQubits = NUM_QUBITS): string {
  let out = '';
  for (let q = numQubits - 1; q >= 0; q--) out += (index >> q) & 1;
  return out;
}

/** "011" → index 3. Inverse of labelFor, used when reading Aer's counts. */
export function indexFor(label: string): number {
  let index = 0;
  for (let c = 0; c < label.length; c++) {
    if (label[label.length - 1 - c] === '1') index |= 1 << c;
  }
  return index;
}

/* ── Sampling ─────────────────────────────────────────────── */

export type Rng = () => number;

function sample(ideal: number[], shots: number, rng: Rng): Record<string, number> {
  /* Cumulative walk. The last bucket absorbs floating-point drift so
     the counts always total exactly `shots`, however lumpy the tail. */
  const cumulative: number[] = [];
  let running = 0;
  for (const p of ideal) {
    running += p;
    cumulative.push(running);
  }

  const counts: Record<string, number> = {};
  for (let s = 0; s < shots; s++) {
    const r = rng();
    let picked = cumulative.length - 1;
    for (let i = 0; i < cumulative.length; i++) {
      if (r < cumulative[i]) {
        picked = i;
        break;
      }
    }
    const key = labelFor(picked, Math.log2(ideal.length));
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/* ── Bloch vectors ────────────────────────────────────────────
   A direct port of calculateBlochVector from the uploaded app,
   including its 1e-6 snapping, so a sphere renders identically
   whichever engine produced the state.                       */

export function blochVector(statevector: Amp[], qubit: number): BlochVector {
  if (!statevector || statevector.length === 0) return { x: 0, y: 0, z: 1 };

  const dimension = statevector.length;
  const bit = 1 << qubit;
  let x = 0;
  let y = 0;
  let z = 0;

  for (let i = 0; i < dimension; i++) {
    const ar = Number(statevector[i]?.real ?? 0);
    const ai = Number(statevector[i]?.imaginary ?? 0);
    const probability = ar * ar + ai * ai;

    if (i & bit) {
      z -= probability;
      continue;
    }

    z += probability;

    const j = i | bit;
    if (j >= dimension) continue;
    const br = Number(statevector[j]?.real ?? 0);
    const bi = Number(statevector[j]?.imaginary ?? 0);

    x += 2 * (ar * br + ai * bi);
    y += 2 * (ar * bi - ai * br);
  }

  const clean = (v: number) => {
    if (Math.abs(v) < 1e-6) return 0;
    if (Math.abs(v - 1) < 1e-6) return 1;
    if (Math.abs(v + 1) < 1e-6) return -1;
    return v;
  };

  return { x: clean(x), y: clean(y), z: clean(z) };
}

/** How pure a single qubit is: 1 on the sphere's surface, 0 at its centre. */
export function blochLength(v: BlochVector): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/* ── Marginals ────────────────────────────────────────────────
   Exact single- and two-qubit statistics off the statevector,
   used by the challenge tests and the per-qubit readout.     */

/** P(qubit reads 1). */
export function marginalOne(statevector: Amp[], qubit: number): number {
  const bit = 1 << qubit;
  let p = 0;
  statevector.forEach((a, i) => {
    if (i & bit) p += a.real * a.real + a.imaginary * a.imaginary;
  });
  return p;
}

/** P(two qubits read the same value) — 1 means perfectly correlated. */
export function agreement(statevector: Amp[], a: number, b: number): number {
  const ba = 1 << a;
  const bb = 1 << b;
  let p = 0;
  statevector.forEach((amp, i) => {
    if (!!(i & ba) === !!(i & bb)) p += amp.real * amp.real + amp.imaginary * amp.imaginary;
  });
  return p;
}

/* ── Qiskit code ──────────────────────────────────────────────
   The real deliverable of the page: this pastes into Colab and
   runs. Ported from generateQiskitCode in the uploaded app.  */

export function qiskitCode(gates: PlacedGate[], numQubits = NUM_QUBITS): string {
  const lines = ordered(gates).map((g) =>
    g.gate === 'CNOT'
      ? `qc.cx(${g.control}, ${g.target})`
      : `qc.${g.gate.toLowerCase()}(${g.qubit})`
  );

  return [
    'from qiskit import QuantumCircuit',
    '',
    `qc = QuantumCircuit(${numQubits})`,
    '',
    ...(lines.length ? lines : ['# drop a gate on the board to build a circuit']),
    '',
    'qc.measure_all()',
    'print(qc)',
  ].join('\n');
}

/* ── ASCII diagram ────────────────────────────────────────────
   Reproduces Qiskit's text drawer for our five gates: one 5-char
   cell per column per wire, with a separator row between wires
   that doubles as the box border above and below.            */

const CELL = 5;
const BLANK = '     ';
const WIRE = '─────';

export function asciiDiagram(gates: PlacedGate[], numQubits = NUM_QUBITS): string {
  const cols = ordered(gates).reduce<number[]>(
    (acc, g) => (acc.includes(g.column) ? acc : [...acc, g.column]),
    []
  );
  if (cols.length === 0) {
    return Array.from({ length: numQubits }, (_, q) => `q_${q}: ${WIRE}`).join('\n');
  }

  /* what[q][c]: what sits on wire q in the c'th drawn column */
  const what: (GateName | 'TARGET' | 'CONTROL' | null)[][] = Array.from(
    { length: numQubits },
    () => cols.map(() => null)
  );
  /* span[c]: [top, bottom] wires a CNOT link crosses in that column */
  const span: (readonly [number, number] | null)[] = cols.map(() => null);

  ordered(gates).forEach((g) => {
    const c = cols.indexOf(g.column);
    if (g.gate === 'CNOT') {
      if (g.control == null || g.target == null) return;
      what[g.control][c] = 'CONTROL';
      what[g.target][c] = 'TARGET';
      span[c] = [Math.min(g.control, g.target), Math.max(g.control, g.target)] as const;
    } else if (g.qubit != null) {
      what[g.qubit][c] = g.gate;
    }
  });

  const boxed = (q: number, c: number) => {
    const w = what[q][c];
    return w !== null && w !== 'CONTROL';
  };
  const crossed = (q: number, c: number) => {
    const s = span[c];
    return s !== null && q > s[0] && q < s[1];
  };
  /** Does the vertical CNOT link pass through the gap below wire q? */
  const linked = (q: number, c: number) => {
    const s = span[c];
    return s !== null && q >= s[0] && q < s[1];
  };

  const wireRow = (q: number) =>
    cols
      .map((_, c) => {
        const w = what[q][c];
        if (w === 'CONTROL') return '──■──';
        if (w === 'TARGET') return '┤ X ├';
        if (w === null) return crossed(q, c) ? '──┼──' : WIRE;
        return `┤ ${w} ├`;
      })
      .join('');

  /* The gap between wire `above` and the next one down. -1 means the
     gap above wire 0; numQubits - 1 means the gap below the last. */
  const gapRow = (above: number) =>
    cols
      .map((_, c) => {
        const hasAbove = above >= 0 && boxed(above, c);
        const hasBelow = above + 1 < numQubits && boxed(above + 1, c);
        const link = above >= 0 && linked(above, c);

        if (hasAbove && hasBelow) return '├───┤';
        if (hasAbove) return link ? '└─┬─┘' : '└───┘';
        if (hasBelow) return link ? '┌─┴─┐' : '┌───┐';
        return link ? '  │  ' : BLANK;
      })
      .join('');

  const pad = ' '.repeat(`q_${numQubits - 1}: `.length);
  const out: string[] = [];
  for (let q = 0; q < numQubits; q++) {
    out.push(pad + gapRow(q - 1));
    out.push(`q_${q}: ` + wireRow(q));
  }
  out.push(pad + gapRow(numQubits - 1));

  /* Qiskit trims the blank frame rows top and bottom. */
  while (out.length && out[0].trim() === '') out.shift();
  while (out.length && out[out.length - 1].trim() === '') out.pop();

  return out.map((line) => line.replace(/\s+$/, '')).join('\n');
}

/* ── The simulator ────────────────────────────────────────── */

/** Column order, exactly as main.py sorts before applying. */
export function ordered(gates: PlacedGate[]): PlacedGate[] {
  return [...gates].sort((a, b) => a.column - b.column);
}

export function statevectorFor(gates: PlacedGate[], numQubits = NUM_QUBITS): Amp[] {
  const size = 1 << numQubits;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re[0] = 1;

  for (const g of ordered(gates)) {
    if (g.gate === 'CNOT') {
      if (g.control == null || g.target == null) continue;
      applyCnot(re, im, g.control, g.target);
    } else if (g.qubit != null) {
      apply1(re, im, g.qubit, MATRICES[g.gate]);
    }
  }

  return Array.from({ length: size }, (_, i) => ({ real: re[i], imaginary: im[i] }));
}

/** Exact |amp|², keyed by label. Amplitudes below 1e-12 are dropped as noise. */
export function idealFrom(statevector: Amp[]): Record<string, number> {
  const numQubits = Math.round(Math.log2(statevector.length));
  const ideal: Record<string, number> = {};
  statevector.forEach((amp, i) => {
    const p = amp.real * amp.real + amp.imaginary * amp.imaginary;
    if (p > 1e-12) ideal[labelFor(i, numQubits)] = p;
  });
  return ideal;
}

export function simulate(
  gates: PlacedGate[],
  numQubits = NUM_QUBITS,
  { shots = SHOTS, rng = Math.random as Rng }: { shots?: number; rng?: Rng } = {}
): SimResult {
  const statevector = statevectorFor(gates, numQubits);
  const ideal = idealFrom(statevector);

  const dense = statevector.map((a) => a.real * a.real + a.imaginary * a.imaginary);
  const counts = sample(dense, shots, rng);

  const probabilities: Record<string, number> = {};
  for (const [key, count] of Object.entries(counts)) probabilities[key] = count / shots;

  return {
    counts,
    probabilities,
    ideal,
    statevector,
    circuit: asciiDiagram(gates, numQubits),
    engine: 'browser',
    shots,
  };
}
