'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Compass,
  Cpu,
  Flag,
  Gamepad2,
  Library,
  ListChecks,
  MessageSquare,
  Repeat,
  Rocket,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

import AtlasNav from '../shared/AtlasNav';
import RoadmapBackground from './RoadmapBackground';
import ScrollTrack from './ScrollTrack';
import ResourceLibrary from './ResourceLibrary';
import Stickman from './Stickman';
import { BASE_CAMP_MILESTONES, GAMES } from '../qubit/gameData';
import {
  TRACKS,
  TRACK_BY_ID,
  RESOURCES,
  TOTAL_MILESTONES,
  TOTAL_RESOURCES,
  TOTAL_FREE_RESOURCES,
  type LevelId,
} from './roadmapData';

/* ══════════════════════════════════════════════════════════════
   THE QUANTUM LEARNING ROADMAP
   ══════════════════════════════════════════════════════════════ */

const STUDY_HABITS = [
  {
    icon: Repeat,
    title: 'Space your repetition',
    body: 'Quantum notation decays fast if you only meet it once. Review last week\'s milestone at the start of every session — Quantum Country builds this in for you.',
  },
  {
    icon: Cpu,
    title: 'Never read passively',
    body: 'Every concept has a circuit. Build it in Quirk or Qiskit before you accept that you understand it — prediction first, then run it.',
  },
  {
    icon: ListChecks,
    title: 'Use the exit criteria',
    body: 'Each milestone ends with a "you\'ll know you\'re done when". If you can\'t do that thing unaided, stay put. Moving on early is why people stall at Shor.',
  },
  {
    icon: Users,
    title: 'Learn in public',
    body: 'Write up each milestone, however roughly, and ask questions on QC Stack Exchange or the Qiskit Slack. Explaining is where the gaps surface.',
  },
];

