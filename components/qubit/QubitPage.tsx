'use client';

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Gamepad2,
  Lock,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';

import AtlasNav from '../shared/AtlasNav';
import RoadmapBackground from '../roadmap/RoadmapBackground';
import Stickman from '../roadmap/Stickman';
import { TRACK_BY_ID } from '../roadmap/roadmapData';

import BadgeWall from './BadgeWall';
import GameShell, { type GameApi } from './GameShell';
import { BADGES, GAMES, type GameSpec } from './gameData';
import {
  TIER_META,
  clearedCount,
  useProgress,
  xpFor,
  type GameId,
} from './progressStore';

import BalanceBeam from './games/BalanceBeam';
import CollapseCatcher from './games/CollapseCatcher';
import GateHopscotch from './games/GateHopscotch';
import TwinSync from './games/TwinSync';
import ShotNoise from './games/ShotNoise';
import RelayStation from './games/RelayStation';

/* ══════════════════════════════════════════════════════════════
   QURIO QUBIT — the Base Camp arcade.

   One game per Base Camp module, each locked until that module is
   marked studied on /roadmap. The lock is hard, as asked, so a
   locked card works twice as hard to be useful: it still names the
   game, lists what it teaches, and deep-links to the module.

   Everything progress-derived is gated on `hydrated`, because this
   page is statically prerendered and localStorage only exists in
   the browser. See progressStore.ts.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

const GAME_COMPONENTS: Record<GameId, (props: { api: GameApi }) => ReactElement> = {
  'g-beam': BalanceBeam,
  'g-collapse': CollapseCatcher,
  'g-hopscotch': GateHopscotch,
  'g-twins': TwinSync,
  'g-noise': ShotNoise,
  'g-relay': RelayStation,
};

const BEGINNER = TRACK_BY_ID.beginner;
const MILESTONE_TITLE: Record<string, string> = BEGINNER.milestones.reduce(
  (acc, m) => ({ ...acc, [m.id]: m.title }),
  {}
);

/* The CSS half of reduced motion lives in the qubit block in
   globals.css, but the games lean on framer-motion just as heavily.
   "user" keeps the opacity fades and drops the movement, and because
   it sits above the portal it reaches every motion component here —
   including the six games rendered inside the modal. */
export default function QubitPage() {
  return (
    <MotionConfig reducedMotion="user">
      <QubitPortal />
    </MotionConfig>
  );
}

