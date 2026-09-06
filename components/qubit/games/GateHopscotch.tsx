'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Undo2 } from 'lucide-react';

import Stickman from '../../roadmap/Stickman';
import { hopscotchParFlag } from '../gameData';
import { HintPanel, Ket, Prompt, Stage, Verdict, type GameApi } from '../GameShell';

/* ══════════════════════════════════════════════════════════════
   GATE HOPSCOTCH  ·  module b3 — Your First Gates

   The six cardinal states of the Bloch sphere are pads in a ring,
   and each gate is a hop. All four gates are closed on this set,
   so the whole of single-qubit gate composition becomes a board
   game you can reason about without any matrix algebra.
   ══════════════════════════════════════════════════════════════ */

const STATES = ['|0⟩', '|1⟩', '|+⟩', '|−⟩', '|+i⟩', '|−i⟩'] as const;

/* Permutations on the six pads, up to global phase.
   Indices: 0=|0⟩ 1=|1⟩ 2=|+⟩ 3=|−⟩ 4=|+i⟩ 5=|−i⟩ */
const GATES = {
  X: { map: [1, 0, 2, 3, 5, 4], blurb: 'flips |0⟩ and |1⟩' },
  Z: { map: [0, 1, 3, 2, 5, 4], blurb: 'flips |+⟩ and |−⟩' },
  H: { map: [2, 3, 0, 1, 5, 4], blurb: 'swaps the two bases' },
  S: { map: [0, 1, 4, 5, 3, 2], blurb: 'turns the equator by 90°' },
} as const;

type GateName = keyof typeof GATES;
const GATE_NAMES = Object.keys(GATES) as GateName[];

/* Ring order, chosen so the poles sit opposite each other. */
const RING_ORDER = [0, 2, 4, 1, 3, 5];

const VB_W = 360;
const VB_H = 300;
const R = 108;

function padPoint(state: number) {
  const slot = RING_ORDER.indexOf(state);
  const a = ((-90 + slot * 60) * Math.PI) / 180;
  return { x: VB_W / 2 + R * Math.cos(a), y: VB_H / 2 + R * Math.sin(a) };
}

interface Puzzle {
  start: number;
  target: number;
  par: number;
  hint: string;
  solution: string;
}

const PUZZLES: Puzzle[] = [
  { start: 0, target: 1, par: 1, hint: 'One gate flips the poles and leaves the equator alone.', solution: 'X' },
  { start: 0, target: 2, par: 1, hint: 'Hadamard is the bridge between the poles and the equator.', solution: 'H' },
  { start: 0, target: 3, par: 2, hint: 'Get to |+⟩ first, then flip along the equator.', solution: 'H then Z' },
  { start: 0, target: 4, par: 2, hint: 'Reach the equator, then give it a quarter turn.', solution: 'H then S' },
  { start: 2, target: 5, par: 2, hint: 'You are already on the equator — flip, then turn.', solution: 'Z then S' },
  { start: 1, target: 4, par: 3, hint: 'Come back to |0⟩ before you try to reach the equator.', solution: 'X, H, then S' },
];

