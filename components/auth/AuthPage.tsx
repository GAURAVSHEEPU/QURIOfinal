'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion } from 'framer-motion';
import { ArrowRight, Compass, Gamepad2, Cpu, ShieldCheck, Trophy } from 'lucide-react';

import AtlasNav from '../shared/AtlasNav';
import RoadmapBackground from '../roadmap/RoadmapBackground';
import Stickman, { type StickmanPose } from '../roadmap/Stickman';

import AvatarPicker, { ACCENTS } from './AvatarPicker';
import PasswordField from './PasswordField';
import {
  NEXT_KEY,
  useAuth,
  validateEmail,
  validateName,
  validatePassword,
} from './authStore';
import { INSECURE_CONTEXT_MESSAGE, cryptoReady } from './passwords';

/* ══════════════════════════════════════════════════════════════
   SIGN IN  ·  /login

   One page, two modes, deep-linkable as /login#signup. The mode
   lives in the hash rather than a query string on purpose:
   useSearchParams would drag this page out of static rendering
   unless it were wrapped in Suspense, which /roadmap already
   learned the hard way.

   The left column is a gatekeeper who reacts to the form in real
   time — he looks away while you type a password, tips over when
   the credentials are refused, and walks off through the gate
   before the redirect fires so the walk is actually seen. His
   position is a CSS transition, not a spring: a spring in a tab
   that has stopped painting never arrives.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;

type Mode = 'signin' | 'signup';
type Status = 'idle' | 'working' | 'rejected' | 'accepted';
type Field = 'name' | 'email' | 'password' | 'confirm';

const PERKS = [
  { icon: Compass, text: 'Your own place on the roadmap' },
  { icon: Gamepad2, text: 'Game scores and tiers that stick' },
  { icon: Trophy, text: 'A badge wall nobody else can touch' },
  { icon: Cpu, text: 'Circuit challenges filed under your name' },
];

/** Only ever send someone back inside the portal. */
const SAFE_NEXT = /^\/(roadmap|qubit|circuit|profile)(\/[a-z0-9-]*)*$/i;

export default function AuthPage() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthScreen />
    </MotionConfig>
  );
}

