'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import Link from 'next/link';
import { CheckCircle2, Check, ChevronDown, Circle, ExternalLink, Flag, Gamepad2, Lock, Target } from 'lucide-react';

import Stickman from './Stickman';
import { resolveResources, type Track } from './roadmapData';
import { KIND_ICON, KIND_TINT } from './resourceMeta';
import { GAME_BY_MILESTONE } from '../qubit/gameData';
import { useProgress } from '../qubit/progressStore';

/* ══════════════════════════════════════════════════════════════
   SCROLL TRACK
   Milestones down a serpentine path, with a stickman that walks
   it as you scroll.

   Geometry is *measured from the DOM* rather than assumed, so
   rows can be any height (cards expand) and the path still
   threads exactly through every node at any viewport width.

   The scroll handler writes to motion values and to element
   styles directly — no React state is touched per frame. The
   only state updates are the active-milestone index (≤ n per
   full scroll) and the stride on/off toggle.
   ══════════════════════════════════════════════════════════════ */

interface Point {
  x: number;
  y: number;
}

interface Geometry {
  d: string;
  width: number;
  height: number;
  nodes: Point[];
}

const EMPTY_GEOMETRY: Geometry = {
  d: '',
  width: 0,
  height: 0,
  nodes: [],
};

const NARROW_BREAKPOINT = 900;
const WALKER_HEIGHT = 74;

/* Nodes sit on a single centre line, so this resolves to a straight
   spine. The bezier form is kept because it costs nothing and keeps
   getPointAtLength() working identically if the layout ever changes. */
function buildPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const dy = (b.y - a.y) * 0.5;
    d +=
      ` C${a.x.toFixed(2)},${(a.y + dy).toFixed(2)}` +
      ` ${b.x.toFixed(2)},${(b.y - dy).toFixed(2)}` +
      ` ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
  }
  return d;
}

export interface ScrollTrackProps {
  track: Track;
}

export default function ScrollTrack({ track }: ScrollTrackProps) {
  const prefersReducedMotion = useReducedMotion();

  /* Studied state drives the Qurio Qubit locks. `hydrated` is false on
     the server and the first client render, so the control below always
     draws its unstudied face first — see progressStore.ts. */
  const { progress, hydrated, markStudied, unmarkStudied } = useProgress();

  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const walkerInnerRef = useRef<HTMLDivElement>(null);

  const totalLenRef = useRef(0);
  const nodeFracsRef = useRef<number[]>([]);
  const activeIndexRef = useRef(0);
  const stridingRef = useRef(false);
  const strideTimerRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  const [geometry, setGeometry] = useState<Geometry>(EMPTY_GEOMETRY);
  const [isNarrow, setIsNarrow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStriding, setIsStriding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const walkerX = useMotionValue(0);
  const walkerY = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.8', 'end 0.5'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 22,
    mass: 0.4,
  });

  /* ── Resolve the breakpoint ──
     This runs as its own layout pass so the narrow/wide grid is committed
     *before* measure() reads the node positions. Measuring first would
     capture the wide three-column layout on a phone and bake those x
     values into the path. */
  const measureBreakpoint = useCallback(() => {
    const container = trackRef.current;
    if (!container) return;
    const narrow = container.getBoundingClientRect().width < NARROW_BREAKPOINT;
    setIsNarrow((prev) => (prev === narrow ? prev : narrow));
  }, []);

  /* ── Measure geometry from the laid-out DOM ── */
  const measure = useCallback(() => {
    const container = trackRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const pts: Point[] = [];

    for (let i = 0; i < track.milestones.length; i += 1) {
      const el = nodeRefs.current[i];
      if (!el) return;
      const r = el.getBoundingClientRect();
      pts.push({
        x: r.left - cRect.left + r.width / 2,
        y: r.top - cRect.top + r.height / 2,
      });
    }
    if (pts.length === 0) return;

    const next: Geometry = {
      d: buildPath(pts),
      width: cRect.width,
      height: cRect.height,
      nodes: pts,
    };

    setGeometry((prev) =>
      prev.d === next.d && prev.width === next.width && prev.height === next.height
        ? prev
        : next
    );
  }, [track.milestones.length]);

  useLayoutEffect(() => {
    measureBreakpoint();
  }, [measureBreakpoint]);

  /* isNarrow is a dep: when the breakpoint flips, the grid re-renders and
     the nodes need re-measuring against the new columns. */
  useLayoutEffect(() => {
    measure();
  }, [measure, expandedId, isNarrow]);

  useEffect(() => {
    const container = trackRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const onResize = () => {
      measureBreakpoint();
      measure();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [measure, measureBreakpoint]);

  /* ── Derive path length + per-node progress fractions ── */
  useLayoutEffect(() => {
    const path = pathRef.current;
    const measurePath = measureRef.current;
    if (!path || !measurePath || !geometry.d) {
      totalLenRef.current = 0;
      return;
    }

    const total = path.getTotalLength();
    totalLenRef.current = total;

    // Each node is a bezier endpoint, so measuring the partial path
    // up to node i gives its exact position along the full length.
    const fracs: number[] = [];
    const segments = geometry.d.split(' C');
    for (let i = 0; i < geometry.nodes.length; i += 1) {
      if (i === 0) {
        fracs.push(0);
        continue;
      }
      const partial = segments.slice(0, i + 1).join(' C');
      measurePath.setAttribute('d', partial);
      fracs.push(total > 0 ? measurePath.getTotalLength() / total : 0);
    }
    nodeFracsRef.current = fracs;

    if (trailRef.current) {
      trailRef.current.style.strokeDasharray = `${total}`;
      // Written here rather than via a React style prop: every re-render
      // would otherwise reset the trail to undrawn, since the walked
      // offset is only ever written imperatively.
      trailRef.current.style.strokeDashoffset = `${total}`;
    }
  }, [geometry]);

  /* ── The single per-frame writer ── */
  const applyProgress = useCallback(
    (raw: number) => {
      const path = pathRef.current;
      const total = totalLenRef.current;
      if (!path || total <= 0) return;

      const p = Math.min(1, Math.max(0, raw));

      // Walker position along the path.
      const pt = path.getPointAtLength(total * p);
      walkerX.set(pt.x - 18);
      walkerY.set(pt.y - WALKER_HEIGHT + 6);

      // Face the direction of travel.
      if (walkerInnerRef.current) {
        const ahead = path.getPointAtLength(Math.min(total, total * p + 6));
        const behind = path.getPointAtLength(Math.max(0, total * p - 6));
        const facingLeft = ahead.x - behind.x < -0.5;
        walkerInnerRef.current.style.transform = facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
      }

      // Trail draws itself in behind the walker.
      if (trailRef.current) {
        trailRef.current.style.strokeDashoffset = `${total * (1 - p)}`;
      }

      // Active milestone — only fires setState when the index changes.
      const fracs = nodeFracsRef.current;
      let idx = 0;
      for (let i = 0; i < fracs.length; i += 1) {
        if (p >= fracs[i] - 0.02) idx = i;
      }
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }
    },
    [walkerX, walkerY]
  );

  /* ── Stride cadence ──
     The legs cycle only while the walker is actually moving. Driven by a
     debounce rather than useVelocity: velocity never emits a final zero when
     the spring settles, which would leave the legs walking on a still page. */
  const pokeStride = useCallback(() => {
    if (!stridingRef.current) {
      stridingRef.current = true;
      setIsStriding(true);
    }
    if (strideTimerRef.current !== null) window.clearTimeout(strideTimerRef.current);
    strideTimerRef.current = window.setTimeout(() => {
      strideTimerRef.current = null;
      stridingRef.current = false;
      setIsStriding(false);
    }, 140);
  }, []);

  useEffect(
    () => () => {
      if (strideTimerRef.current !== null) window.clearTimeout(strideTimerRef.current);
    },
    []
  );

  useMotionValueEvent(smooth, 'change', (v) => {
    if (prefersReducedMotion) return;
    if (Math.abs(v - lastProgressRef.current) > 0.0004) {
      lastProgressRef.current = v;
      pokeStride();
    }
    applyProgress(v);
  });

  /* ── Initial paint, and the reduced-motion resting state ── */
  useEffect(() => {
    if (totalLenRef.current <= 0) return;

    if (prefersReducedMotion) {
      // Park the walker at the end with the trail fully drawn — no
      // scroll coupling, no stride.
      applyProgress(1);
      activeIndexRef.current = track.milestones.length - 1;
      setActiveIndex(track.milestones.length - 1);
      setIsStriding(false);
    } else {
      applyProgress(smooth.get());
    }
  }, [geometry, prefersReducedMotion, applyProgress, smooth, track.milestones.length]);

  const accent = track.accent;

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Progress readout ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 28,
          padding: '14px 20px',
          background: '#FFFFFF',
          border: `1.5px solid ${accent}33`,
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(34, 37, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flag size={16} color={accent} />
          <span
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 700,
              fontSize: 14.5,
              color: '#22252A',
            }}
          >
            Milestone {activeIndex + 1} of {track.milestones.length}
          </span>
          <span style={{ fontSize: 13.5, color: '#5A6578' }}>
            · {track.milestones[activeIndex]?.title}
          </span>
        </div>
        <span style={{ fontSize: 12.5, color: '#5A6578' }}>
          {prefersReducedMotion
            ? 'Reduced motion — full path shown'
            : 'Scroll to walk the path ↓'}
        </span>
      </div>

      {/* ── The track ── */}
      <div ref={trackRef} style={{ position: 'relative' }}>
        {/* Path overlay — never affects layout */}
        {geometry.d && (
          <svg
            width={geometry.width}
            height={geometry.height}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 1,
            }}
            aria-hidden="true"
          >
            {/* Unwalked path */}
            <path
              ref={pathRef}
              d={geometry.d}
              fill="none"
              stroke="#D9DEE4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="1 9"
            />
            {/* Walked trail — dasharray/dashoffset are set imperatively */}
            <path
              ref={trailRef}
              d={geometry.d}
              fill="none"
              stroke={accent}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Hidden helper used only for partial-length measurement */}
            <path ref={measureRef} d="" fill="none" stroke="none" style={{ visibility: 'hidden' }} />
          </svg>
        )}

        {/* Walker */}
        {geometry.d && (
          <motion.div
            className="roadmap-walker"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              x: walkerX,
              y: walkerY,
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            <div ref={walkerInnerRef}>
              <Stickman
                pose="stand"
                size={WALKER_HEIGHT}
                accent={accent}
                animated={!prefersReducedMotion}
                striding={isStriding}
              />
            </div>
          </motion.div>
        )}

        {/* Milestone rows */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {track.milestones.map((m, i) => {
            const reached = i <= activeIndex;
            const isCurrent = i === activeIndex;
            const cardOnLeft = !isNarrow && i % 2 === 1;
            const expanded = expandedId === m.id;
            const resources = resolveResources(m.resourceIds);
            /* Base Camp milestones have a game behind them; the others do not yet. */
            const game = GAME_BY_MILESTONE[m.id];
            const studied = hydrated && progress.studied.includes(m.id);

            const card = (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
                className="atlas-card"
                style={{
                  padding: 26,
                  background: '#FFFFFF',
                  borderColor: isCurrent ? accent : '#E2E6DF',
                  borderWidth: isCurrent ? 2 : 1,
                  boxShadow: isCurrent
                    ? `0 16px 40px ${accent}26`
                    : '0 4px 16px rgba(34, 37, 42, 0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      background: track.accentSoft,
                      color: track.accentInk,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {m.span}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: '#5A6578',
                    }}
                  >
                    {m.symbol}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: 21,
                    fontWeight: 700,
                    color: '#22252A',
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {m.title}
                </h3>

                <p style={{ color: '#5A6578', fontSize: 14.5, lineHeight: 1.65, marginBottom: 18 }}>
                  {m.summary}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                  {m.topics.map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <CheckCircle2
                        size={15}
                        color={accent}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <span style={{ fontSize: 13.5, color: '#22252A', lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* Exit criterion */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    background: '#FAFAF8',
                    border: '1px solid #E2E6DF',
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <Target size={15} color={track.accentInk} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#5A6578',
                        marginBottom: 3,
                      }}
                    >
                      You&apos;ll know you&apos;re done when
                    </div>
                    <div style={{ fontSize: 13.5, color: '#22252A', lineHeight: 1.55 }}>
                      {m.outcome}
                    </div>
                  </div>
                </div>

                {/* Resource expander */}
                <button
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  aria-expanded={expanded}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: expanded ? track.accentSoft : 'transparent',
                    border: `1.5px solid ${accent}55`,
                    borderRadius: 999,
                    padding: '7px 14px',
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: track.accentInk,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {resources.length} resources
                  <ChevronDown
                    size={14}
                    style={{
                      transform: expanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          paddingTop: 16,
                        }}
                      >
                        {resources.map((r) => {
                          const Icon = KIND_ICON[r.kind];
                          const external = r.url.startsWith('http');
                          return (
                            <a
                              key={r.id}
                              href={r.url}
                              target={external ? '_blank' : undefined}
                              rel={external ? 'noopener noreferrer' : undefined}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 11,
                                padding: '11px 13px',
                                background: '#FAFAF8',
                                border: '1px solid #E2E6DF',
                                borderRadius: 11,
                                textDecoration: 'none',
                              }}
                            >
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: KIND_TINT[r.kind].bg,
                                  flexShrink: 0,
                                }}
                              >
                                <Icon size={14} color={KIND_TINT[r.kind].fg} />
                              </span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: '#22252A',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {r.title}
                                  {r.free && (
                                    <span
                                      style={{
                                        marginLeft: 7,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: '#0081A7',
                                        background: '#E6F4F8',
                                        padding: '2px 6px',
                                        borderRadius: 5,
                                        verticalAlign: 'middle',
                                      }}
                                    >
                                      FREE
                                    </span>
                                  )}
                                </span>
                                {r.author && (
                                  <span
                                    style={{
                                      display: 'block',
                                      fontSize: 12,
                                      color: '#5A6578',
                                      marginTop: 2,
                                    }}
                                  >
                                    {r.author}
                                  </span>
                                )}
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: 12.5,
                                    color: '#5A6578',
                                    lineHeight: 1.5,
                                    marginTop: 4,
                                  }}
                                >
                                  {r.note}
                                </span>
                              </span>
                              {external && (
                                <ExternalLink
                                  size={13}
                                  color="#5A6578"
                                  style={{ flexShrink: 0, marginTop: 3 }}
                                />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Studied toggle, and the game it unlocks ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    flexWrap: 'wrap',
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px dashed #E2E6DF',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => (studied ? unmarkStudied(m.id) : markStudied(m.id))}
                    aria-pressed={studied}
                    disabled={!hydrated}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      background: studied ? '#EBF1ED' : 'transparent',
                      border: `1.5px solid ${studied ? '#9BC1BC' : '#E2E6DF'}`,
                      borderRadius: 999,
                      padding: '7px 14px',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: studied ? '#33564F' : '#5A6578',
                      cursor: hydrated ? 'pointer' : 'default',
                      opacity: hydrated ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {studied ? <Check size={14} color="#4E7A74" /> : <Circle size={13} />}
                    {studied ? 'Studied' : 'Mark studied'}
                  </button>

                  {game &&
                    (studied ? (
                      <Link
                        href="/qubit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          background: '#FDECE9',
                          border: '1.5px solid #ED6A5A',
                          borderRadius: 999,
                          padding: '7px 14px',
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#D95342',
                          textDecoration: 'none',
                        }}
                      >
                        <Gamepad2 size={14} /> Play {game.title} →
                      </Link>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12.5,
                          color: '#8A93A0',
                          lineHeight: 1.4,
                        }}
                      >
                        <Lock size={12} /> {game.title} unlocks once this is marked
                      </span>
                    ))}
                </div>
              </motion.div>
            );

            const nodeMarker = (
              <div
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className={reached && isCurrent && !prefersReducedMotion ? 'roadmap-node-live' : undefined}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: reached ? accent : '#FFFFFF',
                  border: `3px solid ${reached ? accent : '#D9DEE4'}`,
                  color: reached ? '#FFFFFF' : '#5A6578',
                  fontFamily: "'Exo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'background 0.35s ease, border-color 0.35s ease, color 0.35s ease',
                  boxShadow: reached ? `0 0 0 6px ${accent}1F` : 'none',
                }}
              >
                {i + 1}
              </div>
            );

            /* Narrow: node rail on the left, card beside it.
               Wide: card | node | card, alternating sides. */
            return (
              <div
                key={m.id}
                /* /roadmap#b3 lands here — the offset clears the fixed nav. */
                id={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isNarrow ? 'auto 1fr' : '1fr auto 1fr',
                  gap: isNarrow ? 18 : 30,
                  alignItems: 'center',
                  marginBottom: 44,
                  scrollMarginTop: 104,
                }}
              >
                {isNarrow ? (
                  <>
                    {nodeMarker}
                    <div>{card}</div>
                  </>
                ) : (
                  <>
                    <div>{cardOnLeft ? card : null}</div>
                    {nodeMarker}
                    <div>{cardOnLeft ? null : card}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
