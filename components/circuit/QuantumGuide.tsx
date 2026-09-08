'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { CIRCUIT_ACCENT, CIRCUIT_SOFT, type GuideMessage } from './circuitData';

/* ══════════════════════════════════════════════════════════════
   THE GUIDE — the stickman who narrates the board.

   The uploaded builder drew this figure by hand from <circle> and
   <line> elements three separate times. Here it is the project's
   Stickman, so it shares its poses, its accent and its
   reduced-motion handling with the roadmap walker and the
   /profile climber.

   The message is a live region: it changes on every drop, every
   run and every cleared challenge, and a screen reader should
   hear it without having to go looking.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

export interface QuantumGuideProps {
  guide: GuideMessage;
  /** Compact drops the tip line — used when the guide sits under the board. */
  compact?: boolean;
}

export default function QuantumGuide({ guide, compact = false }: QuantumGuideProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        background: '#FFFFFF',
        border: '1px solid #E2E6DF',
        borderRadius: 18,
        padding: '14px 16px',
      }}
    >
      <Stickman
        pose={guide.pose}
        size={compact ? 68 : 88}
        accent={CIRCUIT_ACCENT}
        label="Your quantum guide"
        style={{ flexShrink: 0 }}
      />

      <div style={{ minWidth: 0, flex: 1 }} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={guide.title + guide.message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#22252A',
                marginBottom: 4,
              }}
            >
              {guide.title}
            </div>
            <p style={{ fontSize: 13, color: '#3A3F47', lineHeight: 1.6 }}>{guide.message}</p>
            {!compact && (
              <div
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'flex-start',
                  marginTop: 9,
                  background: CIRCUIT_SOFT,
                  borderRadius: 10,
                  padding: '7px 10px',
                }}
              >
                <Lightbulb size={13} color={CIRCUIT_ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: '#7A5B0A', lineHeight: 1.5 }}>{guide.tip}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
