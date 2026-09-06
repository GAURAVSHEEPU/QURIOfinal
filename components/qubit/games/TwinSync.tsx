'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, RotateCcw, Undo2 } from 'lucide-react';

import Stickman, { type StickmanPose } from '../../roadmap/Stickman';
import { FLAG_BELL_BUILT } from '../gameData';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   TWIN SYNC  ·  module b4 — Two Qubits & Entanglement

   Every gate this game offers (H, X, Z, CNOT) has a real matrix,
   so four real amplitudes describe the whole two-qubit state and
   the learner never meets a complex number they did not ask for.

   Amplitude order is |00⟩ |01⟩ |10⟩ |11⟩ with Alice as the left
   bit. The separability test a₀a₃ − a₁a₂ tells the twins whether
   they are entangled, which is what makes them mirror each other.
   ══════════════════════════════════════════════════════════════ */

type Amps = [number, number, number, number];

const ROOT_HALF = Math.SQRT1_2;
const EPS = 1e-9;
const START: Amps = [1, 0, 0, 0];

/* ── The gate set ─────────────────────────────────────────────── */

const h0 = (a: Amps): Amps => [
  (a[0] + a[2]) * ROOT_HALF,
  (a[1] + a[3]) * ROOT_HALF,
  (a[0] - a[2]) * ROOT_HALF,
  (a[1] - a[3]) * ROOT_HALF,
];
const h1 = (a: Amps): Amps => [
  (a[0] + a[1]) * ROOT_HALF,
  (a[0] - a[1]) * ROOT_HALF,
  (a[2] + a[3]) * ROOT_HALF,
  (a[2] - a[3]) * ROOT_HALF,
];
const x0 = (a: Amps): Amps => [a[2], a[3], a[0], a[1]];
const x1 = (a: Amps): Amps => [a[1], a[0], a[3], a[2]];
const z0 = (a: Amps): Amps => [a[0], a[1], -a[2], -a[3]];
const z1 = (a: Amps): Amps => [a[0], -a[1], a[2], -a[3]];
/** Control Alice, target Bob: flip Bob's bit only when Alice's is 1. */
const cnot = (a: Amps): Amps => [a[0], a[1], a[3], a[2]];

interface Gate {
  id: string;
  label: string;
  wire: 'alice' | 'bob' | 'both';
  blurb: string;
  apply: (a: Amps) => Amps;
}

const GATES: Gate[] = [
  { id: 'h0', label: 'H', wire: 'alice', blurb: 'superpose Alice', apply: h0 },
  { id: 'x0', label: 'X', wire: 'alice', blurb: 'flip Alice', apply: x0 },
  { id: 'z0', label: 'Z', wire: 'alice', blurb: 'phase on Alice', apply: z0 },
  { id: 'h1', label: 'H', wire: 'bob', blurb: 'superpose Bob', apply: h1 },
  { id: 'x1', label: 'X', wire: 'bob', blurb: 'flip Bob', apply: x1 },
  { id: 'z1', label: 'Z', wire: 'bob', blurb: 'phase on Bob', apply: z1 },
  { id: 'cnot', label: 'CNOT', wire: 'both', blurb: 'Alice controls Bob', apply: cnot },
];

const GATE_BY_ID: Record<string, Gate> = GATES.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});

/* ── The five targets ─────────────────────────────────────────── */

interface Round {
  name: string;
  ket: string;
  target: Amps;
  /** True for the four Bell states; false for the product-state contrast. */
  bell: boolean;
  par: number;
  solution: string;
  hint: string;
  note: string;
}

const R = ROOT_HALF;

