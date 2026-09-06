'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import Stickman from '../../roadmap/Stickman';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   BALANCE BEAM  ·  module b1 — Math & Code Warm-Up

   The beam sits level only when |α|² + |β|² is exactly 1, so the
   stickman's balance IS the normalisation condition. Hovering an
   option tilts the beam before you commit, which turns picking an
   answer into a little physical experiment.
   ══════════════════════════════════════════════════════════════ */

interface Option {
  label: string;
  /** |β|² for this option. */
  sq: number;
}

interface Round {
  alpha: string;
  alphaSq: number;
  /** Shown once the round resolves — the point of the round. */
  note: string;
  hint: string;
  options: Option[];
}

/* The correct option is found by the arithmetic below, not by its
   position, so these lists are deliberately ordered to put the answer
   somewhere different every round — otherwise a learner stops reading
   the maths and just clicks the first card. */
const ROUNDS: Round[] = [
  {
    alpha: '0.6',
    alphaSq: 0.36,
    hint: 'Square the 0.6 first. Whatever is left over has to be the square of your β.',
    note: '0.6² = 0.36, so β² must be 0.64 — and 0.8² = 0.64. The two probabilities add to 1.',
    options: [
      { label: '0.4', sq: 0.16 },
      { label: '0.6', sq: 0.36 },
      { label: '0.8', sq: 0.64 },
      { label: '0.64', sq: 0.4096 },
    ],
  },
  {
    alpha: '1/√2',
    alphaSq: 0.5,
    hint: 'Squaring 1/√2 gives ½. You need another ½ to finish the job.',
    note: 'The even superposition: |1/√2|² = ½ on both sides, so both outcomes are equally likely.',
    options: [
      { label: '1/2', sq: 0.25 },
      { label: '1', sq: 1 },
      { label: '1/√3', sq: 1 / 3 },
      { label: '1/√2', sq: 0.5 },
    ],
  },
  {
    alpha: '1/2',
    alphaSq: 0.25,
    hint: 'A quarter is already on the beam. Which of these squares to three quarters?',
    note: '(1/2)² = ¼, and (√3/2)² = ¾. Note how 3/4 itself is the wrong answer — you need its square root.',
    options: [
      { label: '√3/2', sq: 0.75 },
      { label: '1/2', sq: 0.25 },
      { label: '3/4', sq: 0.5625 },
      { label: '1/√2', sq: 0.5 },
    ],
  },
  {
    alpha: '0.8',
    alphaSq: 0.64,
    hint: 'An i in front changes the phase, not the size. |0.6i| is still 0.6.',
    note: 'Amplitudes may be complex: |0.6i|² = 0.6² = 0.36. The i is invisible to the probability.',
    options: [
      { label: '0.8i', sq: 0.64 },
      { label: '0.6i', sq: 0.36 },
      { label: '0.36i', sq: 0.1296 },
      { label: '0.6 + 0.6i', sq: 0.72 },
    ],
  },
  {
    alpha: '(1 + i)/2',
    alphaSq: 0.5,
    hint: 'For a + bi the modulus squared is a² + b². Here that is (½)² + (½)².',
    note: '|(1+i)/2|² = (½)² + (½)² = ½. A complex amplitude with two parts, still just half the probability.',
    options: [
      { label: 'i/2', sq: 0.25 },
      { label: '1', sq: 1 },
      { label: '√3/2', sq: 0.75 },
      { label: '1/√2', sq: 0.5 },
    ],
  },
  {
    alpha: '√0.3',
    alphaSq: 0.3,
    hint: 'Squaring a square root undoes it. So 0.3 is already on the beam.',
    note: '(√0.3)² = 0.3 and (√0.7)² = 0.7. Working backwards from probabilities to amplitudes means taking roots.',
    options: [
      { label: '0.7', sq: 0.49 },
      { label: '√0.7', sq: 0.7 },
      { label: '√0.3', sq: 0.3 },
      { label: '0.3', sq: 0.09 },
    ],
  },
];

const EPS = 1e-6;
const fmt = (n: number) => (Number.isInteger(n * 100) ? n.toFixed(2) : n.toFixed(4));

