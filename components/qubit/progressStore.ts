'use client';

import { useCallback, useEffect, useState } from 'react';

import { BADGES } from './gameData';

/* ══════════════════════════════════════════════════════════════
   PROGRESS STORE — the one source of truth for what a learner has
   studied, played and earned.

   Progress lives in localStorage on the learner's own device,
   keyed by account. Four routes read it (/roadmap marks modules
   studied, /qubit gates the games, /circuit files challenges,
   /profile visualises the climb) so it is a module-level store
   with subscribers rather than per-component state — otherwise the
   roadmap's "studied" toggle and the portal's locks could drift
   apart within a single navigation.

   WHOSE PROGRESS. Each account gets its own key,
   `qurio.progress.v1:<uid>`. The active uid is read straight out
   of the session key that authStore writes, rather than by
   importing authStore — that would be a cycle, and this store has
   to get the right answer on its very first read, before any
   effect has run. SESSION_KEY below is the shared contract; it is
   commented at the other end too.

   The bare `qurio.progress.v1` is the guest key: what a signed-out
   visitor writes, and where everyone's progress lived before
   accounts existed. claimGuestProgress() hands it to the first
   account created on this browser so that work is not lost.

   HYDRATION: these pages are statically prerendered, and
   localStorage does not exist on the server. Every consumer must
   therefore render the EMPTY state until `hydrated` flips true in
   an effect. Reading storage during render would mismatch.
   ══════════════════════════════════════════════════════════════ */

/** Signed-out progress, and the pre-accounts key. */
const GUEST_KEY = 'qurio.progress.v1';
/** Written by components/auth/authStore.ts — see the note above. */
const SESSION_KEY = 'qurio.session.v1';
const VERSION = 1;

export type GameId = 'g-beam' | 'g-collapse' | 'g-hopscotch' | 'g-twins' | 'g-noise' | 'g-relay';
export type Tier = 'bronze' | 'silver' | 'gold';

export const GAME_IDS: GameId[] = [
  'g-beam',
  'g-collapse',
  'g-hopscotch',
  'g-twins',
  'g-noise',
  'g-relay',
];

export interface GameRecord {
  plays: number;
  /** Best score ever reached — a worse replay never downgrades it. */
  best: number;
  max: number;
  tier: Tier | null;
  /** Has this game ever been cleared without opening a hint? */
  noHint: boolean;
  /** ISO timestamp of the most recent play. */
  last: string;
}

export interface Progress {
  version: number;
  /** Milestone ids marked studied on /roadmap, e.g. 'b3'. */
  studied: string[];
  games: Partial<Record<GameId, GameRecord>>;
  /** badge id → ISO date earned. */
  badges: Record<string, string>;
  /** One-off achievements a game can raise, e.g. 'bell-built'. */
  flags: string[];
}

/** Frozen so it can safely be the shared server/first-render snapshot. */
export const EMPTY_PROGRESS: Progress = Object.freeze({
  version: VERSION,
  studied: Object.freeze([]) as unknown as string[],
  games: Object.freeze({}),
  badges: Object.freeze({}) as Record<string, string>,
  flags: Object.freeze([]) as unknown as string[],
});

/* ── Tiers & XP ───────────────────────────────────────────────── */

export const TIER_META: Record<Tier, { label: string; ring: string; fill: string; ink: string }> = {
  bronze: { label: 'Bronze', ring: '#C08457', fill: '#F7EDE4', ink: '#8A5A32' },
  silver: { label: 'Silver', ring: '#9AA5B1', fill: '#F1F3F6', ink: '#5A6578' },
  gold: { label: 'Gold', ring: '#D9A521', fill: '#FDF6E3', ink: '#9A710B' },
};

const TIER_BONUS: Record<Tier, number> = { bronze: 25, silver: 60, gold: 120 };

export function tierFor(score: number, max: number): Tier | null {
  if (max <= 0) return null;
  if (score >= max) return 'gold';
  const ratio = score / max;
  if (ratio >= 0.75) return 'silver';
  if (ratio >= 0.5) return 'bronze';
  return null; // below half is not a clear — the game invites a retry
}

export function tierRank(tier: Tier | null): number {
  return tier === 'gold' ? 3 : tier === 'silver' ? 2 : tier === 'bronze' ? 1 : 0;
}

/* XP is DERIVED from bests rather than accumulated, so replaying a
   game can never farm it and a reset can never leave a stale total. */