function AuthScreen() {
  const router = useRouter();
  const { account, hydrated, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [status, setStatus] = useState<Status>('idle');
  const [focused, setFocused] = useState<Field | null>(null);
  const [walking, setWalking] = useState(false);
  const [secure, setSecure] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0].value);
  const [pose, setPose] = useState<StickmanPose>('wave');

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  /* Set the instant a submit succeeds, so the "already signed in"
     redirect below does not fire and cut the walk-off short. */
  const acceptedRef = useRef(false);
  const nextRef = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  /* ── Mode from the hash, including a hash change while mounted ── */
  useEffect(() => {
    const read = () => setMode(window.location.hash === '#signup' ? 'signup' : 'signin');
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  /* ── Where the gate parked us, and whether crypto is available ── */
  useEffect(() => {
    setSecure(cryptoReady());
    try {
      const parked = window.sessionStorage.getItem(NEXT_KEY);
      nextRef.current = parked && SAFE_NEXT.test(parked) ? parked : null;
    } catch {
      nextRef.current = null;
    }
  }, []);

  /* ── Already signed in? Nothing to do here. ── */
  useEffect(() => {
    if (!hydrated || !account || acceptedRef.current) return;
    router.replace(nextRef.current ?? '/profile');
  }, [hydrated, account, router]);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError(null);
    setStatus('idle');
    try {
      window.history.replaceState(null, '', next === 'signup' ? '/login#signup' : '/login');
    } catch {
      /* history is not essential to the toggle working */
    }
  }

  function land() {
    let dest = '/profile';
    try {
      const parked = window.sessionStorage.getItem(NEXT_KEY);
      if (parked && SAFE_NEXT.test(parked)) dest = parked;
      window.sessionStorage.removeItem(NEXT_KEY);
    } catch {
      /* fall through to /profile */
    }
    router.replace(dest);
  }

  function reject(message: string) {
    acceptedRef.current = false;
    setFormError(message);
    setStatus('rejected');
    /* He picks himself back up rather than lying there. */
    after(1200, () => setStatus((s) => (s === 'rejected' ? 'idle' : s)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'working' || status === 'accepted') return;

    const found: Partial<Record<Field, string>> = {};
    const emailError = validateEmail(email);
    if (emailError) found.email = emailError;

    if (mode === 'signup') {
      const nameError = validateName(name);
      if (nameError) found.name = nameError;
      const passwordError = validatePassword(password);
      if (passwordError) found.password = passwordError;
      if (confirm !== password) found.confirm = 'The two passwords do not match.';
    } else if (!password) {
      found.password = 'Enter your password.';
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      reject('Have another look at the highlighted fields.');
      return;
    }

    setFormError(null);
    setStatus('working');

    const result =
      mode === 'signup'
        ? await signUp({ name, email, password, accent, pose })
        : await signIn(email, password);

    if (!result.ok) {
      reject(result.error);
      return;
    }

    /* Through the gate: celebrate, walk, then navigate. */
    acceptedRef.current = true;
    setStatus('accepted');
    after(480, () => setWalking(true));
    after(1180, land);
  }

  /* ── What the gatekeeper is doing ── */
  const busy = status === 'working' || status === 'accepted';

  const keeperPose: StickmanPose =
    status === 'accepted'
      ? 'celebrate'
      : status === 'working'
        ? 'juggle'
        : status === 'rejected'
          ? 'fall'
          : focused === 'password' || focused === 'confirm'
            ? 'think'
            : focused === 'email' || focused === 'name'
              ? 'teach'
              : 'stand';

  const looksAway = !busy && status !== 'rejected' && (focused === 'password' || focused === 'confirm');

  const caption =
    status === 'accepted'
      ? mode === 'signup'
        ? 'Welcome to the Atlas.'
        : 'Welcome back in.'
      : status === 'working'
        ? 'Checking the ledger…'
        : status === 'rejected'
          ? "That didn't open it."
          : looksAway
            ? 'Not looking.'
            : focused === 'email' || focused === 'name'
              ? 'Go on — who are you?'
              : 'The gate stays shut until we know who you are.';

  const signup = mode === 'signup';

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
      <AtlasNav current="login" />

      <div className="atlas-content-layer">
        <div className="auth-layout">
          {/* ══════════════ THE GATE ══════════════ */}
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#5A6578',
                marginBottom: 10,
              }}
            >
              Quantum Atlas · The portal
            </div>
            <h1
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 'clamp(1.9rem, 3.6vw, 2.7rem)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              {signup ? (
                <>
                  Make the climb <span className="atlas-marker">yours</span>
                </>
              ) : (
                <>
                  Welcome <span className="atlas-marker">back</span>
                </>
              )}
            </h1>
            <p style={{ fontSize: 15, color: '#5A6578', lineHeight: 1.65, maxWidth: 440 }}>
              {signup
                ? 'One account keeps every module you have read, every game you have cleared and every badge you have earned attached to you — not to whoever opens this browser next.'
                : 'Sign in and the roadmap, the arcade and the studio pick up exactly where you left them.'}
            </p>

            {/* ── The stage ── */}
            <div className="auth-stage" aria-hidden="true">
              <div className="auth-gate">
                <span className="auth-gate-post" style={{ left: 0 }} />
                <span className="auth-gate-post" style={{ right: 0 }} />
                <span className="auth-gate-lintel" />
                <span className={`auth-gate-leaf${status === 'accepted' ? ' is-open' : ''}`} />
              </div>

              <span className="auth-walker" style={{ left: walking ? 'calc(100% + 60px)' : '14%' }}>
                <Stickman
                  pose={keeperPose}
                  size={132}
                  accent={accent}
                  striding={walking}
                  flip={looksAway}
                />
              </span>

              <div className="auth-ground" />
            </div>

            <p className="auth-caption" role="status" aria-live="polite">
              {caption}
            </p>

            {/* ── What is behind the gate ── */}
            <ul className="auth-perks">
              {PERKS.map((perk) => (
                <li key={perk.text}>
                  <perk.icon size={15} style={{ color: '#0081A7', flexShrink: 0 }} />
                  {perk.text}
                </li>
              ))}
            </ul>
          </motion.section>

          {/* ══════════════ THE FORM ══════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          >
            <div className={`atlas-card auth-card${status === 'rejected' ? ' is-rejected' : ''}`}>
              {/* ── Mode toggle ── */}
              <div className="auth-tabs" role="tablist" aria-label="Account">
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    className={`auth-tab${mode === m ? ' is-active' : ''}`}
                    onClick={() => switchMode(m)}
                    disabled={busy}
                  >
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              {!secure && (
                <p className="auth-banner" role="alert">
                  {INSECURE_CONTEXT_MESSAGE}
                </p>
              )}

              <form onSubmit={onSubmit} noValidate>
                {signup && (
                  <TextField
                    label="Name"
                    value={name}
                    onChange={setName}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    error={errors.name}
                    autoComplete="name"
                    placeholder="What should we call you?"
                    disabled={busy}
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  error={errors.email}
                  autoComplete={signup ? 'email' : 'username'}
                  placeholder="you@example.com"
                  disabled={busy}
                />

                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  error={errors.password}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  showStrength={signup}
                  hint={
                    signup
                      ? 'There is no password reset — this account lives in this browser only.'
                      : undefined
                  }
                  disabled={busy}
                />

                {signup && (
                  <PasswordField
                    label="Confirm password"
                    value={confirm}
                    onChange={setConfirm}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    error={errors.confirm}
                    autoComplete="new-password"
                    disabled={busy}
                  />
                )}

                {signup && (
                  <div className="auth-avatar-block">
                    <p className="auth-label" style={{ marginBottom: 12 }}>
                      Your stickman
                    </p>
                    <AvatarPicker
                      accent={accent}
                      pose={pose}
                      onAccentChange={setAccent}
                      onPoseChange={setPose}
                      disabled={busy}
                    />
                  </div>
                )}

                {formError && (
                  <p className="auth-form-error" role="alert">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-atlas-coral auth-submit"
                  disabled={busy || !secure}
                >
                  {status === 'working'
                    ? 'Checking…'
                    : status === 'accepted'
                      ? 'Opening the gate…'
                      : signup
                        ? 'Create my account'
                        : 'Sign in'}
                  {!busy && <ArrowRight size={15} />}
                </button>
              </form>

              <div className="auth-foot">
                <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <ShieldCheck size={15} style={{ color: '#9BC1BC', flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Your account and your progress stay in this browser. The password is hashed
                    before it is stored — but this is not proof against someone with devtools on
                    this machine.
                  </span>
                </p>
                <p style={{ marginTop: 12 }}>
                  {signup ? 'Already have an account?' : 'New here?'}{' '}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => switchMode(signup ? 'signin' : 'signup')}
                    disabled={busy}
                  >
                    {signup ? 'Sign in instead' : 'Create one'}
                  </button>
                  {' · '}
                  <Link href="/" className="auth-link">
                    Look around first
                  </Link>
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

/* ── A plain text input, matching PasswordField's anatomy ────── */

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

function TextField({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  type = 'text',
  autoComplete,
  placeholder,
  disabled,
}: TextFieldProps) {
  const id = `f-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="auth-field"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="auth-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