export default function GateHopscotch({ api }: { api: GameApi }) {
  const puzzle = PUZZLES[api.round];
  const budget = puzzle.par + 2;

  const [queue, setQueue] = useState<GateName[]>([]);
  const [preview, setPreview] = useState<GateName | null>(null);
  const [outcome, setOutcome] = useState<'solved' | 'stuck' | null>(null);

  const at = queue.reduce((s, g) => GATES[g].map[s], puzzle.start);
  const previewAt = preview ? GATES[preview].map[at] : null;
  const hops = queue.length;
  const left = budget - hops;

  const play = (g: GateName) => {
    if (api.resolved) return;
    const next = [...queue, g];
    const landed = GATES[g].map[at];
    setQueue(next);
    setPreview(null);

    if (landed === puzzle.target) {
      setOutcome('solved');
      /* Par is tracked per puzzle so the badge can require all six —
         earned across attempts, which keeps it reachable. */
      api.resolveRound(1, next.length <= puzzle.par ? [hopscotchParFlag(api.round)] : undefined);
    } else if (next.length >= budget) {
      setOutcome('stuck');
      api.resolveRound(0);
    }
  };

  const undo = () => {
    if (api.resolved) return;
    setQueue((q) => q.slice(0, -1));
  };

  const reset = () => {
    if (api.resolved) return;
    setQueue([]);
    setPreview(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Prompt>
        Hop from <Ket color="#5A6578">{STATES[puzzle.start]}</Ket> to{' '}
        <Ket color="#76A09B">{STATES[puzzle.target]}</Ket> — par is {puzzle.par} hop
        {puzzle.par > 1 ? 's' : ''}, and you have {budget}.
      </Prompt>

      {api.hintShown && <HintPanel>{puzzle.hint}</HintPanel>}

      {/* ══════════════ THE RING ══════════════ */}
      <Stage style={{ padding: 14 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: `${VB_W} / ${VB_H}`, maxWidth: 460, margin: '0 auto' }}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" aria-hidden>
            {/* The ring the pads sit on */}
            <circle
              cx={VB_W / 2}
              cy={VB_H / 2}
              r={R}
              fill="none"
              stroke="rgba(34,37,42,0.13)"
              strokeWidth="2"
              strokeDasharray="2 8"
            />

            {/* The hop that is about to happen */}
            {previewAt !== null && previewAt !== at && (
              <line
                x1={padPoint(at).x}
                y1={padPoint(at).y}
                x2={padPoint(previewAt).x}
                y2={padPoint(previewAt).y}
                stroke="#ED6A5A"
                strokeWidth="2.5"
                strokeDasharray="6 5"
                strokeLinecap="round"
              />
            )}

            {STATES.map((label, s) => {
              const p = padPoint(s);
              const isTarget = s === puzzle.target;
              const isHere = s === at;
              const isPreview = s === previewAt;
              return (
                <g key={label}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={30}
                    fill={isTarget ? '#EBF1ED' : isHere ? '#E6F4F8' : '#FFFFFF'}
                    stroke={isPreview ? '#ED6A5A' : isTarget ? '#76A09B' : isHere ? '#0081A7' : '#E2E6DF'}
                    strokeWidth={isTarget || isHere || isPreview ? 2.6 : 1.6}
                  />
                  {isTarget && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={37}
                      fill="none"
                      stroke="#76A09B"
                      strokeWidth="2"
                      strokeDasharray="4 6"
                      opacity="0.75"
                    />
                  )}
                  <text
                    x={p.x}
                    y={p.y + 6}
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="17"
                    fontWeight="700"
                    fill={isTarget ? '#4E7A74' : '#22252A'}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* The hopper. Percentages line up with the viewBox because the
              container carries the same aspect ratio. */}
          <div
            style={{
              position: 'absolute',
              left: `${(padPoint(at).x / VB_W) * 100}%`,
              top: `${(padPoint(at).y / VB_H) * 100}%`,
              transform: 'translate(-50%, -84%)',
              transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1), top 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
            }}
          >
            <Stickman
              pose={outcome === 'solved' ? 'celebrate' : 'walk'}
              striding={outcome !== 'solved'}
              size={70}
              accent={outcome === 'solved' ? '#76A09B' : '#ED6A5A'}
              label="Your stickman on the current state"
            />
          </div>
        </div>
      </Stage>

      {/* ══════════════ GATE CARDS ══════════════ */}
      <div className="roadmap-grid-4">
        {GATE_NAMES.map((g) => {
          const dest = GATES[g].map[at];
          return (
            <motion.button
              key={g}
              type="button"
              className="qubit-choice"
              disabled={api.resolved}
              onClick={() => play(g)}
              onMouseEnter={() => !api.resolved && setPreview(g)}
              onMouseLeave={() => !api.resolved && setPreview(null)}
              onFocus={() => !api.resolved && setPreview(g)}
              onBlur={() => !api.resolved && setPreview(null)}
              whileTap={api.resolved ? undefined : { scale: 0.96 }}
              style={{ padding: '13px 12px', textAlign: 'center', opacity: api.resolved ? 0.55 : 1 }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#0081A7',
                }}
              >
                {g}
              </div>
              <div style={{ fontSize: 11, color: '#5A6578', marginTop: 4 }}>{GATES[g].blurb}</div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: dest === at ? '#B4BCC6' : '#76A09B',
                  marginTop: 6,
                  fontWeight: 700,
                }}
              >
                → {STATES[dest]}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ══════════════ QUEUE + BUDGET ══════════════ */}
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
            queue.map((g, i) => (
              <motion.span
                key={`${g}-${i}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#0081A7',
                  borderRadius: 6,
                  padding: '3px 9px',
                }}
              >
                {g}
              </motion.span>
            ))
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: left <= 1 ? '#D95342' : '#5A6578',
              marginLeft: 6,
            }}
          >
            {hops} hop{hops === 1 ? '' : 's'} · {left} left
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
              <RotateCcw size={12} /> Reset pads
            </button>
          </div>
        )}
      </div>

      {api.resolved && (
        <Verdict ok={outcome === 'solved'}>
          {outcome === 'solved' ? (
            <>
              <strong>
                {hops <= puzzle.par ? `At par — ${hops} hop${hops === 1 ? '' : 's'}.` : `Landed it in ${hops} hops.`}
              </strong>{' '}
              The shortest route is <Ket size={13}>{puzzle.solution}</Ket>
              {hops > puzzle.par ? ' — worth retrying for the par badge.' : '.'}
            </>
          ) : (
            <>
              <strong>Out of hops.</strong> The shortest route from {STATES[puzzle.start]} to{' '}
              {STATES[puzzle.target]} is <Ket size={13}>{puzzle.solution}</Ket>.
            </>
          )}
        </Verdict>
      )}
    </div>
  );
}