export function xpFor(p: Progress): number {
  let xp = p.studied.length * 20 + Object.keys(p.badges).length * 50;
  for (const id of GAME_IDS) {
    const rec = p.games[id];
    if (!rec) continue;
    xp += rec.best * 10;
    if (rec.tier) xp += TIER_BONUS[rec.tier];
  }
  return xp;
}

export function clearedCount(p: Progress): number {
  return GAME_IDS.filter((id) => p.games[id]?.tier != null).length;
}

/* ── Storage ──────────────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* Anything hand-edited, truncated or written by an older build must
   degrade to a usable Progress rather than throw during render. */
function normalise(raw: unknown): Progress {
  if (!isRecord(raw) || raw.version !== VERSION) return EMPTY_PROGRESS;

  const studied = Array.isArray(raw.studied)
    ? raw.studied.filter((v): v is string => typeof v === 'string')
    : [];
  const flags = Array.isArray(raw.flags)
    ? raw.flags.filter((v): v is string => typeof v === 'string')
    : [];

  const badges: Record<string, string> = {};
  if (isRecord(raw.badges)) {
    for (const [k, v] of Object.entries(raw.badges)) {
      if (typeof v === 'string') badges[k] = v;
    }
  }

  const games: Partial<Record<GameId, GameRecord>> = {};
  if (isRecord(raw.games)) {
    for (const id of GAME_IDS) {
      const rec = raw.games[id];
      if (!isRecord(rec)) continue;
      const tier = rec.tier;
      games[id] = {
        plays: typeof rec.plays === 'number' ? rec.plays : 0,
        best: typeof rec.best === 'number' ? rec.best : 0,
        max: typeof rec.max === 'number' ? rec.max : 0,
        tier: tier === 'bronze' || tier === 'silver' || tier === 'gold' ? tier : null,
        noHint: rec.noHint === true,
        last: typeof rec.last === 'string' ? rec.last : '',
      };
    }
  }

  return { version: VERSION, studied, games, badges, flags };
}

/* ── Whose progress ───────────────────────────────────────────── */

/**
 * The signed-in account id, straight from the session key. Read on
 * demand rather than cached, so the very first ensureLoaded() —
 * which can happen before any effect — already lands on the right
 * person's data.
 */
function sessionUid(): string | null {
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

function storageKey(uid: string | null = sessionUid()): string {
  return uid ? `${GUEST_KEY}:${uid}` : GUEST_KEY;
}

function readStorage(key: string = storageKey()): Progress {
  if (typeof window === 'undefined') return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_PROGRESS;
    return normalise(JSON.parse(raw));
  } catch {
    // Private mode, disabled storage, or corrupt JSON — start fresh.
    return EMPTY_PROGRESS;
  }
}

function isEmpty(p: Progress): boolean {
  return (
    p.studied.length === 0 &&
    p.flags.length === 0 &&
    Object.keys(p.badges).length === 0 &&
    Object.keys(p.games).length === 0
  );
}

/* ── Module-level store ───────────────────────────────────────── */

let state: Progress = EMPTY_PROGRESS;
let loaded = false;
/** Mirrors the session key; kept so a sign-out can be detected. */
let activeUid: string | null = null;
const listeners = new Set<() => void>();

/** Games cleared in THIS tab session — powers the marathon badge. */
let sessionClears = new Set<GameId>();

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  activeUid = sessionUid();
  state = readStorage(storageKey(activeUid));
  loaded = true;
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(activeUid), JSON.stringify(state));
  } catch {
    // Over quota or storage denied — the session still works in memory.
  }
}

/* ── Account switching ────────────────────────────────────────── */

/**
 * Re-points the store at another account's progress. Called by
 * authStore on sign-in, sign-out and cross-tab session changes, so
 * every mounted page re-renders against the new person's data
 * rather than the last one's.
 */
export function setActiveUser(uid: string | null) {
  if (loaded && uid === activeUid) return;
  activeUid = uid;
  /* A new learner has not cleared anything in this tab. */
  sessionClears = new Set();
  state = readStorage(storageKey(uid));
  loaded = true;
  emit();
}

/**
 * Hands whatever a signed-out visitor did to their brand-new
 * account. Only ever fires for an account whose own slot is still
 * empty, so a second sign-up on the same browser starts clean.
 * Returns whether anything was actually moved.
 */
export function claimGuestProgress(uid: string): boolean {
  if (typeof window === 'undefined') return false;
  const guest = readStorage(GUEST_KEY);
  if (isEmpty(guest)) return false;
  if (!isEmpty(readStorage(storageKey(uid)))) return false;

  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(guest));
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    return false;
  }
  return true;
}