export default function BalanceBeam({ api }: { api: GameApi }) {
  const round = ROUNDS[api.round];
  const [picked, setPicked] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  // New round or a restart: clear the beam.
  useEffect(() => {
    setPicked(null);
    setHover(null);
  }, [api.round, api.attempt]);

  const shown = picked ?? hover;
  const betaSq = shown === null ? 0 : round.options[shown].sq;
  const total = round.alphaSq + betaSq;

  const level = Math.abs(total - 1) < EPS;
  const correct = picked !== null && Math.abs(round.options[picked].sq - (1 - round.alphaSq)) < EPS;

  /* Over 1 tips right, under 1 tips left; exactly 1 sits flat. */
  const tilt = level ? 0 : Math.max(-19, Math.min(19, (total - 1) * 34));

  const pose = api.resolved ? (correct ? 'balance' : 'fall') : level ? 'balance' : 'stand';
  const beamColour = level ? '#76A09B' : api.resolved && !correct ? '#ED6A5A' : '#0081A7';

  const choose = (i: number) => {
    if (api.resolved) return;
    setPicked(i);
    const ok = Math.abs(round.options[i].sq - (1 - round.alphaSq)) < EPS;
    api.resolveRound(ok ? 1 : 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Prompt>
        The state is <Ket>|ψ⟩ = {round.alpha}|0⟩ + β|1⟩</Ket>. Which β makes the beam sit level?
      </Prompt>

      {api.hintShown && <HintPanel>{round.hint}</HintPanel>}

      {/* ══════════════ THE BEAM ══════════════ */}
      <Stage style={{ padding: '26px 20px 20px' }}>
        <div style={{ position: 'relative', height: 178 }}>
          {/* Beam + rider, rotating together about the fulcrum. */}
          <div
            className="qubit-beam"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 44,
              width: 'min(320px, 88%)',
              height: 10,
              borderRadius: 999,
              background: beamColour,
              /* rotate first (about the beam's centre), then centre it */
              transform: `translateX(-50%) rotate(${tilt}deg)`,
              boxShadow: '0 3px 10px rgba(34,37,42,0.14)',
            }}
          >
            {/* Load markers: |α|² fixed on the left, |β|² on the right. */}
            <Weight side="left" label={`|α|² = ${fmt(round.alphaSq)}`} tone="#0081A7" />
            {shown !== null && (
              <Weight side="right" label={`|β|² = ${fmt(betaSq)}`} tone={level ? '#76A09B' : '#ED6A5A'} />
            )}

            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '100%',
                transform: 'translateX(-50%)',
              }}
            >
              <Stickman
                pose={pose}
                size={86}
                accent={level ? '#76A09B' : '#ED6A5A'}
                label={level ? 'The stickman balances' : 'The stickman wobbles'}
              />
            </div>
          </div>

          {/* Fulcrum */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 8,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '19px solid transparent',
              borderRight: '19px solid transparent',
              borderBottom: '38px solid #22252A',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 4,
              transform: 'translateX(-50%)',
              width: 120,
              height: 4,
              borderRadius: 999,
              background: 'rgba(34,37,42,0.14)',
            }}
          />
        </div>

        {/* ── Load gauge: the arithmetic, made visible ── */}
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#5A6578',
              marginBottom: 6,
            }}
          >
            <span>Total probability</span>
            <Ket size={13} color={level ? '#4E7A74' : '#5A6578'}>
              {fmt(round.alphaSq)}
              {shown !== null ? ` + ${fmt(betaSq)} = ${fmt(total)}` : ' + ?'}
            </Ket>
          </div>
          <div
            style={{
              position: 'relative',
              height: 12,
              borderRadius: 999,
              background: 'rgba(34,37,42,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              className="qubit-load"
              style={{
                height: '100%',
                width: `${Math.min(total / 1.5, 1) * 100}%`,
                background: level ? '#76A09B' : total > 1 ? '#ED6A5A' : '#9BC1BC',
                borderRadius: 999,
              }}
            />
            {/* The 1.0 target sits at two-thirds of a 1.5-wide gauge. */}
            <div
              style={{
                position: 'absolute',
                left: '66.67%',
                top: -3,
                bottom: -3,
                width: 2,
                background: '#22252A',
              }}
            />
          </div>
          <div style={{ position: 'relative', height: 16 }}>
            <span
              style={{
                position: 'absolute',
                left: '66.67%',
                transform: 'translateX(-50%)',
                fontSize: 11,
                fontWeight: 700,
                color: '#22252A',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              1.0
            </span>
          </div>
        </div>
      </Stage>

      {/* ══════════════ OPTIONS ══════════════ */}
      <div className="roadmap-grid-4">
        {round.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = Math.abs(opt.sq - (1 - round.alphaSq)) < EPS;
          const reveal = api.resolved && isAnswer;
          return (
            <motion.button
              key={opt.label}
              type="button"
              className="qubit-choice"
              disabled={api.resolved}
              onClick={() => choose(i)}
              onMouseEnter={() => !api.resolved && setHover(i)}
              onMouseLeave={() => !api.resolved && setHover(null)}
              onFocus={() => !api.resolved && setHover(i)}
              onBlur={() => !api.resolved && setHover(null)}
              whileTap={api.resolved ? undefined : { scale: 0.97 }}
              style={{
                padding: '16px 14px',
                textAlign: 'center',
                borderColor: reveal ? '#76A09B' : isPicked ? '#ED6A5A' : undefined,
                background: reveal ? '#EBF1ED' : isPicked && !isAnswer ? '#FDECE9' : '#FFFFFF',
                opacity: api.resolved && !isPicked && !isAnswer ? 0.5 : 1,
              }}
            >
              <Ket size={19}>β = {opt.label}</Ket>
              {api.resolved && (
                <div style={{ fontSize: 12, color: '#5A6578', marginTop: 6 }}>|β|² = {fmt(opt.sq)}</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {api.resolved && (
        <Verdict ok={correct}>
          <strong>{correct ? 'Level.' : 'It tipped.'}</strong> {round.note}
        </Verdict>
      )}
    </div>
  );
}

/* A hanging weight on one end of the beam. */
function Weight({ side, label, tone }: { side: 'left' | 'right'; label: string; tone: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: side === 'left' ? 4 : undefined,
        right: side === 'right' ? 4 : undefined,
        top: '100%',
        marginTop: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div style={{ width: 2, height: 10, background: 'rgba(34,37,42,0.3)' }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: '#FFFFFF',
          background: tone,
          borderRadius: 6,
          padding: '3px 7px',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}
