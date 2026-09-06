'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, Terminal } from 'lucide-react';

import Stickman from '../../roadmap/Stickman';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   SHOT NOISE  ·  module b5 — First Circuits in Code

   Two points a round, and they test different muscles. First:
   what does the code you wrote actually predict? Then: given the
   counts that came back, is the gap statistics, the machine, or
   you? The third case is the one that bites people in practice —
   a circuit that runs perfectly and does the wrong thing.

   After the round resolves, a shots slider re-samples from the
   ideal so the 1/√N shrinkage of noise is something you can drag.
   ══════════════════════════════════════════════════════════════ */

const SHOTS = 1000;

type CauseId = 'noise' | 'hardware' | 'code';

const CAUSES: { id: CauseId; label: string; blurb: string }[] = [
  {
    id: 'noise',
    label: 'Just shot noise',
    blurb: 'A finite sample never lands exactly on the ideal ratio.',
  },
  {
    id: 'hardware',
    label: 'Hardware error',
    blurb: 'Decoherence or readout — the device is drifting off the ideal.',
  },
  {
    id: 'code',
    label: 'The circuit is wrong',
    blurb: 'It ran fine. It just is not the circuit you meant to write.',
  },
];

interface IdealOption {
  label: string;
  /** Percentages over `outcomes`. */
  dist: number[];
}

interface Round {
  intent: string;
  code: string[];
  outcomes: string[];
  idealOptions: IdealOption[];
  correctIdeal: number;
  /** Counts from the "run", summing to SHOTS. */
  observed: number[];
  cause: CauseId;
  hint: string;
  note: string;
}

/* `correctIdeal` deliberately moves around the list from round to
   round. With the answer always first, a learner learns the layout
   instead of the histogram. */
const ROUNDS: Round[] = [
  {
    intent: 'an even superposition of |0⟩ and |1⟩',
    code: ['qc = QuantumCircuit(1)', 'qc.h(0)', 'qc.measure_all()'],
    outcomes: ['|0⟩', '|1⟩'],
    idealOptions: [
      { label: 'all |0⟩', dist: [100, 0] },
      { label: '50 / 50', dist: [50, 50] },
      { label: '75 / 25', dist: [75, 25] },
    ],
    correctIdeal: 1,
    observed: [512, 488],
    cause: 'noise',
    hint: 'A 12-shot gap out of 1000 is about one part in eighty. Ask whether that is surprising.',
    note: 'For 1000 shots the spread you expect is about √(1000 × ¼) ≈ 16 counts, so 512 is comfortably inside one standard deviation. Chasing a difference this small is chasing noise.',
  },
  {
    intent: 'a Bell pair, |00⟩ and |11⟩ only',
    code: ['qc = QuantumCircuit(2)', 'qc.h(0)', 'qc.cx(0, 1)', 'qc.measure_all()'],
    outcomes: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
    idealOptions: [
      { label: '25 each', dist: [25, 25, 25, 25] },
      { label: '50 / 50 / 0 / 0', dist: [50, 50, 0, 0] },
      { label: '50 / 0 / 0 / 50', dist: [50, 0, 0, 50] },
    ],
    correctIdeal: 2,
    observed: [497, 11, 11, 481],
    cause: 'hardware',
    hint: 'Two of these outcomes have amplitude exactly zero. How many times should they appear?',
    note: 'A perfect Bell pair can never give |01⟩ or |10⟩ — their amplitude is zero, so no number of shots produces them. Seeing 22 of them is the device leaking, not statistics.',
  },
  {
    intent: 'flip the qubit to |1⟩',
    code: ['qc = QuantumCircuit(1)', 'qc.x(0)', 'qc.measure_all()'],
    outcomes: ['|0⟩', '|1⟩'],
    idealOptions: [
      { label: 'all |1⟩', dist: [0, 100] },
      { label: '50 / 50', dist: [50, 50] },
      { label: 'all |0⟩', dist: [100, 0] },
    ],
    correctIdeal: 0,
    observed: [48, 952],
    cause: 'hardware',
    hint: 'A deterministic circuit has no spread at all — its ideal standard deviation is zero.',
    note: 'X is deterministic, so every single shot should read 1. Those 48 zeros are readout error and relaxation back toward |0⟩ during the measurement, and 4.8% is a very typical figure for real hardware.',
  },
  {
    intent: 'an even superposition of |0⟩ and |1⟩',
    code: ['qc = QuantumCircuit(1)', 'qc.h(0)', 'qc.h(0)', 'qc.measure_all()'],
    outcomes: ['|0⟩', '|1⟩'],
    idealOptions: [
      { label: '50 / 50', dist: [50, 50] },
      { label: '25 / 75', dist: [25, 75] },
      { label: 'all |0⟩', dist: [100, 0] },
    ],
    correctIdeal: 2,
    observed: [997, 3],
    cause: 'code',
    hint: 'Work out what the second H does to |+⟩ before you look at the counts.',
    note: 'H is its own inverse, so h(0) twice is the identity — the ideal really is all |0⟩, and the run agrees to within 3 counts. The hardware behaved beautifully; the circuit simply is not the one you set out to write.',
  },
  {
    intent: 'a 3-to-1 bias toward |0⟩',
    code: ['qc = QuantumCircuit(1)', 'qc.ry(pi / 3, 0)', 'qc.measure_all()'],
    outcomes: ['|0⟩', '|1⟩'],
    idealOptions: [
      { label: '50 / 50', dist: [50, 50] },
      { label: '75 / 25', dist: [75, 25] },
      { label: '25 / 75', dist: [25, 75] },
    ],
    correctIdeal: 1,
    observed: [731, 269],
    cause: 'noise',
    hint: 'RY(θ) gives cos(θ/2)|0⟩ + sin(θ/2)|1⟩, and cos(π/6) = √3/2.',
    note: 'cos²(π/6) = 3/4, so 750 is the ideal and 731 is 19 low — the expected spread here is √(1000 × ¾ × ¼) ≈ 14, so this is well within the ordinary run-to-run wobble.',
  },
];