function emit() {
  listeners.forEach((fn) => fn());
}

/** Awards every badge whose condition now holds. Returns the new ones. */
function award(p: Progress): { next: Progress; newly: string[] } {
  const ctx = { sessionClears: sessionClears.size };
  const newly: string[] = [];
  let badges = p.badges;

  for (const badge of BADGES) {
    if (p.badges[badge.id]) continue;
    if (!badge.test(p, ctx)) continue;
    if (badges === p.badges) badges = { ...p.badges };
    badges[badge.id] = new Date().toISOString();
    newly.push(badge.id);
  }

  return newly.length ? { next: { ...p, badges }, newly } : { next: p, newly };
}

function commit(mutate: (p: Progress) => Progress): string[] {
  ensureLoaded();
  const { next, newly } = award(mutate(state));
  state = next;
  persist();
  emit();
  return newly;
}

/* ── Actions ──────────────────────────────────────────────────── */

export function markStudied(milestoneId: string): string[] {
  return commit((p) =>
    p.studied.includes(milestoneId) ? p : { ...p, studied: [...p.studied, milestoneId] }
  );
}

export function unmarkStudied(milestoneId: string): string[] {
  return commit((p) =>
    p.studied.includes(milestoneId)
      ? { ...p, studied: p.studied.filter((id) => id !== milestoneId) }
      : p
  );
}

/**
 * Raises a one-off achievement flag outside a scored game — Circuit
 * Studio's challenges use this, since a circuit has no score to file.
 * Returns any badges the flag unlocked.
 */
export function raiseFlag(flag: string): string[] {
  return commit((p) => (p.flags.includes(flag) ? p : { ...p, flags: [...p.flags, flag] }));
}

export interface GameResult {
  score: number;
  max: number;
  hintsUsed: number;
  /** One-off achievements this run unlocked, e.g. 'hopscotch-par'. */
  flags?: string[];
}

/**
 * Files a finished run. Keeps the best-ever score and tier, so a
 * sloppy replay never costs a learner a badge they already earned.
 * Returns the ids of any badges this run unlocked.
 */
export function recordResult(gameId: GameId, result: GameResult): string[] {
  const tier = tierFor(result.score, result.max);
  if (tier) sessionClears.add(gameId);

  return commit((p) => {
    const prev = p.games[gameId];
    const bestTier = tierRank(tier) >= tierRank(prev?.tier ?? null) ? tier : (prev?.tier ?? null);

    const next: GameRecord = {
      plays: (prev?.plays ?? 0) + 1,
      best: Math.max(prev?.best ?? 0, result.score),
      max: result.max,
      tier: bestTier,
      noHint: (prev?.noHint ?? false) || (tier != null && result.hintsUsed === 0),
      last: new Date().toISOString(),
    };

    const flags = result.flags?.length
      ? Array.from(new Set([...p.flags, ...result.flags]))
      : p.flags;

    return { ...p, games: { ...p.games, [gameId]: next }, flags };
  });
}

export function resetProgress() {
  ensureLoaded();
  state = EMPTY_PROGRESS;
  sessionClears = new Set();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(storageKey(activeUid));
    } catch {
      /* nothing to clean up */
    }
  }
  emit();
}

/* ── Hook ─────────────────────────────────────────────────────── */

export interface UseProgress {
  progress: Progress;
  /** false during prerender and the first client render — gate UI on it. */
  hydrated: boolean;
  markStudied: typeof markStudied;
  unmarkStudied: typeof unmarkStudied;
  recordResult: typeof recordResult;
  raiseFlag: typeof raiseFlag;
  resetProgress: typeof resetProgress;
  isStudied: (milestoneId: string) => boolean;
}

export function useProgress(): UseProgress {
  const [snapshot, setSnapshot] = useState<Progress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    ensureLoaded();
    setSnapshot(state);
    setHydrated(true);

    const listener = () => setSnapshot(state);
    listeners.add(listener);

    /* Another tab wrote progress — reload and fan out so both stay level.
       The session key counts too: signing in elsewhere changes whose
       progress this key even refers to. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== storageKey() && e.key !== SESSION_KEY) return;
      loaded = false;
      ensureLoaded();
      emit();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isStudied = useCallback(
    (milestoneId: string) => snapshot.studied.includes(milestoneId),
    [snapshot]
  );

  return {
    progress: snapshot,
    hydrated,
    markStudied,
    unmarkStudied,
    recordResult,
    raiseFlag,
    resetProgress,
    isStudied,
  };
}
