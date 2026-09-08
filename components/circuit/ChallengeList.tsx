'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, HelpCircle, Trophy } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { CHALLENGES, CIRCUIT_ACCENT, CIRCUIT_SOFT, CIRCUIT_INK } from './circuitData';

/* ══════════════════════════════════════════════════════════════
   CHALLENGES — what replaced the three floating learning clouds.

   Each one is checked against the simulated state after every
   run, never against the gate list, so any circuit that genuinely
   produces the state counts. Clearing one raises a flag in the
   shared progress store; clearing all five earns Circuit
   Architect on /profile.

   Hints stay folded away by default. Being told the answer before
   you have tried is the thing the clouds got wrong.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

export interface ChallengeListProps {
  passed: string[];
  /** The one that was just cleared, for the tick animation. */
  justPassed: string | null;
}

export default function ChallengeList({ passed, justPassed }: ChallengeListProps) {
  const [openHint, setOpenHint] = useState<string | null>(null);
  const done = passed.length;
  const all = done === CHALLENGES.length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#22252A',
            }}
          >
            Challenges
          </div>
          <p style={{ fontSize: 12, color: '#5A6578', marginTop: 2 }}>
            Build the state. Any circuit that gets there counts.
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 700,
            color: all ? CIRCUIT_ACCENT : '#8A93A0',
            background: all ? CIRCUIT_SOFT : '#F1F3EE',
            borderRadius: 999,
            padding: '4px 10px',
          }}
        >
          {done}/{CHALLENGES.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CHALLENGES.map((challenge) => {
          const cleared = passed.includes(challenge.id);
          const hinting = openHint === challenge.id;
          const Icon = challenge.icon;

          return (
            <div
              key={challenge.id}
              style={{
                background: cleared ? CIRCUIT_SOFT : '#FFFFFF',
                border: `1px solid ${cleared ? CIRCUIT_ACCENT : '#E2E6DF'}`,
                borderRadius: 14,
                padding: '11px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span
                  className={challenge.id === justPassed ? 'circuit-tick' : undefined}
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 9,
                    display: 'grid',
                    placeItems: 'center',
                    background: cleared ? CIRCUIT_ACCENT : '#F1F3EE',
                    color: cleared ? '#FFFFFF' : '#8A93A0',
                  }}
                >
                  {cleared ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 7,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#22252A' }}>
                      {challenge.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: cleared ? CIRCUIT_INK : '#8A93A0',
                      }}
                    >
                      {challenge.teaches}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#3A3F47', lineHeight: 1.55, marginTop: 3 }}>
                    {challenge.goal}
                  </p>

                  {!cleared && (
                    <button
                      type="button"
                      onClick={() => setOpenHint(hinting ? null : challenge.id)}
                      aria-expanded={hinting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 7,
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: CIRCUIT_INK,
                        fontSize: 11.5,
                        fontWeight: 700,
                        font: 'inherit',
                      }}
                    >
                      <HelpCircle size={12} /> {hinting ? 'Hide hint' : 'Hint'}
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {hinting && !cleared && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        style={{
                          overflow: 'hidden',
                          fontSize: 12,
                          color: '#5A6578',
                          lineHeight: 1.55,
                        }}
                      >
                        <span style={{ display: 'block', paddingTop: 6 }}>{challenge.hint}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── The cheer ── */}
      <AnimatePresence>
        {all && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              marginTop: 12,
              background: CIRCUIT_SOFT,
              border: `1px solid ${CIRCUIT_ACCENT}`,
              borderRadius: 16,
              padding: '10px 14px',
            }}
          >
            <Stickman pose="celebrate" size={84} accent={CIRCUIT_ACCENT} style={{ flexShrink: 0 }} />
            <div style={{ paddingBottom: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#22252A',
                }}
              >
                <Trophy size={14} color={CIRCUIT_ACCENT} /> Circuit Architect
              </div>
              <p style={{ fontSize: 12, color: '#7A5B0A', lineHeight: 1.55, marginTop: 2 }}>
                All five cleared. The badge is on your profile.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
