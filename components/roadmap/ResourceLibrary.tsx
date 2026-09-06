'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ArrowUpRight, ChevronDown, Library, SlidersHorizontal } from 'lucide-react';

import Stickman, { type StickmanPose } from './Stickman';
import {
  RESOURCES,
  KIND_LABELS,
  LEVEL_LABELS,
  LEVEL_ACCENTS,
  TOTAL_FREE_RESOURCES,
  type LevelId,
  type Resource,
  type ResourceKind,
} from './roadmapData';
import { KIND_ICON, KIND_TINT, KIND_SINGULAR } from './resourceMeta';

/* ══════════════════════════════════════════════════════════════
   RESOURCE LIBRARY
   72 resources is too many to dump in one wall of cards, so they
   live on shelves — one per kind, each showing a short peek that
   expands on demand. A stickman librarian reacts to the filter.

   Motion is CSS-driven for hover (see the .roadmap-shelf /
   .roadmap-res-card rules in globals.css) and framer-motion for
   enter/exit, so nothing animates layout properties per frame.
   ══════════════════════════════════════════════════════════════ */

const KIND_ORDER: ResourceKind[] = [
  'book',
  'course',
  'video',
  'tool',
  'paper',
  'community',
  'practice',
];

const LEVEL_ORDER: LevelId[] = ['beginner', 'intermediate', 'pro'];

/** How many cards a shelf shows before you ask for the rest. */
const PEEK = 3;

/** One line per shelf, so the grouping reads as curation not just a filter. */
const KIND_BLURB: Record<ResourceKind, string> = {
  book: 'The long-form backbone. Pick one per level and finish it.',
  course: 'Structured, graded, with someone else setting the pace.',
  video: 'For the concepts that only click once you watch someone draw them.',
  tool: 'Install these. Reading about circuits is not the same as running them.',
  paper: 'The primary sources. Skim early, return once the machinery makes sense.',
  community: 'Where your stuck questions get answered by people who were stuck too.',
  practice: 'Problems and builds. This is the part that actually moves the needle.',
};

/** The librarian mimes whatever you are browsing. */
const KIND_POSE: Record<ResourceKind, StickmanPose> = {
  book: 'read',
  course: 'teach',
  video: 'point',
  tool: 'juggle',
  paper: 'think',
  community: 'wave',
  practice: 'climb',
};

export interface ResourceLibraryProps {
  /** Pre-selects a level; the user can widen it to all levels. */
  initialLevel?: LevelId | 'all';
}

