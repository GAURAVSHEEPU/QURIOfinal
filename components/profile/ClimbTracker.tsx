'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Flag, Mountain } from 'lucide-react';

import Stickman, { type StickmanPose } from '../roadmap/Stickman';
import { GAMES } from '../qubit/gameData';
import { TIER_META, type Progress } from '../qubit/progressStore';

/* ══════════════════════════════════════════════════════════════
   CLIMB TRACKER — the headline animation on /profile.

   The same ridge line the roadmap hero draws, with a stickman
   standing wherever the learner actually is. Twelve steps get you
   to the summit: reading a module is half a step, clearing its
   game is the other half, so both halves of the loop move him.

   Position comes from getPointAtLength on the real path, so the
   climber sits *on* the ridge rather than near it. The move is a
   CSS transition on left/top rather than a spring: the same idiom
   as the Gate Hopscotch hopper, and it lands on the right spot
   even in a tab that is not currently painting frames.
   ══════════════════════════════════════════════════════════════ */

const RIDGE = 'M0,232 C160,232 200,190 330,186 C460,182 500,132 630,128 C760,124 800,66 1000,60';
const VB_W = 1000;
const VB_H = 260;

/** Where module n's flag sits along the ridge — module 6 is the summit. */
const flagAt = (i: number) => (i + 1) / GAMES.length;

interface ClimbTrackerProps {
  progress: Progress;
  hydrated: boolean;
}

