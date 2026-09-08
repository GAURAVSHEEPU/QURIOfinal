'use client';

import { useCallback, useEffect, useState } from 'react';

import type { StickmanPose } from '../roadmap/Stickman';
import { claimGuestProgress, setActiveUser } from '../qubit/progressStore';
import {
  type Credential,
  INSECURE_CONTEXT_MESSAGE,
  MIN_PASSWORD_LENGTH,
  cryptoReady,
  hashPassword,
  newId,
  verifyPassword,
} from './passwords';

/* ══════════════════════════════════════════════════════════════
   ACCOUNT STORE — who is learning.

   Same shape as progressStore: module-level state, a Set of
   listeners, and a `hydrated` flag every consumer must gate on,
   because localStorage does not exist during prerender and these
   pages are all static.

   WHAT THIS IS. Accounts live in this browser. Passwords are
   PBKDF2-hashed before they are written (see passwords.ts), so a
   reused password is not sitting in plaintext on disk — but the
   account is not tamper-proof. Anyone with devtools on this
   machine can rewrite qurio.users.v1. /profile says so plainly
   rather than implying a security guarantee that is not there.

   SWAPPING IN A REAL BACKEND. Every localStorage call in this file
   is inside one of four functions:

       readUsers()   writeUsers()   readSession()   writeSession()

   Replace those four with fetches to an API and everything above
   them — the actions, the hook, all seven pages — is unchanged.
   Nothing else in the file touches storage.

   ONE SHARED KEY. progressStore reads SESSION_KEY directly to work
   out whose progress to load. That is deliberate: importing this
   module from there would make a cycle, and progressStore must get
   the right answer on its very first read, before any effect has
   run. The key name is duplicated in both files and commented at
   both ends — change it in one place and the other breaks loudly
   in verification step 5.
   ══════════════════════════════════════════════════════════════ */

const USERS_KEY = 'qurio.users.v1';
/** Mirrored in progressStore.ts — see the note above. */
const SESSION_KEY = 'qurio.session.v1';
const VERSION = 1;

/** Where the gate parked you before bouncing you to /login. */
export const NEXT_KEY = 'qurio.auth.next';

/* ── Types ────────────────────────────────────────────────────── */

/** What components are allowed to see. No credential fields, ever. */
export interface Account {
  id: string;
  name: string;
  /** Lowercased. The login handle. */
  email: string;
  /** The learner's stickman colour. */
  accent: string;
  /** The learner's stickman pose. */
  pose: StickmanPose;
  createdAt: string;
  lastSeen: string;
}

interface AccountRecord extends Account, Credential {}

export type AuthResult = { ok: true } | { ok: false; error: string };

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  accent: string;
  pose: StickmanPose;
}

/* ── Defensive parsing ────────────────────────────────────────── */

const POSES: StickmanPose[] = ['wave', 'read', 'climb', 'point', 'think', 'stand', 'celebrate'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/* Anything hand-edited or written by an older build must degrade to
   a usable record — or be dropped — rather than throw during render. */
function normaliseRecord(raw: unknown): AccountRecord | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.id);
  const email = str(raw.email).toLowerCase();
  const hash = str(raw.hash);
  const salt = str(raw.salt);
  if (!id || !email || !hash || !salt) return null;

  const pose = raw.pose;
  return {
    id,
    email,
    name: str(raw.name, 'Explorer'),
    accent: /^#[0-9a-f]{6}$/i.test(str(raw.accent)) ? str(raw.accent) : '#ED6A5A',
    pose: POSES.includes(pose as StickmanPose) ? (pose as StickmanPose) : 'wave',
    createdAt: str(raw.createdAt, new Date().toISOString()),
    lastSeen: str(raw.lastSeen, new Date().toISOString()),
    salt,
    hash,
    iterations: typeof raw.iterations === 'number' && raw.iterations > 0 ? raw.iterations : 600_000,
  };
}

/** Strips the credential fields. The only way a record leaves this module. */
function publicOf(record: AccountRecord): Account {
  const { salt: _salt, hash: _hash, iterations: _iterations, ...account } = record;
  return account;
}

/* ── Storage — the four functions a real backend would replace ── */

function readUsers(): Record<string, AccountRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== VERSION || !isRecord(parsed.users)) return {};

    const out: Record<string, AccountRecord> = {};
    for (const value of Object.values(parsed.users)) {
      const record = normaliseRecord(value);
      if (record) out[record.id] = record;
    }
    return out;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, AccountRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify({ version: VERSION, users }));
  } catch {
    // Over quota or storage denied — the session still works in memory.
  }
}

function readSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isRecord(parsed) && typeof parsed.uid === 'string' ? parsed.uid : null;
  } catch {
    return null;
  }
}

function writeSession(uid: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (uid === null) window.localStorage.removeItem(SESSION_KEY);
    else window.localStorage.setItem(SESSION_KEY, JSON.stringify({ uid, since: Date.now() }));
  } catch {
    /* nothing to clean up */
  }
}

/* ── Module-level store ───────────────────────────────────────── */

let users: Record<string, AccountRecord> = {};
let current: Account | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  users = readUsers();
  const uid = readSession();
  /* A session pointing at a deleted account is not a session. */
  current = uid && users[uid] ? publicOf(users[uid]) : null;
  if (uid && !users[uid]) writeSession(null);
  loaded = true;
}