function QubitPortal() {
  const { progress, hydrated } = useProgress();
  const [openId, setOpenId] = useState<GameId | null>(null);

  const unlocked = useCallback(
    (g: GameSpec) => hydrated && progress.studied.includes(g.milestoneId),
    [hydrated, progress.studied]
  );

  /* Lock the page behind the modal so the arcade does not scroll underneath. */
  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  const open = openId ? GAMES.find((g) => g.id === openId) ?? null : null;
  const OpenGame = open ? GAME_COMPONENTS[open.id] : null;

  /* The next unlocked game after this one, offered on the result screen. */
  const nextFor = (g: GameSpec) => {
    const after = GAMES.slice(GAMES.indexOf(g) + 1).find((c) => unlocked(c));
    if (!after) return undefined;
    return { title: after.title, go: () => setOpenId(after.id) };
  };

  const cleared = hydrated ? clearedCount(progress) : 0;
  const badges = hydrated ? Object.keys(progress.badges).length : 0;
  const xp = hydrated ? xpFor(progress) : 0;
  const studied = hydrated ? GAMES.filter((g) => progress.studied.includes(g.milestoneId)).length : 0;

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
      <AtlasNav current="qubit" />

      <div className="atlas-content-layer">
        {/* ══════════════ HERO ══════════════ */}
        <header style={{ padding: '60px 28px 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto' }}
            >
              <Link
                href="/roadmap"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#5A6578',
                  textDecoration: 'none',
                  marginBottom: 20,
                }}
              >
                <ArrowLeft size={14} /> Back to the roadmap
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
                <Gamepad2 size={13} color="#ED6A5A" /> BASE CAMP ARCADE
              </div>

              <h1
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(2.1rem, 4.4vw, 3.4rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  marginBottom: 18,
                }}
              >
                Qurio <span className="atlas-marker">Qubit</span>
              </h1>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)',
                  color: '#3A3F47',
                  lineHeight: 1.55,
                  fontWeight: 300,
                  marginBottom: 16,
                }}
              >
                Six games, one for each Base Camp module. Reading a module tells you the idea; playing
                its game tells you whether you actually have it.
              </p>

              <p style={{ fontSize: 15, color: '#5A6578', lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
                Every game unlocks the moment you mark its module studied on the roadmap. Clear one for
                bronze, sweep it for gold, and a stickman climbs the mountain on your{' '}
                <Link href="/profile" style={{ color: '#ED6A5A', fontWeight: 600 }}>
                  progress page
                </Link>
                .
              </p>
            </motion.div>

            {/* ── The mascot and the scoreboard ── */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 26,
                flexWrap: 'wrap',
                marginTop: 34,
              }}
            >
              <Stickman pose="juggle" size={128} accent="#ED6A5A" label="The Qurio Qubit mascot juggling" />

              <div
                className="atlas-card"
                style={{
                  background: '#FFFFFF',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
                  gap: 22,
                  minWidth: 300,
                }}
              >
                <Stat icon={Play} label="unlocked" value={`${studied} / 6`} tone="#0081A7" />
                <Stat icon={Trophy} label="cleared" value={`${cleared} / 6`} tone="#D9A521" />
                <Stat icon={Award} label="badges" value={`${badges} / ${BADGES.length}`} tone="#9A710B" />
                <Stat icon={Zap} label="XP" value={xp.toLocaleString()} tone="#ED6A5A" />
              </div>
            </motion.div>
          </div>
        </header>

        {/* ══════════════ THE ARCADE ══════════════ */}
        <section
          className="atlas-sage-panel"
          style={{
            padding: '64px 28px 76px',
            borderTop: '1px solid #D5DDD0',
            borderBottom: '1px solid #D5DDD0',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)',
                  fontWeight: 600,
                  marginBottom: 14,
                  letterSpacing: '-0.02em',
                }}
              >
                Six games, <span className="atlas-marker">six modules</span>
              </h2>
              <p style={{ color: '#5A6578', fontSize: 15.5, maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
                {hydrated && studied === 0
                  ? 'Nothing is unlocked yet — study Base Camp module 1 on the roadmap and the first game opens.'
                  : 'Study a module, then come back and prove it. Replays keep your best result.'}
              </p>
            </div>

            <div className="roadmap-grid-3">
              {GAMES.map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={i}
                  unlocked={unlocked(game)}
                  hydrated={hydrated}
                  record={hydrated ? progress.games[game.id] : undefined}
                  onPlay={() => setOpenId(game.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════ BADGE WALL ══════════════ */}
        <section style={{ padding: '80px 28px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <BadgeWall progress={progress} hydrated={hydrated} />
          </div>
        </section>

        {/* ══════════════ CTA ══════════════ */}
        <section style={{ padding: '76px 28px', background: '#E6EBE0', borderTop: '1px solid #D5DDD0' }}>
          <div
            style={{
              maxWidth: 880,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Stickman pose="climb" size={118} accent="#ED6A5A" />
            <h2
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)',
                fontWeight: 600,
                margin: '24px 0 14px',
                letterSpacing: '-0.02em',
              }}
            >
              Study first, <span className="atlas-marker">play second</span>
            </h2>
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 17.5,
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: 560,
                marginBottom: 28,
              }}
            >
              The games assume you have read the module. That is the point — they are a test you set
              yourself, not a tutorial with the answers written on it.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/roadmap" className="btn-atlas-coral">
                <BookOpen size={16} /> Open the roadmap
              </Link>
              <Link href="/profile" className="btn-atlas-ghost">
                <Sparkles size={16} color="#ED6A5A" /> See my climb
              </Link>
            </div>
            <p style={{ fontSize: 12.5, color: '#5A6578', marginTop: 24, maxWidth: 420, lineHeight: 1.6 }}>
              Progress is saved in this browser only. There is no account and nothing leaves your
              device.
            </p>
          </div>
        </section>
      </div>

      {/* ══════════════ THE GAME, FULL SCREEN ══════════════ */}
      <AnimatePresence>
        {open && OpenGame && (
          <motion.div
            key="game-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpenId(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(34, 37, 42, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '28px 16px',
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.32, ease: EASE }}
              style={{
                width: '100%',
                maxWidth: 760,
                background: '#FAFAF8',
                borderRadius: 22,
                border: '1px solid #E2E6DF',
                boxShadow: '0 30px 80px rgba(34, 37, 42, 0.28)',
                padding: '22px 22px 26px',
              }}
            >
              {/* Remounting per game guarantees a clean shell — no score carry-over. */}
              <GameShell key={open.id} game={open} onExit={() => setOpenId(null)} next={nextFor(open)}>
                {(api) => <OpenGame api={api} />}
              </GameShell>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   One game card. Locked cards are dimmed but never mute — they
   still teach what the game is about and where to go to open it.
   ══════════════════════════════════════════════════════════════ */

function GameCard({
  game,
  index,
  unlocked,
  hydrated,
  record,
  onPlay,
}: {
  game: GameSpec;
  index: number;
  unlocked: boolean;
  hydrated: boolean;
  record?: { best: number; max: number; plays: number; tier: 'bronze' | 'silver' | 'gold' | null };
  onPlay: () => void;
}) {
  const tier = record?.tier ?? null;
  const meta = tier ? TIER_META[tier] : null;

  return (
    <motion.div
      className={`qubit-card ${unlocked ? 'qubit-card-open' : 'qubit-card-locked'}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06, ease: EASE }}
      aria-disabled={!unlocked}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: `1px solid ${unlocked ? `${game.accent}55` : '#E2E6DF'}`,
        borderRadius: 20,
        padding: 26,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Corner ribbon with the module number */}
      <span className="qubit-order" style={{ background: game.accentSoft, color: game.accent }}>
        {game.order}
      </span>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: game.accentSoft,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <game.icon size={22} color={game.accent} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: game.accent,
              marginBottom: 3,
            }}
          >
            {game.kicker}
          </div>
          <h3
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 21,
              fontWeight: 700,
              color: '#22252A',
              lineHeight: 1.22,
            }}
          >
            {game.title}
          </h3>
        </div>
        <Stickman
          pose={game.pose}
          size={62}
          accent={game.accent}
          style={{ flexShrink: 0, marginTop: -6 }}
        />
      </div>

      <p style={{ fontSize: 13.5, color: '#5A6578', lineHeight: 1.65, marginBottom: 16 }}>
        {game.blurb}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
        {game.teaches.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#3A3F47',
              background: '#EBF1ED',
              borderRadius: 7,
              padding: '4px 9px',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Best result, once there is one */}
      {tier && meta && (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 8,
            background: meta.fill,
            border: `1.5px solid ${meta.ring}`,
            borderRadius: 999,
            padding: '4px 12px',
            marginBottom: 14,
          }}
        >
          <Trophy size={13} color={meta.ring} />
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.ink }}>
            {meta.label} · {record!.best}/{record!.max}
          </span>
          <span style={{ fontSize: 11, color: '#5A6578' }}>
            {record!.plays} play{record!.plays === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 4 }}>
        {unlocked ? (
          <button
            type="button"
            onClick={onPlay}
            className="btn-atlas-coral"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}
          >
            <Play size={14} /> {tier ? 'Play again' : `Play · ${game.rounds} rounds`}
          </button>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                color: '#8A93A0',
                marginBottom: 10,
              }}
            >
              <Lock className="qubit-lock" size={14} />
              {hydrated
                ? `Locked — module ${game.order} is not marked studied`
                : 'Checking your progress…'}
            </div>
            <Link
              href={`/roadmap#${game.milestoneId}`}
              className="btn-atlas-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 13.5 }}
            >
              <BookOpen size={14} /> Study module {game.order} first <ArrowRight size={13} />
            </Link>
            <p style={{ fontSize: 11.5, color: '#8A93A0', marginTop: 8, lineHeight: 1.5 }}>
              {MILESTONE_TITLE[game.milestoneId] ?? 'Base Camp'}
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Play;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Icon size={15} color={tone} style={{ marginBottom: 5 }} />
      <div
        style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: 21,
          fontWeight: 700,
          color: '#22252A',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#5A6578',
          marginTop: 3,
        }}
      >
        {label}
      </div>
    </div>
  );
}