export default function ResourceLibrary({ initialLevel = 'all' }: ResourceLibraryProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ResourceKind | 'all'>('all');
  const [level, setLevel] = useState<LevelId | 'all'>(initialLevel);
  const [freeOnly, setFreeOnly] = useState(false);
  const [openShelves, setOpenShelves] = useState<ResourceKind[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (kind !== 'all' && r.kind !== kind) return false;
      if (level !== 'all' && r.level !== level) return false;
      if (freeOnly && !r.free) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.author ?? '').toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, kind, level, freeOnly]);

  /* Group into shelves, preserving KIND_ORDER and dropping empties. */
  const shelves = useMemo(() => {
    const byKind = new Map<ResourceKind, Resource[]>();
    for (const r of filtered) {
      const list = byKind.get(r.kind);
      if (list) list.push(r);
      else byKind.set(r.kind, [r]);
    }
    return KIND_ORDER.filter((k) => byKind.has(k)).map((k) => ({
      kind: k,
      items: byKind.get(k) as Resource[],
    }));
  }, [filtered]);

  /* A single kind selected, or an active search, means the user has
     already narrowed things — show everything rather than a peek. */
  const searching = query.trim().length > 0;
  const forceOpen = kind !== 'all' || searching;

  const isOpen = (k: ResourceKind) => forceOpen || openShelves.includes(k);
  const toggleShelf = (k: ResourceKind) =>
    setOpenShelves((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const resetAll = () => {
    setQuery('');
    setKind('all');
    setLevel('all');
    setFreeOnly(false);
    setOpenShelves([]);
  };

  /* The librarian tracks the active kind; falls back to browsing. */
  const guidePose: StickmanPose = kind === 'all' ? 'read' : KIND_POSE[kind];
  const guideAccent = kind === 'all' ? '#ED6A5A' : KIND_TINT[kind].fg;

  const pill = (active: boolean, accent = '#ED6A5A'): CSSProperties => ({
    padding: '7px 15px',
    borderRadius: 999,
    border: `1.5px solid ${active ? accent : 'rgba(34, 37, 42, 0.14)'}`,
    background: active ? accent : '#FFFFFF',
    color: active ? '#FFFFFF' : '#3A3F47',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: active ? `0 5px 16px ${accent}3D` : 'none',
  });

  return (
    <div>
      {/* ══════ CONTROL BAR ══════ */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid #E2E6DF',
          borderRadius: 22,
          padding: '20px 22px',
          marginBottom: 30,
          boxShadow: '0 6px 24px rgba(34, 37, 42, 0.045)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* ── The librarian + search ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
            aria-hidden="true"
          >
            {/* Re-keying on pose restarts the entry animation, so the
                figure visibly "changes job" when you switch filters. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={guidePose}
                initial={{ opacity: 0, y: 10, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.92 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', justifyContent: 'center', height: 84 }}
              >
                <Stickman pose={guidePose} size={84} accent={guideAccent} />
              </motion.div>
            </AnimatePresence>
            <div className="roadmap-guide-shadow" />
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#FFFFFF',
                border: '1.5px solid #E2E6DF',
                borderRadius: 999,
                padding: '12px 20px',
              }}
            >
              <Search size={17} color="#5A6578" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${RESOURCES.length} resources — try “QEC”, “Nielsen”, “free”…`}
                aria-label="Search resources"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 14.5,
                  fontFamily: "'Inter', sans-serif",
                  color: '#22252A',
                  background: 'transparent',
                  minWidth: 0,
                }}
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={15} color="#5A6578" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 11,
                fontSize: 12.5,
                color: '#5A6578',
              }}
            >
              <SlidersHorizontal size={12.5} />
              <span>
                <motion.strong
                  key={filtered.length}
                  initial={{ opacity: 0.4, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: '#22252A', display: 'inline-block' }}
                >
                  {filtered.length}
                </motion.strong>{' '}
                of {RESOURCES.length} resources across {shelves.length}{' '}
                {shelves.length === 1 ? 'shelf' : 'shelves'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Kind filters ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <button className="roadmap-pill" onClick={() => setKind('all')} style={pill(kind === 'all')}>
            Everything
          </button>
          {KIND_ORDER.map((k) => {
            const Icon = KIND_ICON[k];
            const active = kind === k;
            const n = RESOURCES.filter(
              (r) =>
                r.kind === k &&
                (level === 'all' || r.level === level) &&
                (!freeOnly || r.free)
            ).length;
            return (
              <button
                key={k}
                className="roadmap-pill"
                onClick={() => setKind(active ? 'all' : k)}
                aria-pressed={active}
                style={{
                  ...pill(active, KIND_TINT[k].fg),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: n === 0 ? 0.42 : 1,
                }}
              >
                <Icon size={13} />
                {KIND_LABELS[k]}
                <span style={{ opacity: 0.75, fontWeight: 600 }}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* ── Level + free filters ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            className="roadmap-pill"
            onClick={() => setLevel('all')}
            style={pill(level === 'all', '#22252A')}
          >
            All levels
          </button>
          {LEVEL_ORDER.map((l) => (
            <button
              key={l}
              className="roadmap-pill"
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              style={pill(level === l, LEVEL_ACCENTS[l].accent)}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}

          <span
            style={{ width: 1, height: 22, background: 'rgba(34, 37, 42, 0.14)', margin: '0 6px' }}
          />

          <button
            className="roadmap-pill"
            onClick={() => setFreeOnly((v) => !v)}
            aria-pressed={freeOnly}
            style={pill(freeOnly, '#0081A7')}
          >
            {freeOnly ? '✓ ' : ''}Free only ({TOTAL_FREE_RESOURCES})
          </button>

          <AnimatePresence>
            {(freeOnly || searching || kind !== 'all' || level !== 'all') && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                onClick={resetAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#5A6578',
                  textDecoration: 'underline',
                  padding: '6px 4px',
                }}
              >
                Reset
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════ SHELVES ══════ */}
      {shelves.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {shelves.map(({ kind: k, items }, shelfIndex) => {
            const Icon = KIND_ICON[k];
            const tint = KIND_TINT[k];
            const open = isOpen(k);
            const shown = open ? items : items.slice(0, PEEK);
            const hidden = items.length - shown.length;
            const freeCount = items.filter((r) => r.free).length;

            return (
              <motion.section
                key={k}
                className="roadmap-shelf"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.45, delay: Math.min(shelfIndex, 4) * 0.06 }}
                aria-label={KIND_LABELS[k]}
              >
                {/* ── Shelf header ── */}
                <button
                  className="roadmap-shelf-head"
                  onClick={() => toggleShelf(k)}
                  aria-expanded={open}
                  disabled={forceOpen}
                  style={{ cursor: forceOpen ? 'default' : 'pointer' }}
                >
                  <span className="roadmap-shelf-icon" style={{ background: tint.bg }}>
                    <Icon size={20} color={tint.fg} />
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        flexWrap: 'wrap',
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: 19,
                          fontWeight: 700,
                          color: '#22252A',
                        }}
                      >
                        {KIND_LABELS[k]}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: tint.fg,
                          background: tint.bg,
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {items.length}
                      </span>
                      {freeCount > 0 && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: '#0081A7',
                            background: '#E6F4F8',
                            padding: '3px 7px',
                            borderRadius: 5,
                          }}
                        >
                          {freeCount} FREE
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13,
                        color: '#5A6578',
                        lineHeight: 1.5,
                      }}
                    >
                      {KIND_BLURB[k]}
                    </span>
                  </span>

                  {!forceOpen && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        flexShrink: 0,
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: tint.fg,
                      }}
                    >
                      {open ? 'Collapse' : `All ${items.length}`}
                      <ChevronDown
                        size={14}
                        style={{
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </span>
                  )}
                </button>

                <div className="roadmap-shelf-rule" />

                {/* ── Cards ── */}
                <div className="roadmap-grid-auto" style={{ marginTop: 18 }}>
                  <AnimatePresence initial={false}>
                    {shown.map((r, i) => {
                      const rTint = KIND_TINT[r.kind];
                      const external = r.url.startsWith('http');
                      const levelAccent = LEVEL_ACCENTS[r.level];

                      const inner = (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              marginBottom: 13,
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 10.5,
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: rTint.fg,
                              }}
                            >
                              {KIND_SINGULAR[r.kind]}
                            </span>

                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {r.free && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: '#0081A7',
                                    background: '#E6F4F8',
                                    padding: '3px 7px',
                                    borderRadius: 5,
                                  }}
                                >
                                  FREE
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: levelAccent.accent,
                                  background: levelAccent.soft,
                                  padding: '3px 7px',
                                  borderRadius: 5,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {LEVEL_LABELS[r.level]}
                              </span>
                            </span>
                          </div>

                          <h4
                            style={{
                              fontFamily: "'Exo 2', sans-serif",
                              fontSize: 16.5,
                              fontWeight: 700,
                              color: '#22252A',
                              lineHeight: 1.35,
                              marginBottom: r.author ? 4 : 10,
                            }}
                          >
                            {r.title}
                          </h4>

                          {r.author && (
                            <div style={{ fontSize: 12.5, color: '#5A6578', marginBottom: 10 }}>
                              {r.author}
                            </div>
                          )}

                          <p
                            style={{
                              fontSize: 13.5,
                              color: '#5A6578',
                              lineHeight: 1.6,
                              marginBottom: 16,
                              flex: 1,
                            }}
                          >
                            {r.note}
                          </p>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontFamily: "'Exo 2', sans-serif",
                              fontSize: 13,
                              fontWeight: 700,
                              color: rTint.fg,
                            }}
                          >
                            {external ? 'Open resource' : 'Open in Qurio'}
                            <ArrowUpRight size={14} className="roadmap-res-go" />
                          </span>
                        </>
                      );

                      const cardStyle: CSSProperties = {
                        padding: 22,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        textDecoration: 'none',
                        background: '#FFFFFF',
                        // Drives the card's top hairline (see globals.css).
                        ['--roadmap-card-accent' as string]: rTint.fg,
                      };

                      return (
                        <motion.div
                          key={r.id}
                          layout="position"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{
                            duration: 0.34,
                            delay: Math.min(i, 6) * 0.035,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ height: '100%' }}
                        >
                          {external ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="atlas-card roadmap-res-card"
                              style={cardStyle}
                            >
                              {inner}
                            </a>
                          ) : (
                            <Link
                              href={r.url}
                              className="atlas-card roadmap-res-card"
                              style={cardStyle}
                            >
                              {inner}
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* ── Expand affordance ── */}
                {hidden > 0 && (
                  <button
                    onClick={() => toggleShelf(k)}
                    className="roadmap-pill"
                    style={{
                      marginTop: 16,
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: 12,
                      border: `1.5px dashed ${tint.fg}55`,
                      background: 'transparent',
                      color: tint.fg,
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    Show {hidden} more {hidden === 1 ? KIND_SINGULAR[k].toLowerCase() : KIND_LABELS[k].toLowerCase()}
                    <ChevronDown size={14} />
                  </button>
                )}
              </motion.section>
            );
          })}
        </div>
      ) : (
        /* ══════ EMPTY STATE ══════ */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '56px 24px',
            background: '#FFFFFF',
            border: '1px dashed #D9DEE4',
            borderRadius: 18,
          }}
        >
          <Stickman pose="think" size={104} accent="#ED6A5A" />
          <div
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#22252A',
            }}
          >
            Nothing matches that yet
          </div>
          <p style={{ fontSize: 14, color: '#5A6578', textAlign: 'center', maxWidth: 380 }}>
            Try a broader search, or clear the filters to see all {RESOURCES.length} resources.
          </p>
          <button onClick={resetAll} className="btn-atlas-coral" style={{ fontSize: 14 }}>
            <Library size={15} /> Reset filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
