'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MotionConfig, motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Gamepad2,
  GraduationCap,
  HardDrive,
  Lock,
  LogOut,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import AtlasNav from '../shared/AtlasNav';
import RoadmapBackground from '../roadmap/RoadmapBackground';
import Stickman, { type StickmanPose } from '../roadmap/Stickman';
import { TRACK_BY_ID } from '../roadmap/roadmapData';

import AvatarPicker from '../auth/AvatarPicker';
import { type Account, useAuth, validateName } from '../auth/authStore';

import BadgeWall from '../qubit/BadgeWall';
import { BADGES, GAMES } from '../qubit/gameData';
import { TIER_META, clearedCount, useProgress, xpFor } from '../qubit/progressStore';

import ClimbTracker from './ClimbTracker';

/* ══════════════════════════════════════════════════════════════
   MY PROGRESS  ·  /profile

   Everything on this page belongs to one account, and both the
   account and its progress live in this browser's local storage —
   which the page says out loud rather than implying a server that
   is not there. Same hydration rule as /qubit: the empty state is
   what renders first, and real numbers appear only once
   `hydrated` flips.

   The route is wrapped in <AuthGate>, so by the time this renders
   there IS an account; the optional chaining below is belt and
   braces, not a real signed-out path.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

const MILESTONE_TITLE: Record<string, string> = TRACK_BY_ID.beginner.milestones.reduce(
  (acc, m) => ({ ...acc, [m.id]: m.title }),
  {}
);

/* Same reasoning as /qubit: the climb tracker parks via CSS, and
   "user" stops the framer-motion reveals from moving as well. */
export default function ProfilePage() {
  return (
    <MotionConfig reducedMotion="user">
      <ProgressPage />
    </MotionConfig>
  );
}