export default function RoadmapPage() {
  const [activeLevel, setActiveLevel] = useState<LevelId>('beginner');
  const track = TRACK_BY_ID[activeLevel];

  const countFor = (level: LevelId) => RESOURCES.filter((r) => r.level === level).length;

  /* /roadmap#b3 — a locked game card on /qubit sends the learner here.
     Read the hash rather than a search param: useSearchParams would force
     a Suspense boundary on what is otherwise a fully static page. The
     beginner track is already selected, so this only has to scroll. */
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!BASE_CAMP_MILESTONES.includes(id)) return;
    setActiveLevel('beginner');
    /* One frame for the track to render its rows, then jump. `instant`
       because html { scroll-behavior: smooth } otherwise swallows this. */
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'center' });
    }, 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        background: '#FAFAF8',
        color: '#22252A',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <RoadmapBackground />

      {/* ══════════════ NAV ══════════════ */}
      <AtlasNav current="roadmap" />

      <div className="atlas-content-layer">
        {/* ══════════════ HERO ══════════════ */}
        <header style={{ padding: '64px 28px 72px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 12px' }}
            >
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#5A6578',
                  textDecoration: 'none',
                  marginBottom: 22,
                }}
              >
                <ArrowLeft size={14} /> Back to the Atlas
              </Link>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 15px',
                  borderRadius: 999,
                  background: '#E6EBE0',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#22252A',
                  marginBottom: 20,
                  border: '1px solid rgba(34, 37, 42, 0.1)',
                  letterSpacing: '0.02em',
                }}
              >
                <Compass size={13} color="#ED6A5A" /> ZERO TO RESEARCH-LEVEL
              </div>

              <h1
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(2.1rem, 4.4vw, 3.5rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  marginBottom: 20,
                }}
              >
                The Quantum <span className="atlas-marker">Learning Roadmap</span>
              </h1>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 'clamp(1.1rem, 1.9vw, 1.45rem)',
                  color: '#3A3F47',
                  lineHeight: 1.55,
                  fontWeight: 300,
                  marginBottom: 18,
                }}
              >
                Nobody needs another list of buzzwords. This is the actual order to learn things
                in — and exactly what to read, watch and run at each step.
              </p>

              <p style={{ fontSize: 15.5, color: '#5A6578', lineHeight: 1.7, maxWidth: 660, margin: '0 auto' }}>
                Three tracks, {TOTAL_MILESTONES} milestones, {TOTAL_RESOURCES} hand-picked
                resources — {TOTAL_FREE_RESOURCES} of them completely free. Every milestone ends
                with a concrete test of whether you actually understood it.
              </p>
            </motion.div>

            {/* ── The three climbers on a rising path ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.25 }}
              style={{ position: 'relative', height: 260, marginTop: 26 }}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 1000 260"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                focusable="false"
              >
                {/* Rising ground line */}
                <path
                  d="M0,232 C160,232 200,190 330,186 C460,182 500,132 630,128 C760,124 800,66 1000,60"
                  fill="none"
                  stroke="#D9DEE4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="1 9"
                />
                <path
                  d="M0,232 C160,232 200,190 330,186 C460,182 500,132 630,128 C760,124 800,66 1000,60"
                  fill="none"
                  stroke="#9BC1BC"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                {/* Summit flag */}
                <line x1="946" y1="62" x2="946" y2="18" stroke="#22252A" strokeWidth="3" strokeLinecap="round" />
                <path d="M946,18 L988,27 L946,36 Z" fill="#ED6A5A" />
              </svg>

              {[
                { level: 'beginner' as LevelId, left: '11%', bottom: 34, pose: 'read' as const },
                { level: 'intermediate' as LevelId, left: '43%', bottom: 88, pose: 'juggle' as const },
                { level: 'pro' as LevelId, left: '75%', bottom: 158, pose: 'teach' as const },
              ].map((c) => {
                const t = TRACK_BY_ID[c.level];
                return (
                  <div
                    key={c.level}
                    style={{
                      position: 'absolute',
                      left: c.left,
                      bottom: c.bottom,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Stickman pose={c.pose} size={92} accent={t.accent} />
                    <span
                      style={{
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: t.accentInk,
                        background: t.accentSoft,
                        padding: '4px 11px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </header>

        {/* ══════════════ LEVEL PICKER ══════════════ */}
        <section
          id="levels"
          className="atlas-sage-panel"
          style={{
            padding: '72px 28px',
            borderTop: '1px solid #D5DDD0',
            borderBottom: '1px solid #D5DDD0',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(1.9rem, 3.2vw, 2.6rem)',
                  fontWeight: 600,
                  marginBottom: 14,
                  letterSpacing: '-0.02em',
                }}
              >
                Where are you <span className="atlas-marker">starting from?</span>
              </h2>
              <p style={{ color: '#5A6578', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
                Pick honestly. Starting one level too high is the single most common reason people
                give up on quantum computing.
              </p>
            </div>

            <div className="roadmap-grid-3">
              {TRACKS.map((t) => {
                const selected = activeLevel === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveLevel(t.id)}
                    aria-pressed={selected}
                    style={{
                      textAlign: 'left',
                      background: selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                      border: selected ? `2.5px solid ${t.accent}` : '1px solid #D5DDD0',
                      borderRadius: 20,
                      padding: 28,
                      cursor: 'pointer',
                      boxShadow: selected ? `0 16px 40px ${t.accent}26` : 'none',
                      transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: selected ? 'translateY(-4px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            color: t.accent,
                            marginBottom: 4,
                          }}
                        >
                          {t.label}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: 25,
                            fontWeight: 700,
                            color: '#22252A',
                            lineHeight: 1.2,
                          }}
                        >
                          {t.subtitle}
                        </div>
                      </div>
                      <Stickman
                        pose={t.mascotPose}
                        size={78}
                        accent={t.accent}
                        animated={selected}
                        style={{ flexShrink: 0 }}
                      />
                    </div>

                    <p
                      style={{
                        fontSize: 14,
                        color: '#5A6578',
                        lineHeight: 1.6,
                        margin: '10px 0 18px',
                        flex: 1,
                      }}
                    >
                      {t.tagline}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        paddingTop: 16,
                        borderTop: '1px solid #E2E6DF',
                      }}
                    >
                      {[
                        t.duration,
                        t.commitment,
                        `${t.milestones.length} milestones`,
                        `${countFor(t.id)} resources`,
                      ].map((chip) => (
                        <span
                          key={chip}
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: t.accentInk,
                            background: t.accentSoft,
                            padding: '5px 10px',
                            borderRadius: 7,
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════ TRACK OVERVIEW ══════════════ */}
        <section style={{ padding: '80px 28px 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <motion.div
              key={`${track.id}-head`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', marginBottom: 40 }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 999,
                  background: track.accentSoft,
                  color: track.accentInk,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                <Flag size={13} /> {track.label} track · {track.duration}
              </div>

              <h2
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)',
                  fontWeight: 600,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                {track.subtitle}
              </h2>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 18,
                  color: '#475569',
                  maxWidth: 660,
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                {track.tagline}
              </p>
            </motion.div>

            {/* Prerequisites vs outcomes */}
            <motion.div
              key={`${track.id}-gates`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="roadmap-grid-2"
              style={{ marginBottom: 20 }}
            >
              <div className="atlas-card" style={{ padding: 28, background: '#FFFFFF' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    marginBottom: 16,
                  }}
                >
                  <BookOpen size={17} color="#5A6578" />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#5A6578',
                    }}
                  >
                    Before you start
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {track.prerequisites.map((p) => (
                    <div key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#9BC1BC',
                          flexShrink: 0,
                          marginTop: 7,
                        }}
                      />
                      <span style={{ fontSize: 14.5, color: '#3A3F47', lineHeight: 1.6 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="atlas-card"
                style={{
                  padding: 28,
                  background: track.accentSoft,
                  borderColor: `${track.accent}44`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                  <Target size={17} color={track.accentInk} />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: track.accentInk,
                    }}
                  >
                    By the end you can
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {track.outcomes.map((o) => (
                    <div key={o} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Sparkles
                        size={14}
                        color={track.accent}
                        style={{ flexShrink: 0, marginTop: 4 }}
                      />
                      <span style={{ fontSize: 14.5, color: '#22252A', lineHeight: 1.6, fontWeight: 500 }}>
                        {o}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════ THE WALKABLE PATH ══════════════ */}
        <section style={{ padding: '20px 28px 90px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            {/* ── Base Camp has games behind it; the other tracks do not yet ── */}
            {activeLevel === 'beginner' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  border: '1px solid #E2E6DF',
                  borderLeft: '4px solid #ED6A5A',
                  borderRadius: 18,
                  padding: '20px 24px',
                  marginBottom: 34,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                  <Stickman pose="juggle" size={78} accent="#ED6A5A" />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.09em',
                        textTransform: 'uppercase',
                        color: '#D95342',
                        marginBottom: 5,
                      }}
                    >
                      <Gamepad2 size={13} /> Qurio Qubit
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: 19,
                        fontWeight: 700,
                        color: '#22252A',
                        marginBottom: 5,
                      }}
                    >
                      {GAMES.length} games unlock as you work through Base Camp
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#5A6578', lineHeight: 1.6, maxWidth: 520 }}>
                      Each milestone below has a stickman game waiting behind it. Read the module,
                      hit <strong>Mark studied</strong>, and its game opens in the arcade — bronze,
                      silver or gold depending on how cleanly you clear it.
                    </p>
                  </div>
                </div>

                <Link href="/qubit" className="btn-atlas-coral" style={{ fontSize: 13.5 }}>
                  Open the arcade <ArrowRight size={14} />
                </Link>
              </motion.div>
            )}

            {/* Remounting per track forces a clean geometry re-measure. */}
            <ScrollTrack key={track.id} track={track} />
          </div>
        </section>

        {/* ══════════════ HOW TO STUDY ══════════════ */}
        <section
          style={{
            padding: '84px 28px',
            background: 'rgba(230, 235, 224, 0.5)',
            borderTop: '1px solid #E2E6DF',
            borderBottom: '1px solid #E2E6DF',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                flexWrap: 'wrap',
                marginBottom: 40,
              }}
            >
              <Stickman pose="point" size={104} accent="#ED6A5A" />
              <div style={{ textAlign: 'center', maxWidth: 560 }}>
                <h2
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                    fontWeight: 600,
                    marginBottom: 12,
                    letterSpacing: '-0.02em',
                  }}
                >
                  How to <span className="atlas-marker">actually finish</span> this
                </h2>
                <p style={{ color: '#5A6578', fontSize: 15.5, lineHeight: 1.65 }}>
                  The roadmap is the easy part. These four habits are what separate the people who
                  reach Shor from the people who bookmark it.
                </p>
              </div>
            </div>

            <div className="roadmap-grid-4">
              {STUDY_HABITS.map((h, i) => {
                const Icon = h.icon;
                return (
                  <motion.div
                    key={h.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    className="atlas-card"
                    style={{ padding: 24, background: '#FFFFFF', height: '100%' }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#FDECE9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={21} color="#ED6A5A" />
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: 17,
                        fontWeight: 700,
                        marginBottom: 9,
                        lineHeight: 1.3,
                      }}
                    >
                      {h.title}
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#5A6578', lineHeight: 1.65 }}>{h.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════ RESOURCE LIBRARY ══════════════ */}
        <section id="resources" style={{ padding: '90px 28px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 14px',
                  borderRadius: 999,
                  background: '#E6EBE0',
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                <Library size={13} color="#ED6A5A" /> THE FULL LIBRARY
              </div>

              <h2
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)',
                  fontWeight: 600,
                  marginBottom: 16,
                  letterSpacing: '-0.02em',
                }}
              >
                Every <span className="atlas-marker">resource</span> you need
              </h2>

              <p
                style={{
                  color: '#5A6578',
                  fontSize: 16,
                  maxWidth: 620,
                  margin: '0 auto',
                  lineHeight: 1.65,
                }}
              >
                Sorted onto seven shelves — books, courses, videos, tools, papers, communities and
                practice. Each shelf shows its best three first; open the ones you need. Filtered
                to the {track.label} track by default.
              </p>
            </div>

            <ResourceLibrary key={track.id} initialLevel={track.id} />
          </div>
        </section>

        {/* ══════════════ CTA ══════════════ */}
        <section
          style={{
            padding: '84px 28px',
            background: '#E6EBE0',
            borderTop: '1px solid #D5DDD0',
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Stickman pose="celebrate" size={124} accent="#ED6A5A" />
            <h2
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 'clamp(1.9rem, 3.3vw, 2.7rem)',
                fontWeight: 600,
                margin: '26px 0 16px',
                letterSpacing: '-0.02em',
              }}
            >
              Start at <span className="atlas-marker">milestone one</span>
            </h2>
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 18,
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: 580,
                marginBottom: 30,
              }}
            >
              You don&apos;t need permission or a physics degree. You need a browser, an afternoon,
              and the willingness to be confused for a week.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/circuit" className="btn-atlas-coral">
                <Cpu size={16} /> Open Circuit Studio
              </Link>
              <Link href="/simulate" className="btn-atlas-ghost">
                <Rocket size={16} color="#ED6A5A" /> 3D Bloch Simulator
              </Link>
              <Link href="/ai-tutor" className="btn-atlas-ghost">
                <MessageSquare size={16} /> Ask the AI Tutor
              </Link>
            </div>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 30,
                fontSize: 14,
                fontWeight: 600,
                color: '#22252A',
                textDecoration: 'underline',
              }}
            >
              <ArrowLeft size={14} /> Back to the Qurio Atlas
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
