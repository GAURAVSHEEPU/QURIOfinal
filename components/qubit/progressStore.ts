'use client';

import { useCallback, useEffect, useState } from 'react';

import { BADGES } from './gameData';

/* ══════════════════════════════════════════════════════════════
   PROGRESS STORE — the one source of truth for what a learner has
   studied, played and earned.

   There is no backend anywhere in this project, so progress lives
   in localStorage on the learner's own device. Three routes read
   it (/roadmap marks modules studied, /qubit gates the games,
   /profile visualises the climb) so it is a module-level store
   with subscribers rather than per-component state — otherwise the
   roadmap's "studied" toggle and the portal's locks could drift
   apart within a single navigation.

   HYDRATION: these pages are statically prerendered, and
   localStorage does not exist on the server. Every consumer must
   therefore render the EMPTY state until `hydrated` flips true in
   an effect. Reading storage during render would mismatch.
   ══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'qurio.progress.v1';
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

function readStorage(): Progress {
  if (typeof window === 'undefined') return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    return normalise(JSON.parse(raw));
  } catch {
    // Private mode, disabled storage, or corrupt JSON — start fresh.
    return EMPTY_PROGRESS;
  }
}

/* ── Module-level store ───────────────────────────────────────── */

let state: Progress = EMPTY_PROGRESS;
let loaded = false;
const listeners = new Set<() => void>();

/** Games cleared in THIS tab session — powers the marathon badge. */
let sessionClears = new Set<GameId>();

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  state = readStorage();
  loaded = true;
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Over quota or storage denied — the session still works in memory.
  }
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
      window.localStorage.removeItem(STORAGE_KEY);
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

    /* Another tab wrote progress — reload and fan out so both stay level. */
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== STORAGE_KEY) return;
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
    resetProgress,
    isStudied,
  };
}
