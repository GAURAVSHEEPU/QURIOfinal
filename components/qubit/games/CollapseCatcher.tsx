'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

import { FLAG_EXACT_PREDICTION } from '../gameData';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   COLLAPSE CATCHER  ·  module b2 — What Is a Qubit?

   Call the split before you see it, then a hundred stickmen pour
   through the two doors and stack up into your histogram. Round 4
   is the whole point: a minus sign in front of |1⟩ changes the
   state but not a single one of these counts.

   The score is banked the instant you commit, so the pour is
   decoration — it can never cost you a point.
   ══════════════════════════════════════════════════════════════ */

const SHOTS = 100;
const TOLERANCE = 5;

interface Round {
  psi: string;
  /** P(|0⟩) as a percentage — SHOTS is 100, so also the exact count. */
  p0: number;
  hint: string;
  note: string;
}

const ROUNDS: Round[] = [
  {
    psi: '0.6|0⟩ + 0.8|1⟩',
    p0: 36,
    hint: 'The probability of |0⟩ is the amplitude squared, not the amplitude.',
    note: 'P(0) = 0.6² = 0.36, so 36 of 100 shots. The bigger amplitude sits on |1⟩, so most shots land there.',
  },
  {
    psi: '(|0⟩ + |1⟩)/√2',
    p0: 50,
    hint: 'Both amplitudes are 1/√2, and squaring that gives one half.',
    note: 'This is |+⟩. Both amplitudes square to ½, so the shots split evenly.',
  },
  {
    psi: '(√3/2)|0⟩ + (1/2)|1⟩',
    p0: 75,
    hint: '(√3/2)² = 3/4. The smaller amplitude keeps the remaining quarter.',
    note: 'P(0) = 3/4 = 75 and P(1) = 1/4 = 25. Amplitudes are lopsided, and probabilities exaggerate the gap.',
  },
  {
    psi: '(|0⟩ − |1⟩)/√2',
    p0: 50,
    hint: 'Squaring a modulus throws the sign away. |−1/√2|² = |1/√2|².',
    note: 'This is |−⟩, a genuinely different state from |+⟩ — but in this basis the counts are identical. Phase is invisible to a measurement in the computational basis; you need a Hadamard first to see it.',
  },
  {
    psi: '(1/2)|0⟩ + (√3/2)i|1⟩',
    p0: 25,
    hint: 'The i does not change the size of the amplitude, only its phase.',
    note: 'P(0) = (1/2)² = 0.25. The i on |1⟩ contributes nothing to the count: |(√3/2)i|² = 3/4.',
  },
];

/**
 * Which door each shot walks through. Spread Bresenham-style rather
 * than "first N go left", so the two stacks grow together and the
 * final split is exactly p0 : 100 − p0.
 */
function doorPlan(p0: number): number[] {
  const plan: number[] = [];
  for (let k = 0; k < SHOTS; k += 1) {
    const before = Math.floor((k * p0) / SHOTS);
    const after = Math.floor(((k + 1) * p0) / SHOTS);
    plan.push(after > before ? 0 : 1);
  }
  return plan;
}