/** Adopts a uid as the active session and re-points the progress store at it. */
function adopt(uid: string | null) {
  writeSession(uid);
  current = uid && users[uid] ? publicOf(users[uid]) : null;
  setActiveUser(current ? current.id : null);
  emit();
}

function touch(id: string) {
  const record = users[id];
  if (!record) return;
  users = { ...users, [id]: { ...record, lastSeen: new Date().toISOString() } };
  writeUsers(users);
}

/* ── Validation ───────────────────────────────────────────────── */

/* Deliberately permissive. The point is to catch a typo, not to
   adjudicate RFC 5322 — and there is no mail server to bounce off. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Enter your email.';
  if (!EMAIL_RE.test(email.trim())) return "That doesn't look like an email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `At least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Enter a name — it is what your stickman answers to.';
  if (name.trim().length > 40) return 'Keep it under 40 characters.';
  return null;
}

/* ── Actions ──────────────────────────────────────────────────── */

/**
 * Creates the account, signs it in, and — for the first account on
 * this browser only — adopts whatever progress was made before
 * anyone signed up, so a guest's work is not thrown away.
 */
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  ensureLoaded();
  if (!cryptoReady()) return { ok: false, error: INSECURE_CONTEXT_MESSAGE };

  const email = input.email.trim().toLowerCase();
  const nameError = validateName(input.name);
  if (nameError) return { ok: false, error: nameError };
  const emailError = validateEmail(email);
  if (emailError) return { ok: false, error: emailError };
  const passwordError = validatePassword(input.password);
  if (passwordError) return { ok: false, error: passwordError };

  if (Object.values(users).some((u) => u.email === email)) {
    return { ok: false, error: 'An account already uses that email on this browser.' };
  }

  let credential: Credential;
  try {
    credential = await hashPassword(input.password);
  } catch {
    return { ok: false, error: 'Could not secure that password. Try again.' };
  }

  const now = new Date().toISOString();
  const record: AccountRecord = {
    id: newId(),
    name: input.name.trim(),
    email,
    accent: input.accent,
    pose: input.pose,
    createdAt: now,
    lastSeen: now,
    ...credential,
  };

  users = { ...users, [record.id]: record };
  writeUsers(users);
  claimGuestProgress(record.id);
  adopt(record.id);
  return { ok: true };
}

/**
 * A wrong email and a wrong password give the same message. The
 * store is local, so this leaks nothing an attacker could not read
 * directly — but the habit is worth keeping for the day it is not.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  ensureLoaded();
  if (!cryptoReady()) return { ok: false, error: INSECURE_CONTEXT_MESSAGE };

  const handle = email.trim().toLowerCase();
  const mismatch = { ok: false as const, error: "That email and password don't match an account." };

  const record = Object.values(users).find((u) => u.email === handle);
  if (!record) return mismatch;

  let matches: boolean;
  try {
    matches = await verifyPassword(password, record);
  } catch {
    return { ok: false, error: 'Could not check that password. Try again.' };
  }
  if (!matches) return mismatch;

  touch(record.id);
  adopt(record.id);
  return { ok: true };
}

export function signOut(): void {
  ensureLoaded();
  adopt(null);
}

/** Name, colour and pose only — the credential fields are not editable here. */
export function updateAccount(patch: Partial<Pick<Account, 'name' | 'accent' | 'pose'>>): void {
  ensureLoaded();
  if (!current) return;
  const record = users[current.id];
  if (!record) return;

  users = { ...users, [record.id]: { ...record, ...patch } };
  writeUsers(users);
  current = publicOf(users[record.id]);
  emit();
}

/** Removes the account AND its progress. There is no undo and no export. */
export function deleteAccount(): void {
  ensureLoaded();
  if (!current) return;
  const id = current.id;

  const next = { ...users };
  delete next[id];
  users = next;
  writeUsers(users);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(`qurio.progress.v1:${id}`);
    } catch {
      /* nothing to clean up */
    }
  }
  adopt(null);
}

/** Signed-out count, for the sign-in page's "no accounts here yet" copy. */
export function accountCount(): number {
  ensureLoaded();
  return Object.keys(users).length;
}

/* ── Hook ─────────────────────────────────────────────────────── */

export interface UseAuth {
  account: Account | null;
  /** false during prerender and the first client render — gate UI on it. */
  hydrated: boolean;
  signIn: typeof signIn;
  signUp: typeof signUp;
  signOut: typeof signOut;
  updateAccount: typeof updateAccount;
  deleteAccount: typeof deleteAccount;
}

export function useAuth(): UseAuth {
  const [snapshot, setSnapshot] = useState<Account | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    ensureLoaded();
    /* The session was restored before any effect ran, but the
       progress store still has to be told, because nothing has
       called adopt() on this page load. */
    setActiveUser(current ? current.id : null);
    setSnapshot(current);
    setHydrated(true);

    const listener = () => setSnapshot(current);
    listeners.add(listener);

    /* Signing out in one tab signs out the others. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== SESSION_KEY && e.key !== USERS_KEY) return;
      loaded = false;
      ensureLoaded();
      setActiveUser(current ? current.id : null);
      emit();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const boundSignIn = useCallback(signIn, []);
  const boundSignUp = useCallback(signUp, []);

  return {
    account: snapshot,
    hydrated,
    signIn: boundSignIn,
    signUp: boundSignUp,
    signOut,
    updateAccount,
    deleteAccount,
  };
}
