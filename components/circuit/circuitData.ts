import {
  Atom,
  Blend,
  Layers,
  Link2,
  Repeat,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import {
  NUM_QUBITS,
  agreement,
  blochVector,
  marginalOne,
  type GateName,
  type SimResult,
} from './simulator';

/* ══════════════════════════════════════════════════════════════
   CIRCUIT STUDIO — content layer, no JSX.

   Gate copy is ported from `gateInfo` and `explainGate` in the
   uploaded builder, trimmed to the site's voice (the emoji
   headings go; the explanations stay, because they are good).

   The challenges replace the three floating "learning cloud"
   popups. Those repeated what /roadmap and /qubit already teach;
   a challenge you have to actually build teaches it better, and
   it plugs into the badge system the rest of the site runs on.
   ══════════════════════════════════════════════════════════════ */

export const CIRCUIT_ACCENT = '#D97706';
export const CIRCUIT_SOFT = '#FEF3C7';
export const CIRCUIT_INK = '#9A710B';

/* ── Gates ────────────────────────────────────────────────────── */

export interface GateSpec {
  gate: GateName;
  /** What the tile shows. CNOT is two cells, so it wears a dot. */
  glyph: string;
  name: string;
  explanation: string;
  formula: string;
  tint: string;
  ink: string;
}

export const GATES: GateSpec[] = [
  {
    gate: 'H',
    glyph: 'H',
    name: 'Hadamard',
    explanation: 'Creates a superposition of |0⟩ and |1⟩.',
    formula: '|0⟩ → (|0⟩ + |1⟩) / √2',
    tint: '#E6F4F8',
    ink: '#0081A7',
  },
  {
    gate: 'X',
    glyph: 'X',
    name: 'Pauli-X',
    explanation: 'Flips the qubit from |0⟩ to |1⟩, or |1⟩ to |0⟩.',
    formula: '|0⟩ ↔ |1⟩',
    tint: '#FDECE9',
    ink: '#D95342',
  },
  {
    gate: 'Y',
    glyph: 'Y',
    name: 'Pauli-Y',
    explanation: 'Rotates the qubit around the Y-axis of the Bloch sphere.',
    formula: 'Y|0⟩ = i|1⟩',
    tint: '#EBF1ED',
    ink: '#4E7A74',
  },
  {
    gate: 'Z',
    glyph: 'Z',
    name: 'Pauli-Z',
    explanation: 'Changes the phase of the |1⟩ state, leaving probabilities alone.',
    formula: 'Z|1⟩ = −|1⟩',
    tint: '#F4F1DE',
    ink: '#8A6D1E',
  },
  {
    gate: 'CNOT',
    glyph: '●',
    name: 'Controlled-NOT',
    explanation: 'Flips the target qubit when the control qubit is |1⟩.',
    formula: '|10⟩ → |11⟩',
    tint: '#FEF3C7',
    ink: CIRCUIT_ACCENT,
  },
];

export const GATE_BY_NAME: Record<GateName, GateSpec> = GATES.reduce(
  (acc, g) => ({ ...acc, [g.gate]: g }),
  {} as Record<GateName, GateSpec>
);

/* ── Guide copy ───────────────────────────────────────────────── */

export interface GuideMessage {
  title: string;
  message: string;
  tip: string;
  /** Drives the stickman beside the board. */
  pose: 'wave' | 'think' | 'teach' | 'point' | 'juggle' | 'celebrate' | 'read';
}

export const GUIDE_IDLE: GuideMessage = {
  title: 'Your quantum guide',
  message: "Drag a gate onto the board and I'll tell you what it did.",
  tip: 'Start with an H on q₀ — that is superposition in one move.',
  pose: 'wave',
};

const sub = (q: number) => ['₀', '₁', '₂'][q] ?? String(q);

export function explainGate(gate: GateName, qubit: number): GuideMessage {
  switch (gate) {
    case 'H':
      return {
        title: 'Hadamard on q' + sub(qubit),
        message: `q${sub(qubit)} is now in a superposition — measure it and you get 0 or 1 with equal odds.`,
        tip: 'Like a spinning coin: not heads, not tails, until it lands.',
        pose: 'teach',
      };
    case 'X':
      return {
        title: 'Pauli-X on q' + sub(qubit),
        message: `q${sub(qubit)} just flipped. |0⟩ became |1⟩, and |1⟩ would have become |0⟩.`,
        tip: 'X is the quantum NOT gate — the one classical idea that survives intact.',
        pose: 'teach',
      };
    case 'Y':
      return {
        title: 'Pauli-Y on q' + sub(qubit),
        message: `q${sub(qubit)} rotated a half turn about the Y axis of the Bloch sphere — a flip and a phase kick at once.`,
        tip: 'Watch the Bloch sphere below rather than the histogram for this one.',
        pose: 'teach',
      };
    case 'Z':
      return {
        title: 'Pauli-Z on q' + sub(qubit),
        message: `q${sub(qubit)} picked up a phase. Run it and the measurement odds will not budge — Z is invisible in this basis.`,
        tip: 'Put an H before and after it and the phase suddenly shows up as a flip.',
        pose: 'point',
      };
    default:
      return GUIDE_IDLE;
  }
}

export const GUIDE_CNOT_CONTROL = (qubit: number): GuideMessage => ({
  title: 'Pick a target',
  message: `q${sub(qubit)} is the control. Now click a different wire in the same column to be the target.`,
  tip: 'The target flips only when the control is |1⟩.',
  pose: 'point',
});

export const GUIDE_CNOT_DONE = (control: number, target: number): GuideMessage => ({
  title: 'CNOT wired up',
  message: `q${sub(control)} now controls q${sub(target)}. Put an H before the control and the two become entangled.`,
  tip: 'Control is the one that decides; target is the one that flips.',
  pose: 'teach',
});

export const GUIDE_SAME_COLUMN: GuideMessage = {
  title: 'Same column, please',
  message: 'A CNOT acts at one moment in time, so control and target share a column.',
  tip: 'Click a wire directly above or below the control.',
  pose: 'point',
};

export const GUIDE_OTHER_WIRE: GuideMessage = {
  title: 'Two different wires',
  message: 'A qubit cannot control itself — pick another wire in that column.',
  tip: 'Any of the other two will do.',
  pose: 'point',
};

export const GUIDE_REMOVED: GuideMessage = {
  title: 'Gate removed',
  message: 'That cell is clear again. Removing half a CNOT removes both halves.',
  tip: 'Run the circuit again to see what changed.',
  pose: 'think',
};

export const GUIDE_RUNNING: GuideMessage = {
  title: 'Running…',
  message: 'Walking your qubits through the circuit, then measuring 1,024 times.',
  tip: 'The exact odds come from the statevector; the counts come from the shots.',
  pose: 'juggle',
};

export const GUIDE_DONE = (engineIsQiskit: boolean): GuideMessage => ({
  title: 'Simulation complete',
  message: engineIsQiskit
    ? 'That ran through Qiskit Aer on your machine. Open the sections on the right to read the result.'
    : 'Open the sections on the right — measurement first, then the Bloch spheres.',
  tip: 'Change one gate, run it again, and compare.',
  pose: 'read',
});

export const GUIDE_EMPTY: GuideMessage = {
  title: 'Nothing to run yet',
  message: 'An empty board leaves all three qubits in |000⟩ — true, but not very interesting.',
  tip: 'Drop an H on q₀ first.',
  pose: 'think',
};

export const GUIDE_SOLVED = (title: string): GuideMessage => ({
  title: 'Challenge cleared',
  message: `You built it — ${title.toLowerCase()}.`,
  tip: 'Clear all five and the Circuit Architect badge lands on your profile.',
  pose: 'celebrate',
});

/* ── Challenges ───────────────────────────────────────────────── */

export interface Challenge {
  id: string;
  title: string;
  goal: string;
  hint: string;
  teaches: string;
  icon: LucideIcon;
  /** Judged on the simulated state, never on which gates you used. */
  test: (result: SimResult) => boolean;
}

const near = (a: number, b: number, eps = 0.02) => Math.abs(a - b) < eps;

/** Every ordered pair of distinct wires, for the entanglement test. */
const PAIRS: [number, number][] = [];
for (let a = 0; a < NUM_QUBITS; a++) {
  for (let b = a + 1; b < NUM_QUBITS; b++) PAIRS.push([a, b]);
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'superpose',
    title: 'Spin the coin',
    goal: 'Put q₀ into an even superposition — 50/50 between 0 and 1.',
    hint: 'One gate does it. H on q₀.',
    teaches: 'Superposition',
    icon: Waves,
    test: (r) => near(marginalOne(r.statevector, 0), 0.5),
  },
  {
    id: 'flip',
    title: 'Flip a bit',
    goal: 'Make q₁ read 1 every single time.',
    hint: 'X is the NOT gate. Drop one on the middle wire.',
    teaches: 'Basis states',
    icon: Repeat,
    test: (r) => marginalOne(r.statevector, 1) > 0.999,
  },
  {
    id: 'bell',
    title: 'Build a Bell pair',
    goal: 'Entangle two wires so they are each 50/50 alone, yet always agree.',
    hint: 'H on q₀, then a CNOT with q₀ controlling q₁ in the next column.',
    teaches: 'Entanglement',
    icon: Link2,
    test: (r) =>
      PAIRS.some(
        ([a, b]) =>
          near(marginalOne(r.statevector, a), 0.5) &&
          near(marginalOne(r.statevector, b), 0.5) &&
          agreement(r.statevector, a, b) > 0.99
      ),
  },
  {
    id: 'all-three',
    title: 'All eight at once',
    goal: 'Reach every one of the eight outcomes with equal probability.',
    hint: 'Three qubits, three H gates.',
    teaches: 'Exponential state space',
    icon: Layers,
    test: (r) =>
      Object.keys(r.ideal).length === 8 && Object.values(r.ideal).every((p) => near(p, 0.125)),
  },
  {
    id: 'phase',
    title: 'The invisible move',
    goal: 'Leave q₀ at 50/50, but with its Bloch arrow pointing at −X instead of +X.',
    hint: 'H, then Z. The histogram will not change at all — the sphere will.',
    teaches: 'Phase',
    icon: Blend,
    test: (r) => {
      const v = blochVector(r.statevector, 0);
      return near(marginalOne(r.statevector, 0), 0.5) && v.x < -0.98;
    },
  },
];

export const challengeFlag = (id: string) => `circuit-${id}`;

export const CIRCUIT_FLAGS = CHALLENGES.map((c) => challengeFlag(c.id));

/* ── Result sections ──────────────────────────────────────────── */

export type SectionId = 'measurement' | 'histogram' | 'statevector' | 'bloch';

export const SECTIONS: { id: SectionId; title: string; blurb: string; icon: LucideIcon }[] = [
  {
    id: 'measurement',
    title: 'Measurement',
    blurb: 'What 1,024 shots actually returned, against the exact odds.',
    icon: Sparkles,
  },
  {
    id: 'histogram',
    title: 'Histogram',
    blurb: 'The same counts as bars.',
    icon: Layers,
  },
  {
    id: 'statevector',
    title: 'Statevector',
    blurb: 'All eight amplitudes, real and imaginary.',
    icon: Atom,
  },
  {
    id: 'bloch',
    title: 'Bloch spheres',
    blurb: 'Where each qubit sits on its own sphere.',
    icon: Blend,
  },
];