const ROUNDS: Round[] = [
  {
    name: 'Φ⁺',
    ket: '(|00⟩ + |11⟩)/√2',
    target: [R, 0, 0, R],
    bell: true,
    par: 2,
    solution: 'H on Alice, then CNOT',
    hint: 'Put Alice in a superposition first, then let her control Bob.',
    note: 'The canonical Bell pair. H spreads Alice over |0⟩ and |1⟩, and CNOT copies whichever branch she is in onto Bob — so the two are now one state, not two.',
  },
  {
    name: 'Ψ⁺',
    ket: '(|01⟩ + |10⟩)/√2',
    target: [0, R, R, 0],
    bell: true,
    par: 3,
    solution: 'H on Alice, CNOT, then X on Bob',
    hint: 'Build Φ⁺ first, then flip Bob so the twins always disagree.',
    note: 'Anti-correlated: measure Alice and Bob is guaranteed to be the opposite. Still maximally entangled — correlation, not agreement, is the point.',
  },
  {
    name: 'Φ⁻',
    ket: '(|00⟩ − |11⟩)/√2',
    target: [R, 0, 0, -R],
    bell: true,
    par: 3,
    solution: 'H on Alice, CNOT, then Z on Alice',
    hint: 'Build Φ⁺, then use the gate that only changes a sign.',
    note: 'Identical measurement statistics to Φ⁺ in this basis — the minus sign is a relative phase. It is a different state, and measuring in another basis proves it.',
  },
  {
    name: '|+⟩|1⟩',
    ket: '(|01⟩ + |11⟩)/√2',
    target: [0, R, 0, R],
    bell: false,
    par: 2,
    solution: 'X on Bob, then H on Alice',
    hint: 'No CNOT needed. Set Bob to |1⟩ and superpose Alice on her own.',
    note: 'Two shots of nothing special: Alice is |+⟩, Bob is |1⟩, and a₀a₃ − a₁a₂ = 0. Superposition alone is not entanglement — you need the twins to share a fate.',
  },
  {
    name: 'Ψ⁻',
    ket: '(|01⟩ − |10⟩)/√2',
    target: [0, R, -R, 0],
    bell: true,
    par: 4,
    solution: 'H on Alice, CNOT, X on Bob, then Z on Alice',
    hint: 'Reach Ψ⁺ first, then add the sign the way you did for Φ⁻.',
    note: 'The singlet — the most famous state in physics. Anti-correlated and antisymmetric; swapping the two qubits flips its sign.',
  },
];

/* ── Helpers ──────────────────────────────────────────────────── */

/** Up to a global sign, since that carries no physical meaning. */
function matches(a: Amps, t: Amps): boolean {
  const same = a.every((v, i) => Math.abs(v - t[i]) < 1e-6);
  const flipped = a.every((v, i) => Math.abs(v + t[i]) < 1e-6);
  return same || flipped;
}

/** Zero exactly when the state factorises into Alice ⊗ Bob. */
function separability(a: Amps): number {
  return a[0] * a[3] - a[1] * a[2];
}

const BASIS = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'] as const;

function amplitudeLabel(v: number): string {
  const m = Math.abs(v);
  if (m < 1e-6) return '0';
  const sign = v < 0 ? '−' : '';
  if (Math.abs(m - 1) < 1e-6) return `${sign}1`;
  if (Math.abs(m - ROOT_HALF) < 1e-6) return `${sign}1/√2`;
  if (Math.abs(m - 0.5) < 1e-6) return `${sign}1/2`;
  return `${sign}${m.toFixed(2)}`;
}

