'use client';

import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Check,
  Lightbulb,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { BADGE_BY_ID, type GameSpec } from './gameData';
import { TIER_META, recordResult, tierFor, type Tier } from './progressStore';

/* ══════════════════════════════════════════════════════════════
   GAME SHELL — the chrome every Base Camp game wears.

   Owns rounds, score, hints, restart and the result screen, so a
   game component only has to render the round in front of it and
   call api.resolveRound(points). "Next round" and "See results"
   live here too, which is why all six games feel like one thing.
   ══════════════════════════════════════════════════════════════ */

export interface GameApi {
  /** 0-based index of the round on screen. */
  round: number;
  score: number;
  /** True once this round has been answered — the game should lock input. */
  resolved: boolean;
  hintShown: boolean;
  hintsUsed: number;
  /** Bumped by Restart; games watch it to clear their own local state. */
  attempt: number;
  /** Award this round's points, optionally raising achievement flags. */
  resolveRound: (points: number, flags?: string[]) => void;
  raiseFlag: (flag: string) => void;
}

interface GameShellProps {
  game: GameSpec;
  onExit: () => void;
  /** Offered on the result screen when the next game is already unlocked. */
  next?: { title: string; go: () => void };
  children: (api: GameApi) => ReactNode;
}

interface Outcome {
  score: number;
  tier: Tier | null;
  newBadges: string[];
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function GameShell({ game, onExit, next, children }: GameShellProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const resolveRound = useCallback((points: number, roundFlags?: string[]) => {
    setScore((s) => s + points);
    if (roundFlags?.length) setFlags((f) => [...f, ...roundFlags]);
    setResolved(true);
  }, []);

  const raiseFlag = useCallback((flag: string) => {
    setFlags((f) => (f.includes(flag) ? f : [...f, flag]));
  }, []);

  const advance = useCallback(() => {
    if (round + 1 < game.rounds) {
      setRound((r) => r + 1);
      setResolved(false);
      setHintShown(false);
      return;
    }
    /* Last round — file the run and show the result. The score is
       already final in state, so the award never depends on a frame. */
    const tier = tierFor(score, game.maxScore);
    const newBadges = recordResult(game.id, {
      score,
      max: game.maxScore,
      hintsUsed,
      flags,
    });
    setOutcome({ score, tier, newBadges });
  }, [round, game, score, hintsUsed, flags]);

  const restart = useCallback(() => {
    setRound(0);
    setScore(0);
    setResolved(false);
    setHintShown(false);
    setHintsUsed(0);
    setFlags([]);
    setOutcome(null);
    setAttempt((a) => a + 1);
  }, []);

  const api = useMemo<GameApi>(
    () => ({ round, score, resolved, hintShown, hintsUsed, attempt, resolveRound, raiseFlag }),
    [round, score, resolved, hintShown, hintsUsed, attempt, resolveRound, raiseFlag]
  );

  const lastRound = round + 1 >= game.rounds;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ══════════════ HEADER ══════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
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
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: game.accent,
                marginBottom: 2,
              }}
            >
              Module {game.order} · {game.kicker}
            </div>
            <h3
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#22252A',
              }}
            >
              {game.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          aria-label="Close game"
          style={{
            border: '1px solid #E2E6DF',
            background: '#FFFFFF',
            borderRadius: 10,
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: '#5A6578',
            flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ══════════════ ROUND PIPS + SCORE ══════════════ */}
      {!outcome && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {Array.from({ length: game.rounds }, (_, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  width: i === round ? 24 : 9,
                  height: 9,
                  borderRadius: 999,
                  background: i < round ? game.accent : i === round ? game.accent : '#E2E6DF',
                  opacity: i < round ? 0.45 : 1,
                  transition: `all 0.35s cubic-bezier(${EASE.join(',')})`,
                }}
              />
            ))}
            <span style={{ fontSize: 13, color: '#5A6578', marginLeft: 8 }}>
              Round {round + 1} of {game.rounds}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 700,
                color: '#22252A',
                background: '#EBF1ED',
                border: '1px solid #E2E6DF',
                borderRadius: 8,
                padding: '5px 10px',
              }}
            >
              {score} / {game.maxScore}
            </span>
            <button
              type="button"
              onClick={restart}
              className="btn-atlas-ghost"
              style={{ padding: '7px 14px', fontSize: 13 }}
            >
              <RotateCcw size={13} /> Restart
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ THE GAME, OR THE RESULT ══════════════ */}
      <AnimatePresence mode="wait">
        {outcome ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ResultScreen
              game={game}
              outcome={outcome}
              onReplay={restart}
              onExit={onExit}
              next={next}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`round-${round}-${attempt}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {children(api)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ HINT + ADVANCE ══════════════ */}
      {!outcome && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (hintShown) return;
              setHintShown(true);
              setHintsUsed((h) => h + 1);
            }}
            disabled={hintShown}
            className="btn-atlas-ghost"
            style={{
              padding: '9px 16px',
              fontSize: 13,
              opacity: hintShown ? 0.45 : 1,
              cursor: hintShown ? 'default' : 'pointer',
            }}
          >
            <Lightbulb size={14} /> {hintShown ? 'Hint shown' : 'Need a hint?'}
          </button>

          {resolved && (
            <motion.button
              type="button"
              onClick={advance}
              className="btn-atlas-coral"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ padding: '10px 22px', fontSize: 14 }}
            >
              {lastRound ? 'See your result' : 'Next round'} <ArrowRight size={14} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HINT PANEL — games render this themselves when api.hintShown is
   true, since only the game knows what the current round's hint is.
   The shell owns the button and the count that gates the Unaided
   badge; this owns the look.
   ══════════════════════════════════════════════════════════════ */

export function HintPanel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        display: 'flex',
        gap: 10,
        background: '#FEF3C7',
        border: '1px solid #F5DFA0',
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <Lightbulb size={16} color="#9A710B" style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B4E07' }}>{children}</p>
    </motion.div>
  );
}

/* ── Shared game furniture ───────────────────────────────────── */

/** The graph-paper workbench every game plays on. */
export function Stage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="qubit-stage" style={{ padding: '22px 20px', ...style }}>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/** The question above the stage. */
export function Prompt({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: 17,
        fontWeight: 600,
        lineHeight: 1.55,
        color: '#22252A',
      }}
    >
      {children}
    </p>
  );
}

/** Right / wrong, with the explanation that makes the round worth playing. */
export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        display: 'flex',
        gap: 10,
        background: ok ? '#EBF1ED' : '#FDECE9',
        border: `1px solid ${ok ? '#9BC1BC' : '#F3C0B8'}`,
        borderRadius: 12,
        padding: '13px 15px',
      }}
    >
      {ok ? (
        <Check size={17} color="#4E7A74" style={{ flexShrink: 0, marginTop: 2 }} />
      ) : (
        <X size={17} color="#D95342" style={{ flexShrink: 0, marginTop: 2 }} />
      )}
      <div style={{ fontSize: 14, lineHeight: 1.65, color: ok ? '#33564F' : '#8C3527' }}>{children}</div>
    </motion.div>
  );
}

/** Monospace ket / amplitude text, matching the roadmap's symbol style. */
export function Ket({ children, size = 16, color = '#22252A' }: { children: ReactNode; size?: number; color?: string }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: size,
        fontWeight: 700,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   RESULT SCREEN
   ══════════════════════════════════════════════════════════════ */

function ResultScreen({
  game,
  outcome,
  onReplay,
  onExit,
  next,
}: {
  game: GameSpec;
  outcome: Outcome;
  onReplay: () => void;
  onExit: () => void;
  next?: { title: string; go: () => void };
}) {
  const { score, tier, newBadges } = outcome;
  const meta = tier ? TIER_META[tier] : null;
  const pct = Math.round((score / game.maxScore) * 100);

  return (
    <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <Stickman
          pose={tier ? 'celebrate' : 'think'}
          size={104}
          accent={tier ? meta!.ring : game.accent}
          label={tier ? 'Your stickman celebrates' : 'Your stickman thinks it over'}
        />
      </div>

      {tier ? (
        <>
          <motion.div
            className="qubit-shine"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              borderRadius: 999,
              background: meta!.fill,
              border: `2px solid ${meta!.ring}`,
              marginBottom: 14,
            }}
          >
            <Trophy size={18} color={meta!.ring} />
            <span
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: meta!.ink,
              }}
            >
              {meta!.label} — {game.title}
            </span>
          </motion.div>
          <h4
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#22252A',
              marginBottom: 8,
            }}
          >
            {score} / {game.maxScore} · {pct}%
          </h4>
          <p style={{ color: '#5A6578', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>
            {tier === 'gold'
              ? 'A clean sweep. Nothing left to squeeze out of this one.'
              : tier === 'silver'
                ? 'Solidly clear. One more run and gold is yours.'
                : 'Cleared. Replay it once the ideas have settled and you should climb a tier.'}
          </p>
        </>
      ) : (
        <>
          <h4
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#22252A',
              marginBottom: 8,
            }}
          >
            {score} / {game.maxScore}
          </h4>
          <p style={{ color: '#5A6578', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>
            Half marks earns bronze, so this one is not banked yet. Nothing is lost — reread module{' '}
            {game.order} and run it again.
          </p>
        </>
      )}

      {newBadges.length > 0 && (
        <div
          style={{
            background: '#FDF6E3',
            border: '1px solid #F0E2BC',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 20,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9A710B',
              marginBottom: 12,
            }}
          >
            <Award size={15} /> {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {newBadges.map((id, i) => {
              const badge = BADGE_BY_ID[id];
              if (!badge) return null;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.09, ease: EASE }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1.5px solid #D9A521',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <badge.icon size={17} color="#9A710B" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#22252A' }}>{badge.name}</div>
                    <div style={{ fontSize: 13, color: '#5A6578' }}>{badge.hint}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={onReplay} className="btn-atlas-ghost" style={{ fontSize: 14 }}>
          <RotateCcw size={14} /> Play again
        </button>
        {next && (
          <button
            type="button"
            onClick={next.go}
            className="btn-atlas-coral"
            style={{ fontSize: 14 }}
          >
            Next: {next.title} <ArrowRight size={14} />
          </button>
        )}
        <button type="button" onClick={onExit} className="btn-atlas-ghost" style={{ fontSize: 14 }}>
          Back to the arcade
        </button>
      </div>
    </div>
  );
}