function ProgressPage() {
  const { progress, hydrated, resetProgress } = useProgress();
  const { account } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const accent = account?.accent ?? '#ED6A5A';

  const studied = hydrated
    ? GAMES.filter((g) => progress.studied.includes(g.milestoneId)).length
    : 0;
  const cleared = hydrated ? clearedCount(progress) : 0;
  const badges = hydrated ? Object.keys(progress.badges).length : 0;
  const xp = hydrated ? xpFor(progress) : 0;
  const golds = hydrated ? GAMES.filter((g) => progress.games[g.id]?.tier === 'gold').length : 0;

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
      <AtlasNav current="profile" />

      <div className="atlas-content-layer">
        {/* ══════════════ HEADER ══════════════ */}
        <header style={{ padding: '60px 28px 34px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
                <Stickman
                  pose={cleared === GAMES.length ? 'celebrate' : (account?.pose ?? 'wave')}
                  size={104}
                  accent={accent}
                  label="Your stickman"
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#5A6578',
                      marginBottom: 6,
                    }}
                  >
                    {account ? `${account.name} · Base Camp` : 'Base Camp · Beginner track'}
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                    }}
                  >
                    My <span className="atlas-marker">progress</span>
                  </h1>
                  <p style={{ fontSize: 14.5, color: '#5A6578', marginTop: 8, maxWidth: 460, lineHeight: 1.6 }}>
                    {hydrated && studied === 0 && cleared === 0
                      ? 'A clean slate. Read a module, mark it studied, and this page starts filling in.'
                      : `${studied} module${studied === 1 ? '' : 's'} read, ${cleared} game${cleared === 1 ? '' : 's'} cleared${golds > 0 ? `, ${golds} at gold` : ''}.`}
                  </p>
                  {account && (
                    <div style={{ fontSize: 12.5, color: '#8A93A0', marginTop: 8 }}>
                      {account.email} · member since {formatDate(account.createdAt)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/roadmap" className="btn-atlas-ghost" style={{ fontSize: 13.5 }}>
                  <BookOpen size={14} /> Roadmap
                </Link>
                <Link href="/qubit" className="btn-atlas-coral" style={{ fontSize: 13.5 }}>
                  <Gamepad2 size={14} /> Qurio Qubit
                </Link>
              </div>
            </motion.div>
          </div>
        </header>

        {/* ══════════════ THE CLIMB ══════════════ */}
        <section style={{ padding: '0 28px 20px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <ClimbTracker progress={progress} hydrated={hydrated} />
          </div>
        </section>

        {/* ══════════════ STAT TILES ══════════════ */}
        <section style={{ padding: '28px 28px 8px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div className="roadmap-grid-4">
              <StatTile
                icon={GraduationCap}
                tone="#0081A7"
                soft="#E6F4F8"
                value={`${studied} / ${GAMES.length}`}
                label="Modules studied"
                sub="Marked on the roadmap"
              />
              <StatTile
                icon={Trophy}
                tone="#D9A521"
                soft="#FDF6E3"
                value={`${cleared} / ${GAMES.length}`}
                label="Games cleared"
                sub="Bronze or better"
              />
              <StatTile
                icon={Award}
                tone="#9A710B"
                soft="#FEF3C7"
                value={`${badges} / ${BADGES.length}`}
                label="Badges earned"
                sub="Six game, nine meta"
              />
              <StatTile
                icon={Zap}
                tone="#ED6A5A"
                soft="#FDECE9"
                value={xp.toLocaleString()}
                label="XP"
                sub="20 a module, 10 a point, 50 a badge"
              />
            </div>
          </div>
        </section>

        {/* ══════════════ PER-GAME TABLE ══════════════ */}
        <section style={{ padding: '44px 28px 20px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Game by game
            </h2>
            <p style={{ fontSize: 14, color: '#5A6578', marginBottom: 18, lineHeight: 1.6 }}>
              Best result only — a weaker replay never overwrites a stronger run.
            </p>

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E6DF',
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              {GAMES.map((game, i) => {
                const rec = hydrated ? progress.games[game.id] : undefined;
                const tier = rec?.tier ?? null;
                const meta = tier ? TIER_META[tier] : null;
                const isStudied = hydrated && progress.studied.includes(game.milestoneId);

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.05, ease: EASE }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '15px 18px',
                      borderTop: i === 0 ? 'none' : '1px solid #EDF0EA',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: game.accentSoft,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <game.icon size={19} color={game.accent} />
                    </div>

                    <div style={{ minWidth: 170, flex: '1 1 200px' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#22252A' }}>
                        {game.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#5A6578', marginTop: 2 }}>
                        Module {game.order} · {MILESTONE_TITLE[game.milestoneId] ?? 'Base Camp'}
                      </div>
                    </div>

                    {/* Tier */}
                    <div style={{ minWidth: 108 }}>
                      {meta ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: meta.fill,
                            border: `1.5px solid ${meta.ring}`,
                            borderRadius: 999,
                            padding: '3px 11px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: meta.ink,
                          }}
                        >
                          <Trophy size={12} color={meta.ring} /> {meta.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12.5, color: '#B4BCC6' }}>
                          {isStudied ? 'Not cleared yet' : 'Locked'}
                        </span>
                      )}
                    </div>

                    {/* Best + plays */}
                    <div
                      style={{
                        minWidth: 120,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        color: rec ? '#22252A' : '#B4BCC6',
                      }}
                    >
                      {rec ? `${rec.best} / ${rec.max}` : `– / ${game.maxScore}`}
                      <span style={{ color: '#8A93A0', fontSize: 11.5 }}>
                        {rec ? `  ·  ${rec.plays} play${rec.plays === 1 ? '' : 's'}` : '  ·  0 plays'}
                      </span>
                    </div>

                    {/* Action */}
                    <div style={{ marginLeft: 'auto' }}>
                      {isStudied ? (
                        <Link
                          href="/qubit"
                          className="btn-atlas-ghost"
                          style={{ padding: '7px 14px', fontSize: 12.5 }}
                        >
                          <Play size={12} /> {rec ? 'Replay' : 'Play'}
                        </Link>
                      ) : (
                        <Link
                          href={`/roadmap#${game.milestoneId}`}
                          className="btn-atlas-ghost"
                          style={{ padding: '7px 14px', fontSize: 12.5 }}
                        >
                          <Lock className="qubit-lock" size={12} /> Study first
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════ BADGE WALL ══════════════ */}
        <section style={{ padding: '52px 28px 20px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <BadgeWall progress={progress} hydrated={hydrated} />
          </div>
        </section>

        {/* ══════════════ ACCOUNT ══════════════ */}
        {account && (
          <section style={{ padding: '44px 28px 0' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <h2
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Your <span className="atlas-marker">account</span>
              </h2>
              <p style={{ fontSize: 14, color: '#5A6578', marginBottom: 18, maxWidth: 620 }}>
                The name and the stickman are yours to change whenever you like — the figure
                follows you into the nav and up the hill above.
              </p>
              <AccountCard account={account} />
            </div>
          </section>
        )}

        {/* ══════════════ STORAGE + RESET ══════════════ */}
        <section style={{ padding: '52px 28px 88px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E6DF',
                borderRadius: 18,
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 14, maxWidth: 560 }}>
                <HardDrive size={19} color="#5A6578" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#22252A', marginBottom: 5 }}>
                    Your account lives in this browser
                  </div>
                  <p style={{ fontSize: 13.5, color: '#5A6578', lineHeight: 1.65 }}>
                    Nothing is uploaded. Your account sits in this browser&apos;s local storage
                    beside its own progress key, and the password is put through PBKDF2 before it
                    is written — so it is not sitting there in plaintext. It is not proof against
                    someone with devtools on this machine, though, and clearing site data or
                    opening the Atlas in another browser starts you over.
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {confirming ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 12.5, color: '#D95342', fontWeight: 600 }}>
                      Erase every badge and score?
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="btn-atlas-ghost"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Keep it
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetProgress();
                          setConfirming(false);
                        }}
                        className="btn-atlas-coral"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        <RotateCcw size={13} /> Yes, reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    disabled={!hydrated || (studied === 0 && cleared === 0 && badges === 0)}
                    className="btn-atlas-ghost"
                    style={{
                      padding: '9px 18px',
                      fontSize: 13,
                      opacity: !hydrated || (studied === 0 && cleared === 0 && badges === 0) ? 0.4 : 1,
                    }}
                  >
                    <RotateCcw size={13} /> Reset progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  tone,
  soft,
  value,
  label,
  sub,
}: {
  icon: LucideIcon;
  tone: string;
  soft: string;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E6DF',
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: soft,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 12,
        }}
      >
        <Icon size={17} color={tone} />
      </div>
      <div
        style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: '#22252A',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#3A3F47', marginTop: 5 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#8A93A0', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
    </motion.div>
  );
}

/* Client-only: <AuthGate> guarantees there is an account before this
   renders, so a locale-dependent date cannot mismatch the prerender. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'today';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ══════════════════════════════════════════════════════════════
   ACCOUNT CARD — name, stickman, and the two ways out.

   Colour and pose commit on click, because a swatch that needed
   saving would be a worse toy. The name has a Save because
   half-typed names should not reach the nav.
   ══════════════════════════════════════════════════════════════ */

function AccountCard({ account }: { account: Account }) {
  const { signOut, updateAccount, deleteAccount } = useAuth();

  const [name, setName] = useState(account.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dirty = name.trim() !== account.name;

  function saveName() {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setNameError(null);
    updateAccount({ name: name.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E6DF',
        borderRadius: 18,
        padding: '22px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 26,
        alignItems: 'start',
      }}
    >
      {/* ── The stickman ── */}
      <div>
        <p className="auth-label" style={{ marginBottom: 12 }}>
          Your stickman
        </p>
        <AvatarPicker
          accent={account.accent}
          pose={account.pose}
          onAccentChange={(accent) => updateAccount({ accent })}
          onPoseChange={(pose: StickmanPose) => updateAccount({ pose })}
          compact
        />
      </div>

      {/* ── Details and exits ── */}
      <div>
        <label className="auth-label" htmlFor="account-name">
          Name
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="account-name"
            className="auth-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'account-name-error' : undefined}
            maxLength={40}
          />
          <button
            type="button"
            onClick={saveName}
            disabled={!dirty}
            className="btn-atlas-ghost"
            style={{ padding: '9px 16px', fontSize: 13, opacity: dirty ? 1 : 0.4, flexShrink: 0 }}
          >
            Save
          </button>
        </div>
        {nameError && (
          <p className="auth-error" id="account-name-error">
            {nameError}
          </p>
        )}
        {saved && !nameError && (
          <p className="auth-hint" style={{ color: '#0081A7', fontWeight: 600 }} role="status">
            Saved.
          </p>
        )}

        <label className="auth-label" htmlFor="account-email" style={{ marginTop: 16 }}>
          Email
        </label>
        <input
          id="account-email"
          className="auth-field"
          value={account.email}
          readOnly
          disabled
        />
        <p className="auth-hint">
          The email is the login handle and cannot be changed — there is no mail channel to confirm
          a new one against.
        </p>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: '1px solid #E2E6DF',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={signOut}
            className="btn-atlas-ghost"
            style={{ padding: '9px 18px', fontSize: 13 }}
          >
            <LogOut size={13} /> Sign out
          </button>

          {confirmingDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: '#D95342', fontWeight: 600 }}>
                Delete the account and everything it has earned?
              </span>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="btn-atlas-ghost"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                className="btn-atlas-coral"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <Trash2 size={13} /> Yes, delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="btn-atlas-ghost"
              style={{ padding: '9px 18px', fontSize: 13, color: '#D95342' }}
            >
              <Trash2 size={13} /> Delete account
            </button>
          )}
        </div>

        <p className="auth-hint" style={{ marginTop: 12 }}>
          Deleting removes the account record and its progress from this browser. Since there is no
          password reset, this is also the way out of a password you cannot remember.
        </p>
      </div>
    </div>
  );
}