export default function TwinSync({ api }: { api: GameApi }) {
  const round = ROUNDS[api.round];
  const budget = round.par + 2;

  const [queue, setQueue] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'solved' | 'stuck' | null>(null);
  const [shot, setShot] = useState<[number, number] | null>(null);

  const amps = queue.reduce<Amps>((a, id) => GATE_BY_ID[id].apply(a), START);
  const entangled = Math.abs(separability(amps)) > 1e-6;
  const solved = matches(amps, round.target);
  const gatesUsed = queue.length;
  const left = budget - gatesUsed;

  const play = (gate: Gate) => {
    if (api.resolved) return;
    const next = [...queue, gate.id];
    const after = gate.apply(amps);
    setQueue(next);
    setShot(null);

    if (matches(after, round.target)) {
      setOutcome('solved');
      api.resolveRound(1, round.bell ? [FLAG_BELL_BUILT] : undefined);
    } else if (next.length >= budget) {
      setOutcome('stuck');
      api.resolveRound(0);
    }
  };

  const undo = () => {
    if (api.resolved) return;
    setQueue((q) => q.slice(0, -1));
    setShot(null);
  };

  const reset = () => {
    if (api.resolved) return;
    setQueue([]);
    setShot(null);
  };

  /* One shot on both qubits. Alice first, then Bob from the
     conditional — which is exactly how the correlation shows up. */
  const measure = () => {
    const probs = amps.map((v) => v * v);
    const pAlice0 = probs[0] + probs[1];
    const a = Math.random() < pAlice0 ? 0 : 1;
    const base = a === 0 ? 0 : 2;
    const branch = probs[base] + probs[base + 1];
    const b = branch < EPS ? 0 : Math.random() < probs[base] / branch ? 0 : 1;
    setShot([a, b]);
  };

  const poseFor = (bit: number | null, who: 'alice' | 'bob'): StickmanPose => {
    if (bit !== null) return bit === 0 ? 'stand' : 'point';
    if (entangled) return 'juggle';
    return who === 'alice' ? 'stand' : 'read';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Prompt>
        Build <Ket color="#3F5185">{round.name} = {round.ket}</Ket> from{' '}
        <Ket color="#5A6578">|00⟩</Ket> — par is {round.par} gates, and you have {budget}.
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      {/* ══════════════ THE TWINS ══════════════ */}
      <Stage style={{ padding: '18px 20px' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-around', gap: 12 }}>
          {/* The link that only exists when they are entangled */}
          {entangled && (
            <motion.div
              className="qubit-twin-link"
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                left: '26%',
                right: '26%',
                top: 52,
                height: 3,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #3F5185, #9BC1BC, #3F5185)',
              }}
            />
          )}

          <Twin
            name="Alice"
            wire="q0"
            tone="#3F5185"
            pose={poseFor(shot ? shot[0] : null, 'alice')}
            bit={shot ? shot[0] : null}
            striding={!shot && entangled}
          />
          <Twin
            name="Bob"
            wire="q1"
            tone="#0081A7"
            pose={poseFor(shot ? shot[1] : null, 'bob')}
            bit={shot ? shot[1] : null}
            striding={!shot && entangled}
          />
        </div>

        {/* Sync indicator */}
        <div
          style={{
            marginTop: 14,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: entangled ? '#3F5185' : '#B4BCC6',
          }}
        >
          {entangled ? 'Twins synced · entangled' : 'Independent · a₀a₃ − a₁a₂ = 0'}
        </div>

        {/* ── Amplitudes ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
          {BASIS.map((label, i) => {
            const v = amps[i];
            const t = round.target[i];
            const hit = Math.abs(Math.abs(v) - Math.abs(t)) < 1e-6;
            return (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    height: 62,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    marginBottom: 6,
                  }}
                >
                  <div
                    className="qubit-bar"
                    style={{
                      height: `${Math.max(Math.abs(v) * 100, v === 0 ? 2 : 6)}%`,
                      borderRadius: '6px 6px 0 0',
                      background: v === 0 ? 'rgba(34,37,42,0.1)' : v < 0 ? '#ED6A5A' : '#3F5185',
                    }}
                  />
                </div>
                <Ket size={12} color={hit ? '#4E7A74' : '#22252A'}>
                  {label}
                </Ket>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: v < 0 ? '#D95342' : '#5A6578',
                    marginTop: 2,
                  }}
                >
                  {amplitudeLabel(v)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Measuring is free and never scored — it is here to be played with. */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={measure}
            className="btn-atlas-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Activity size={13} /> Measure both
          </button>
          {shot && (
            <motion.span
              key={`${shot[0]}${shot[1]}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: 13, color: '#5A6578' }}
            >
              Alice {shot[0]}, Bob {shot[1]}{' '}
              <span style={{ color: entangled ? '#3F5185' : '#B4BCC6', fontWeight: 700 }}>
                {entangled
                  ? shot[0] === shot[1]
                    ? '· they agree'
                    : '· they disagree'
                  : '· unrelated draws'}
              </span>
            </motion.span>
          )}
        </div>
      </Stage>

      {/* ══════════════ GATES ══════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(['alice', 'bob'] as const).map((wire) => (
          <div key={wire} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: wire === 'alice' ? '#3F5185' : '#0081A7',
                width: 62,
                flexShrink: 0,
              }}
            >
              {wire}
            </span>
            {GATES.filter((g) => g.wire === wire).map((g) => (
              <GateButton key={g.id} gate={g} disabled={api.resolved} onPlay={() => play(g)} />
            ))}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 62, flexShrink: 0 }} />
          {GATES.filter((g) => g.wire === 'both').map((g) => (
            <GateButton key={g.id} gate={g} disabled={api.resolved} onPlay={() => play(g)} wide />
          ))}
        </div>
      </div>

      {/* ══════════════ CIRCUIT SO FAR ══════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: '#FFFFFF',
          border: '1px solid #E2E6DF',
          borderRadius: 12,
          padding: '11px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#5A6578' }}>Your circuit:</span>
          {queue.length === 0 ? (
            <span style={{ fontSize: 13, color: '#B4BCC6', fontStyle: 'italic' }}>nothing yet</span>
          ) : (
            queue.map((id, i) => {
              const g = GATE_BY_ID[id];
              return (
                <motion.span
                  key={`${id}-${i}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: g.wire === 'alice' ? '#3F5185' : g.wire === 'bob' ? '#0081A7' : '#22252A',
                    borderRadius: 6,
                    padding: '3px 8px',
                  }}
                >
                  {g.label}
                  {g.wire !== 'both' && <sub style={{ fontSize: 9 }}>{g.wire === 'alice' ? 0 : 1}</sub>}
                </motion.span>
              );
            })
          )}
          <span
            style={{ fontSize: 12, fontWeight: 700, color: left <= 1 ? '#D95342' : '#5A6578', marginLeft: 6 }}
          >
            {gatesUsed} gate{gatesUsed === 1 ? '' : 's'} · {left} left
          </span>
        </div>

        {!api.resolved && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={undo}
              disabled={queue.length === 0}
              className="btn-atlas-ghost"
              style={{ padding: '6px 12px', fontSize: 12, opacity: queue.length === 0 ? 0.4 : 1 }}
            >
              <Undo2 size={12} /> Undo
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={queue.length === 0}
              className="btn-atlas-ghost"
              style={{ padding: '6px 12px', fontSize: 12, opacity: queue.length === 0 ? 0.4 : 1 }}
            >
              <RotateCcw size={12} /> Start over
            </button>
          </div>
        )}
      </div>

      {api.resolved && (
        <Verdict ok={outcome === 'solved'}>
          {outcome === 'solved' ? (
            <>
              <strong>
                {solved && gatesUsed <= round.par
                  ? `${round.name} in ${gatesUsed} gates — par.`
                  : `${round.name} built in ${gatesUsed} gates.`}
              </strong>{' '}
              {round.note}
            </>
          ) : (
            <>
              <strong>Out of gates.</strong> {round.name} comes out of{' '}
              <Ket size={13}>{round.solution}</Ket>. {round.note}
            </>
          )}
        </Verdict>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   One of the twins, on their wire.
   ══════════════════════════════════════════════════════════════ */

function Twin({
  name,
  wire,
  tone,
  pose,
  bit,
  striding,
}: {
  name: string;
  wire: string;
  tone: string;
  pose: StickmanPose;
  bit: number | null;
  striding: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <Stickman pose={pose} striding={striding} size={92} accent={tone} label={`${name} the qubit`} />
      <div style={{ fontSize: 13, fontWeight: 700, color: '#22252A' }}>{name}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5A6578' }}>{wire}</div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 15,
          fontWeight: 700,
          color: bit === null ? '#B4BCC6' : '#FFFFFF',
          background: bit === null ? 'transparent' : tone,
          border: `1.5px solid ${bit === null ? '#E2E6DF' : tone}`,
          borderRadius: 8,
          padding: '2px 12px',
          marginTop: 2,
        }}
      >
        {bit === null ? '?' : bit}
      </div>
    </div>
  );
}

function GateButton({
  gate,
  disabled,
  onPlay,
  wide,
}: {
  gate: Gate;
  disabled: boolean;
  onPlay: () => void;
  wide?: boolean;
}) {
  const tone = gate.wire === 'alice' ? '#3F5185' : gate.wire === 'bob' ? '#0081A7' : '#22252A';
  return (
    <motion.button
      type="button"
      className="qubit-choice"
      disabled={disabled}
      onClick={onPlay}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      style={{
        padding: '9px 16px',
        minWidth: wide ? 132 : 76,
        textAlign: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: tone }}>
        {gate.label}
      </div>
      <div style={{ fontSize: 10, color: '#5A6578', marginTop: 2 }}>{gate.blurb}</div>
    </motion.button>
  );
}
