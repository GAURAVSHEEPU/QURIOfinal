'use client';

import { motion } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { CIRCUIT_ACCENT, CIRCUIT_SOFT, GATES } from './circuitData';
import type { GateName } from './simulator';

/* ══════════════════════════════════════════════════════════════
   GATE PALETTE

   The uploaded builder placed gates by HTML5 drag-and-drop only.
   That silently does nothing on a touch screen, and this site is
   built to work at 375px — so the primary interaction here is
   tap-to-arm, tap-a-cell-to-place, with dragging kept as a
   shortcut for anyone using a mouse. The armed tile is a real
   toggle button with aria-pressed, so it works from the keyboard
   too.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

export interface GatePaletteProps {
  armed: GateName | null;
  onArm: (gate: GateName | null) => void;
  /** Set while a CNOT control is placed and waiting for its target. */
  awaitingTarget: boolean;
}

export default function GatePalette({ armed, onArm, awaitingTarget }: GatePaletteProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#5A6578',
            marginBottom: 4,
          }}
        >
          Gates
        </div>
        <p style={{ fontSize: 12.5, color: '#5A6578', lineHeight: 1.55 }}>
          Pick one, then tap a cell on the board. Dragging works too.
        </p>
      </div>

      <div className="circuit-palette">
        {GATES.map((spec, i) => {
          const active = armed === spec.gate;
          return (
            /* The reveal lives on a wrapper rather than on the button
               itself: framer-motion claims onDragStart for its own
               gesture system, and we need the HTML5 one. */
            <motion.div
              key={spec.gate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
            >
              <button
                type="button"
                className="circuit-gate-card"
                aria-pressed={active}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('gate', spec.gate);
                  event.dataTransfer.effectAllowed = 'copy';
                  onArm(spec.gate);
                }}
                onClick={() => onArm(active ? null : spec.gate)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  width: '100%',
                  textAlign: 'left',
                  background: active ? CIRCUIT_SOFT : '#FFFFFF',
                  border: `1.5px solid ${active ? CIRCUIT_ACCENT : '#E2E6DF'}`,
                  borderRadius: 14,
                  padding: '10px 12px',
                  cursor: 'grab',
                  font: 'inherit',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: 11,
                    display: 'grid',
                    placeItems: 'center',
                    background: spec.tint,
                    color: spec.ink,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: spec.gate === 'CNOT' ? 20 : 17,
                    fontWeight: 700,
                  }}
                >
                  {spec.glyph}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#22252A',
                    }}
                  >
                    {spec.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#5A6578',
                      marginTop: 2,
                    }}
                  >
                    {spec.formula}
                  </span>
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ── What to do next ── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          background: armed || awaitingTarget ? CIRCUIT_SOFT : '#F6F7F4',
          border: `1px solid ${armed || awaitingTarget ? CIRCUIT_ACCENT : '#E2E6DF'}`,
          borderRadius: 14,
          padding: '11px 12px',
        }}
      >
        <MousePointerClick
          size={14}
          color={armed || awaitingTarget ? CIRCUIT_ACCENT : '#8A93A0'}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <span style={{ fontSize: 12, color: '#3A3F47', lineHeight: 1.55 }}>
          {awaitingTarget
            ? 'Now click a different wire in the same column to be the target.'
            : armed === 'CNOT'
              ? 'Click a cell to set the control qubit.'
              : armed
                ? `Click any empty cell to place ${armed}.`
                : 'Nothing selected. Click a gate above to begin.'}
        </span>
      </div>

      {/* ── The cart ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '4px 2px 0',
        }}
      >
        <Stickman
          pose={armed ? 'point' : 'stand'}
          size={64}
          accent={CIRCUIT_ACCENT}
          label="Stickman holding the gate cart"
        />
        <span style={{ fontSize: 11.5, color: '#8A93A0', lineHeight: 1.5, paddingBottom: 8 }}>
          {armed ? `Holding ${armed}.` : 'Cart empty.'}
        </span>
      </div>
    </div>
  );
}