/* ── Re-sampling, for the convergence slider ──────────────────── */

/** mulberry32 — small, seeded, and good enough for a teaching demo. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One shot at a time through the inverse CDF, so the counts are honest. */
function sample(dist: number[], shots: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const counts = dist.map(() => 0);
  for (let s = 0; s < shots; s += 1) {
    const r = rand() * 100;
    let acc = 0;
    for (let i = 0; i < dist.length; i += 1) {
      acc += dist[i];
      if (r < acc) {
        counts[i] += 1;
        break;
      }
    }
  }
  return counts;
}

const SLIDER_STEPS = [32, 128, 512, 2048, 8192];

export default function ShotNoise({ api }: { api: GameApi }) {
  const round = ROUNDS[api.round];

  const [pickIdeal, setPickIdeal] = useState<number | null>(null);
  const [pickCause, setPickCause] = useState<CauseId | null>(null);
  const [step, setStep] = useState(1);

  const ideal = round.idealOptions[round.correctIdeal].dist;
  const idealOk = pickIdeal === round.correctIdeal;
  const causeOk = pickCause === round.cause;

  const chooseIdeal = (i: number) => {
    if (pickIdeal !== null) return;
    setPickIdeal(i);
  };

  const chooseCause = (id: CauseId) => {
    if (api.resolved || pickIdeal === null) return;
    setPickCause(id);
    api.resolveRound((idealOk ? 1 : 0) + (id === round.cause ? 1 : 0));
  };

  const shots = SLIDER_STEPS[step];
  const resampled = useMemo(
    () => (api.resolved ? sample(ideal, shots, 1337 + api.round * 91 + api.attempt * 7) : null),
    [api.resolved, api.round, api.attempt, ideal, shots]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Prompt>
        You set out to build <strong>{round.intent}</strong>. Here is the code you actually ran.
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      {/* ══════════════ THE CODE ══════════════ */}
      <div
        style={{
          background: '#22252A',
          borderRadius: 12,
          padding: '14px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          lineHeight: 1.75,
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#9BC1BC',
            marginBottom: 8,
          }}
        >
          <Terminal size={12} /> {SHOTS} shots
        </div>
        {round.code.map((line) => (
          <div key={line} style={{ color: '#F4F1DE', whiteSpace: 'pre' }}>
            {line}
          </div>
        ))}
      </div>

      {/* ══════════════ STEP 1 — THE IDEAL ══════════════ */}
      <div>
        <StepLabel n={1} done={pickIdeal !== null}>
          What does this code predict on a perfect machine?
        </StepLabel>
        <div className="roadmap-grid-3" style={{ marginTop: 10 }}>
          {round.idealOptions.map((opt, i) => {
            const isPicked = pickIdeal === i;
            const isAnswer = i === round.correctIdeal;
            const reveal = pickIdeal !== null && isAnswer;
            return (
              <motion.button
                key={opt.label}
                type="button"
                className="qubit-choice"
                disabled={pickIdeal !== null}
                onClick={() => chooseIdeal(i)}
                whileTap={pickIdeal !== null ? undefined : { scale: 0.97 }}
                style={{
                  padding: '13px 12px',
                  borderColor: reveal ? '#76A09B' : isPicked ? '#ED6A5A' : undefined,
                  background: reveal ? '#EBF1ED' : isPicked && !isAnswer ? '#FDECE9' : '#FFFFFF',
                  opacity: pickIdeal !== null && !isPicked && !isAnswer ? 0.45 : 1,
                }}
              >
                {/* A miniature of the distribution, so the choice is visual */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 4,
                    height: 40,
                    marginBottom: 8,
                  }}
                >
                  {opt.dist.map((p, k) => (
                    <div
                      key={k}
                      style={{
                        width: 14,
                        height: `${Math.max(p, 3)}%`,
                        borderRadius: '3px 3px 0 0',
                        background: p === 0 ? 'rgba(34,37,42,0.12)' : '#D97706',
                      }}
                    />
                  ))}
                </div>
                <Ket size={13}>{opt.label}</Ket>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══════════════ STEP 2 — THE RUN ══════════════ */}
      {pickIdeal !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <StepLabel n={2} done={api.resolved}>
            The run came back like this. Where is the gap coming from?
          </StepLabel>

          <Stage style={{ padding: '18px 20px' }}>
            <Histogram
              outcomes={round.outcomes}
              ideal={ideal}
              observed={round.observed}
              shots={SHOTS}
            />
          </Stage>

          <div className="roadmap-grid-3">
            {CAUSES.map((c) => {
              const isPicked = pickCause === c.id;
              const isAnswer = c.id === round.cause;
              const reveal = api.resolved && isAnswer;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  className="qubit-choice"
                  disabled={api.resolved}
                  onClick={() => chooseCause(c.id)}
                  whileTap={api.resolved ? undefined : { scale: 0.97 }}
                  style={{
                    padding: '14px 13px',
                    textAlign: 'left',
                    borderColor: reveal ? '#76A09B' : isPicked ? '#ED6A5A' : undefined,
                    background: reveal ? '#EBF1ED' : isPicked && !isAnswer ? '#FDECE9' : '#FFFFFF',
                    opacity: api.resolved && !isPicked && !isAnswer ? 0.45 : 1,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#22252A', marginBottom: 4 }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A6578', lineHeight: 1.5 }}>{c.blurb}</div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════ THE VERDICT + CONVERGENCE ══════════════ */}
      {api.resolved && (
        <>
          <Verdict ok={idealOk && causeOk}>
            <strong>
              {idealOk && causeOk
                ? 'Both halves right — two points.'
                : idealOk
                  ? 'Ideal right, diagnosis wrong — one point.'
                  : causeOk
                    ? 'Diagnosis right, ideal wrong — one point.'
                    : 'Neither half landed.'}
            </strong>{' '}
            {round.note}
          </Verdict>

          {/* Drag the shot count and watch noise shrink like 1/√N. */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E6DF',
              borderRadius: 14,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#22252A' }}>
                  Run the ideal circuit again — with how many shots?
                </div>
                <div style={{ fontSize: 12, color: '#5A6578', marginTop: 2 }}>
                  Noise falls as 1/√N, so quadrupling the shots halves the wobble.
                </div>
              </div>
              <Ket size={17} color="#D97706">
                {shots.toLocaleString()} shots
              </Ket>
            </div>

            <input
              type="range"
              min={0}
              max={SLIDER_STEPS.length - 1}
              step={1}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              aria-label="Number of shots"
              style={{ width: '100%', accentColor: '#D97706' }}
            />

            {resampled && (
              <div style={{ marginTop: 16 }}>
                <Histogram
                  outcomes={round.outcomes}
                  ideal={ideal}
                  observed={resampled}
                  shots={shots}
                  compact
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Ghost bars for the ideal, solid bars for what came back, and a
   stickman standing on the outcome that won.
   ══════════════════════════════════════════════════════════════ */

function Histogram({
  outcomes,
  ideal,
  observed,
  shots,
  compact,
}: {
  outcomes: string[];
  ideal: number[];
  observed: number[];
  shots: number;
  compact?: boolean;
}) {
  const height = compact ? 84 : 128;
  const total = observed.reduce((s, n) => s + n, 0) || 1;
  const peak = observed.indexOf(Math.max(...observed));
  const scale = Math.max(100, ...ideal, ...observed.map((n) => (n / total) * 100));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outcomes.length}, 1fr)`, gap: 14 }}>
        {outcomes.map((label, i) => {
          const pct = (observed[i] / total) * 100;
          const idealPct = ideal[i];
          const impossible = idealPct === 0 && observed[i] > 0;
          return (
            <div key={label} style={{ textAlign: 'center', minWidth: 0 }}>
              {!compact && (
                <div style={{ height: 34, display: 'grid', placeItems: 'end center' }}>
                  {i === peak && (
                    <Stickman
                      pose="teach"
                      size={34}
                      accent={impossible ? '#ED6A5A' : '#D97706'}
                      label="Where most shots landed"
                    />
                  )}
                </div>
              )}

              <div style={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                {/* Ideal — dashed ghost */}
                <div
                  style={{
                    flex: 1,
                    height: `${(idealPct / scale) * 100}%`,
                    minHeight: 2,
                    borderRadius: '5px 5px 0 0',
                    border: '1.5px dashed #9AA5B1',
                    background: 'rgba(154,165,177,0.1)',
                  }}
                />
                {/* Observed — solid */}
                <motion.div
                  className="qubit-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${(pct / scale) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    flex: 1,
                    minHeight: 2,
                    borderRadius: '5px 5px 0 0',
                    background: impossible ? '#ED6A5A' : '#D97706',
                  }}
                />
              </div>

              <div style={{ marginTop: 7 }}>
                <Ket size={compact ? 11 : 13}>{label}</Ket>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: impossible ? '#D95342' : '#5A6578',
                  marginTop: 2,
                }}
              >
                {observed[i]}
                <span style={{ color: '#B4BCC6' }}> / {Math.round((idealPct / 100) * shots)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          fontSize: 11,
          color: '#5A6578',
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              border: '1.5px dashed #9AA5B1',
              verticalAlign: -1,
              marginRight: 5,
            }}
          />
          ideal
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              background: '#D97706',
              borderRadius: 2,
              verticalAlign: -1,
              marginRight: 5,
            }}
          />
          measured
        </span>
      </div>
    </div>
  );
}

function StepLabel({ n, done, children }: { n: number; done: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: done ? '#76A09B' : '#D97706',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {done ? <Check size={12} /> : n}
      </span>
      <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: 15, fontWeight: 600, color: '#22252A' }}>
        {children}
      </span>
    </div>
  );
}