export default function ClimbTracker({ progress, hydrated }: ClimbTrackerProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const ridgeRef = useRef<HTMLDivElement | null>(null);
  const [len, setLen] = useState(0);
  const [moving, setMoving] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  /* Path length is intrinsic to the geometry, so one read is enough. */
  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);

  /* The flags and climber sit on the ridge, so they must be sized in
     the container's *pixels*, not viewBox percentages. A percentage
     `left` resolves against the containing block — if that block ever
     measures 0px (a collapsed column, a late layout pass, a resize
     mid-animation) the whole ridge silently piles up on the left edge.
     `preserveAspectRatio="none"` makes the mapping linear, so a pixel
     scale is exact. */
  useLayoutEffect(() => {
    const el = ridgeRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setBox({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const steps = hydrated
    ? GAMES.reduce((sum, g) => {
        const studied = progress.studied.includes(g.milestoneId) ? 1 : 0;
        const cleared = progress.games[g.id]?.tier ? 1 : 0;
        return sum + studied + cleared;
      }, 0)
    : 0;
  const total = GAMES.length * 2;
  const fraction = steps / total;
  const pct = Math.round(fraction * 100);
  const summited = steps === total;

  /* Stride while the transition runs. setTimeout still fires in a
     backgrounded tab, so he never gets stuck mid-stride. */
  useEffect(() => {
    if (!hydrated || fraction === 0) return;
    setMoving(true);
    const t = window.setTimeout(() => setMoving(false), 1300);
    return () => window.clearTimeout(t);
  }, [fraction, hydrated]);

  const pointAt = (f: number) => {
    if (!pathRef.current || len === 0) return { x: 0, y: VB_H };
    const p = pathRef.current.getPointAtLength(len * Math.min(Math.max(f, 0), 1));
    return { x: p.x, y: p.y };
  };

  const here = pointAt(fraction);

  /* Place on the rendered ridge, in pixels: viewBox position scaled
     by the container's measured size. Falls back to percentages only
     before the box is known, which never happens visibly because the
     ridge renders after `len` is read (also a layout effect). */
  const vs = box.w > 0 && box.h > 0;
  const at = (p: { x: number; y: number }) =>
    vs
      ? { left: `${(p.x / VB_W) * box.w}px`, top: `${(p.y / VB_H) * box.h}px` }
      : { left: `${(p.x / VB_W) * 100}%`, top: `${(p.y / VB_H) * 100}%` };

  const pose: StickmanPose = summited ? 'celebrate' : moving ? 'walk' : fraction === 0 ? 'read' : 'stand';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E6DF',
        borderRadius: 22,
        padding: '26px 24px 20px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#00607D',
              marginBottom: 6,
            }}
          >
            <Mountain size={13} /> The Base Camp climb
          </div>
          <h2
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
              fontWeight: 700,
              color: '#22252A',
              letterSpacing: '-0.01em',
            }}
          >
            {summited
              ? 'Summit reached'
              : fraction === 0
                ? 'Still at the trailhead'
                : `${pct}% of the way up`}
          </h2>
        </div>

        <div style={{ textAlign: 'right', minWidth: 150 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: '#00607D',
            }}
          >
            {steps} / {total}
          </div>
          <div style={{ fontSize: 12, color: '#5A6578', lineHeight: 1.5, marginTop: 2 }}>
            steps — one for reading each module, one for clearing its game
          </div>
        </div>
      </div>

      {/* ══════════════ THE RIDGE ══════════════ */}
      <div
        ref={ridgeRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${VB_W} / ${VB_H}`,
          minHeight: 200,
          marginTop: 10,
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          aria-hidden="true"
          focusable="false"
        >
          {/* The route, dotted ahead of you */}
          <path
            ref={pathRef}
            d={RIDGE}
            fill="none"
            stroke="#D9DEE4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 9"
          />
          {/* The stretch already climbed, drawn solid over it */}
          {len > 0 && (
            <path
              className="qubit-route"
              d={RIDGE}
              fill="none"
              stroke="#9BC1BC"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: len,
                strokeDashoffset: len * (1 - fraction),
              }}
            />
          )}

          {/* Summit flag, matching the roadmap hero */}
          <line
            x1="946"
            y1="62"
            x2="946"
            y2="18"
            stroke="#22252A"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M946,18 L988,27 L946,36 Z" fill={summited ? '#ED6A5A' : '#E2E6DF'} />
        </svg>

        {/* ── Module flags along the ridge ── */}
        {len > 0 &&
          GAMES.map((game, i) => {
            const p = pointAt(flagAt(i));
            const studied = hydrated && progress.studied.includes(game.milestoneId);
            const tier = hydrated ? progress.games[game.id]?.tier ?? null : null;
            const meta = tier ? TIER_META[tier] : null;
            return (
              <div
                key={game.id}
                className="qubit-hill-flag"
                title={`Module ${game.order} · ${game.title}`}
                style={{
                  position: 'absolute',
                  ...at(p),
                  transform: 'translate(-50%, -100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: meta ? meta.fill : studied ? '#FFFFFF' : 'rgba(34,37,42,0.04)',
                    border: meta
                      ? `1.5px solid ${meta.ring}`
                      : studied
                        ? '1.5px solid #9BC1BC'
                        : '1.5px dashed rgba(34,37,42,0.18)',
                  }}
                >
                  <Flag size={12} color={meta ? meta.ink : studied ? '#4E7A74' : '#B4BCC6'} />
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: meta ? meta.ink : studied ? '#4E7A74' : '#B4BCC6',
                  }}
                >
                  {game.order}
                </span>
              </div>
            );
          })}

        {/* ── The climber ── */}
        {len > 0 && (
          <div
            className="qubit-climber"
            style={{
              position: 'absolute',
              ...at(here),
              transform: 'translate(-50%, -88%)',
              zIndex: 2,
            }}
          >
            <Stickman
              pose={pose}
              striding={moving && !summited}
              size={96}
              accent={summited ? '#ED6A5A' : '#0081A7'}
              label={`Your climber, ${pct}% of the way up Base Camp`}
            />
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontSize: 11.5,
          color: '#5A6578',
          borderTop: '1px solid #EDF0EA',
          paddingTop: 14,
          marginTop: 4,
        }}
      >
        <LegendKey swatch={<span className="qubit-key" style={{ border: '1.5px dashed rgba(34,37,42,0.18)' }} />}>
          not started
        </LegendKey>
        <LegendKey swatch={<span className="qubit-key" style={{ border: '1.5px solid #9BC1BC', background: '#FFFFFF' }} />}>
          module read
        </LegendKey>
        <LegendKey
          swatch={
            <span
              className="qubit-key"
              style={{ border: `1.5px solid ${TIER_META.gold.ring}`, background: TIER_META.gold.fill }}
            />
          }
        >
          game cleared
        </LegendKey>
      </div>

      {!hydrated && (
        <p style={{ fontSize: 11.5, color: '#B4BCC6', textAlign: 'center', marginTop: 10 }}>
          Reading your progress from this browser…
        </p>
      )}

      {hydrated && fraction === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: 13,
            color: '#5A6578',
            textAlign: 'center',
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          Nothing logged yet. Mark a Base Camp module studied on the roadmap and he takes his first
          step.
        </motion.p>
      )}
    </div>
  );
}

function LegendKey({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {swatch}
      {children}
    </span>
  );
}
