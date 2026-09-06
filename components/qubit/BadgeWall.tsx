'use client';

import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';

import { BADGES } from './gameData';
import { TIER_META, type Progress } from './progressStore';

/* ══════════════════════════════════════════════════════════════
   BADGE WALL — shared by /qubit and /profile.

   An unearned badge is never a blank: it keeps its icon as a
   dashed silhouette and says exactly what unlocks it, so the wall
   doubles as a to-do list. Earned badges wear the tier ring taken
   live from the game record, which is why a bronze quietly turns
   gold when the learner replays.

   `hydrated` is false during prerender and on the first client
   render, so the wall must be able to draw itself with nothing
   earned at all.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

interface BadgeWallProps {
  progress: Progress;
  hydrated: boolean;
  /** Heading + count are hidden when the wall is embedded under one. */
  bare?: boolean;
}

export default function BadgeWall({ progress, hydrated, bare }: BadgeWallProps) {
  const earnedCount = hydrated ? Object.keys(progress.badges).length : 0;

  return (
    <div>
      {!bare && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 18,
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
                color: '#9A710B',
                marginBottom: 6,
              }}
            >
              <Award size={13} /> The badge wall
            </div>
            <h3
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#22252A',
              }}
            >
              {earnedCount} of {BADGES.length} earned
            </h3>
          </div>
          <p style={{ fontSize: 13, color: '#5A6578', maxWidth: 340, lineHeight: 1.6 }}>
            Six for the games themselves, eight for the things you only manage on purpose.
          </p>
        </div>
      )}

      <div className="roadmap-grid-auto">
        {BADGES.map((badge, i) => {
          const earnedAt = hydrated ? progress.badges[badge.id] : undefined;
          const earned = Boolean(earnedAt);
          /* Per-game badges show the tier they were won at. */
          const tier = badge.gameId ? (hydrated ? progress.games[badge.gameId]?.tier : null) : null;
          const meta = tier ? TIER_META[tier] : null;
          const Icon = badge.icon;

          return (
            <motion.div
              key={badge.id}
              className={earned ? 'qubit-badge qubit-badge-earned' : 'qubit-badge'}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: EASE }}
              style={{
                background: earned ? (meta?.fill ?? '#FFFFFF') : 'transparent',
                border: earned
                  ? `2px solid ${meta?.ring ?? '#9BC1BC'}`
                  : '1.5px dashed rgba(34,37,42,0.18)',
                borderRadius: 14,
                padding: '16px 14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  margin: '0 auto 10px',
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  background: earned ? '#FFFFFF' : 'rgba(34,37,42,0.04)',
                  border: earned ? `1.5px solid ${meta?.ring ?? '#9BC1BC'}` : '1px solid transparent',
                  position: 'relative',
                }}
              >
                <Icon
                  size={21}
                  color={earned ? (meta?.ink ?? '#4E7A74') : '#B4BCC6'}
                  strokeWidth={earned ? 2 : 1.5}
                />
                {!earned && (
                  <Lock
                    size={11}
                    color="#B4BCC6"
                    style={{ position: 'absolute', right: -3, bottom: -3 }}
                  />
                )}
              </div>

              <div
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: earned ? '#22252A' : '#8A93A0',
                  marginBottom: 5,
                  lineHeight: 1.3,
                }}
              >
                {badge.name}
              </div>

              {earned && meta && (
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: meta.ink,
                    background: '#FFFFFF',
                    border: `1px solid ${meta.ring}`,
                    borderRadius: 999,
                    padding: '2px 9px',
                    marginBottom: 6,
                  }}
                >
                  {meta.label}
                </div>
              )}

              <p
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  color: earned ? '#5A6578' : '#8A93A0',
                }}
              >
                {earned ? formatEarned(earnedAt!) : badge.hint}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatEarned(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Earned';
  return `Earned ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}