export default function CollapseCatcher({ api }: { api: GameApi }) {
  const round = ROUNDS[api.round];
  const [guess, setGuess] = useState(50);
  const [landed, setLanded] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const plan = useMemo(() => doorPlan(round.p0), [round.p0]);

  useEffect(() => {
    setGuess(50);
    setLanded(0);
    if (timer.current) clearInterval(timer.current);
  }, [api.round, api.attempt]);

  // Always clear the pour timer when this game unmounts.
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const diff = Math.abs(guess - round.p0);
  const exact = diff === 0;
  const ok = diff <= TOLERANCE;

  const release = () => {
    if (api.resolved) return;
    api.resolveRound(ok ? 1 : 0, exact ? [FLAG_EXACT_PREDICTION] : undefined);

    /* Timer-driven, not rAF-driven, so a backgrounded tab still
       eventually shows the finished stacks. */
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLanded((n) => {
        if (n >= SHOTS) {
          if (timer.current) clearInterval(timer.current);
          return SHOTS;
        }
        return n + 4;
      });
    }, 55);
  };

  const shown = Math.min(landed, SHOTS);
  const count0 = plan.slice(0, shown).filter((d) => d === 0).length;
  const count1 = shown - count0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Prompt>
        You will fire {SHOTS} shots at <Ket>|ψ⟩ = {round.psi}</Ket>. How many collapse to <Ket>|0⟩</Ket>?
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      {/* ══════════════ THE DIAL ══════════════ */}
      {!api.resolved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            background: '#FFFFFF',
            border: '1px solid #E2E6DF',
            borderRadius: 14,
            padding: '16px 18px',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <label
              htmlFor="collapse-guess"
              style={{ display: 'block', fontSize: 12, color: '#5A6578', marginBottom: 10 }}
            >
              Shots landing in |0⟩ — drag to predict
            </label>
            <input
              id="collapse-guess"
              type="range"
              min={0}
              max={100}
              step={1}
              value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ED6A5A' }}
            />
          </div>
          <div style={{ textAlign: 'center', minWidth: 90 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 30,
                fontWeight: 700,
                color: '#ED6A5A',
                lineHeight: 1,
              }}
            >
              {guess}
            </div>
            <div style={{ fontSize: 11, color: '#5A6578', marginTop: 4 }}>of {SHOTS}</div>
          </div>
          <button type="button" onClick={release} className="btn-atlas-coral" style={{ fontSize: 14 }}>
            <Play size={14} /> Release the shots
          </button>
        </div>
      )}

      {/* ══════════════ THE DOORS ══════════════ */}
      <Stage>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Door
            ket="|0⟩"
            tone="#0081A7"
            count={count0}
            total={round.p0}
            revealed={api.resolved}
            figures={count0}
          />
          <Door
            ket="|1⟩"
            tone="#ED6A5A"
            count={count1}
            total={SHOTS - round.p0}
            revealed={api.resolved}
            figures={count1}
          />
        </div>

        {/* Your call against the truth. */}
        <div style={{ marginTop: 18 }}>
          <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(34,37,42,0.07)' }}>
            <div
              className="qubit-load"
              style={{
                height: '100%',
                width: `${round.p0}%`,
                borderRadius: 999,
                background: '#0081A7',
                opacity: api.resolved ? 1 : 0,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${guess}%`,
                top: -6,
                bottom: -6,
                width: 2,
                background: '#ED6A5A',
                transition: 'left 0.2s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#5A6578',
              marginTop: 7,
            }}
          >
            <span>
              <span style={{ color: '#ED6A5A', fontWeight: 700 }}>▌</span> your call: {guess}
            </span>
            {api.resolved && (
              <span>
                <span style={{ color: '#0081A7', fontWeight: 700 }}>▬</span> actual: {round.p0}
              </span>
            )}
          </div>
        </div>
      </Stage>

      {api.resolved && (
        <Verdict ok={ok}>
          <strong>
            {exact
              ? 'Exactly right.'
              : ok
                ? `Within ${TOLERANCE} — that counts.`
                : `Off by ${diff}.`}
          </strong>{' '}
          {round.note}
        </Verdict>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   A door and the stack of stickmen that came through it.
   ══════════════════════════════════════════════════════════════ */

function Door({
  ket,
  tone,
  count,
  total,
  revealed,
  figures,
}: {
  ket: string;
  tone: string;
  count: number;
  total: number;
  revealed: boolean;
  figures: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* The door itself */}
      <div
        style={{
          width: '100%',
          maxWidth: 150,
          height: 54,
          borderRadius: '14px 14px 0 0',
          border: `2px solid ${tone}`,
          borderBottom: 'none',
          background: '#FFFFFF',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Ket size={20} color={tone}>
          {ket}
        </Ket>
      </div>

      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: revealed ? tone : '#B4BCC6',
          lineHeight: 1,
        }}
      >
        {revealed ? count : '—'}
        {revealed && count < total && <span style={{ fontSize: 13, color: '#5A6578' }}> / {total}</span>}
      </div>

      {/* The pile. Each figure fades in as it lands. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'flex-start',
          gap: 3,
          minHeight: 96,
          width: '100%',
        }}
      >
        {Array.from({ length: figures }, (_, i) => (
          <MiniFigure key={i} tone={tone} index={i} />
        ))}
      </div>
    </div>
  );
}

/* A 10×16 stickman — cheap enough to draw a hundred of. */
function MiniFigure({ tone, index }: { tone: string; index: number }) {
  return (
    <motion.svg
      className="qubit-figure"
      width={10}
      height={16}
      viewBox="0 0 10 16"
      aria-hidden
      style={{ animationDelay: `${Math.min(index, 24) * 0.012}s`, overflow: 'visible' }}
    >
      <circle cx="5" cy="3" r="2.6" fill="#FAFAF8" stroke={tone} strokeWidth="1.6" />
      <path
        d="M5,6 L5,10 M5,7 L2,9 M5,7 L8,9 M5,10 L2.6,15 M5,10 L7.4,15"
        stroke={tone}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  );
}
