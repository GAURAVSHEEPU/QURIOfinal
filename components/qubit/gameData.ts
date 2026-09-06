import {
  Activity,
  Crown,
  EyeOff,
  Footprints,
  GraduationCap,
  Link2,
  Mountain,
  Radio,
  Scale,
  Sigma,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { StickmanPose } from '../roadmap/Stickman';
import type { GameId, Progress } from './progressStore';

/* ══════════════════════════════════════════════════════════════
   QURIO QUBIT — content layer.

   One game per Base Camp milestone (b1–b6, see roadmapData.ts).
   Nothing here renders; the games themselves live in ./games and
   the portal reads this file to build its cards, locks and badges.

   Type-only imports from ./progressStore keep this a leaf at
   runtime — progressStore imports BADGES from here, so a value
   import in the other direction would be a cycle.
   ══════════════════════════════════════════════════════════════ */

export interface GameSpec {
  id: GameId;
  /** The Base Camp milestone that must be studied first. */
  milestoneId: string;
  /** 1-based, matches the milestone's position in the track. */
  order: number;
  title: string;
  kicker: string;
  blurb: string;
  teaches: string[];
  rounds: number;
  maxScore: number;
  /** How the card's mascot stands. */
  pose: StickmanPose;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
}

export const GAMES: GameSpec[] = [
  {
    id: 'g-beam',
    milestoneId: 'b1',
    order: 1,
    title: 'Balance Beam',
    kicker: 'Normalisation',
    blurb:
      'A stickman balances on a beam that only sits level when the amplitudes are normalised. Pick the β that makes |α|² + |β|² land exactly on 1.',
    teaches: ['Modulus of a complex number', 'Why |α|² + |β|² = 1', 'Reading amplitudes'],
    rounds: 6,
    maxScore: 6,
    pose: 'stand',
    icon: Scale,
    accent: '#0081A7',
    accentSoft: '#E6F4F8',
  },
  {
    id: 'g-collapse',
    milestoneId: 'b2',
    order: 2,
    title: 'Collapse Catcher',
    kicker: 'Measurement',
    blurb:
      'Predict how many of 100 shots collapse to |0⟩, then watch a hundred tiny stickmen pour through the doors and stack into your histogram.',
    teaches: ['Amplitudes vs probabilities', 'Measurement collapse', 'Phase is invisible here'],
    rounds: 5,
    maxScore: 5,
    pose: 'think',
    icon: Sigma,
    accent: '#ED6A5A',
    accentSoft: '#FDECE9',
  },
  {
    id: 'g-hopscotch',
    milestoneId: 'b3',
    order: 3,
    title: 'Gate Hopscotch',
    kicker: 'Single-qubit gates',
    blurb:
      'Six pads, one stickman, four gate cards. Every gate you play makes him hop to a different state — reach the target pad in as few hops as par.',
    teaches: ['What X, Z, H and S do', 'Composing gates', 'The six cardinal states'],
    rounds: 6,
    maxScore: 6,
    pose: 'walk',
    icon: Footprints,
    accent: '#76A09B',
    accentSoft: '#EBF1ED',
  },
  {
    id: 'g-twins',
    milestoneId: 'b4',
    order: 4,
    title: 'Twin Sync',
    kicker: 'Entanglement',
    blurb:
      'Two stickmen, two wires. Build each Bell state and watch the twins fall into sync — then measure one and see the other snap to match.',
    teaches: ['Tensor products', 'CNOT and control', 'The four Bell states'],
    rounds: 5,
    maxScore: 5,
    pose: 'juggle',
    icon: Users,
    accent: '#3F5185',
    accentSoft: '#EAEDF6',
  },
  {
    id: 'g-noise',
    milestoneId: 'b5',
    order: 5,
    title: 'Shot Noise',
    kicker: 'Real hardware',
    blurb:
      'Predict the ideal histogram, run it on "hardware", then diagnose the gap. Was that statistics, decoherence, or a bug in your circuit?',
    teaches: ['Reading histograms', 'Shot noise vs hardware error', 'Debugging a circuit'],
    rounds: 5,
    maxScore: 10,
    pose: 'teach',
    icon: Activity,
    accent: '#D97706',
    accentSoft: '#FEF3C7',
  },
  {
    id: 'g-relay',
    milestoneId: 'b6',
    order: 6,
    title: 'Relay Station',
    kicker: 'Protocols',
    blurb:
      'Alice signals her measurement by semaphore — pick Bob\'s correction. Then run BB84, sift the key, and catch an eavesdropper by her error rate.',
    teaches: ['Teleportation corrections', 'The classical channel', 'BB84 and detecting Eve'],
    rounds: 7,
    maxScore: 7,
    pose: 'signal',
    icon: Radio,
    accent: '#00607D',
    accentSoft: '#E6F4F8',
  },
];

export const GAME_BY_ID: Record<GameId, GameSpec> = GAMES.reduce(
  (acc, g) => ({ ...acc, [g.id]: g }),
  {} as Record<GameId, GameSpec>
);

/** Base Camp milestone id → its game, for the roadmap's "Play" link. */
export const GAME_BY_MILESTONE: Record<string, GameSpec> = GAMES.reduce(
  (acc, g) => ({ ...acc, [g.milestoneId]: g }),
  {} as Record<string, GameSpec>
);

export const BASE_CAMP_MILESTONES = GAMES.map((g) => g.milestoneId);

/* ── Flags games can raise ────────────────────────────────────── */

export const FLAG_BELL_BUILT = 'bell-built';
export const FLAG_EXACT_PREDICTION = 'exact-prediction';

/** Number of Gate Hopscotch puzzles — one flag per puzzle solved at par. */
export const HOPSCOTCH_PUZZLES = 6;

/**
 * Par is flagged per puzzle rather than per run, so the badge accumulates
 * across attempts. A learner who nails four puzzles today and the last two
 * tomorrow still earns it — which is the point of a teaching game.
 */
export const hopscotchParFlag = (puzzleIndex: number) => `hopscotch-par-${puzzleIndex}`;

/* ── Badges ───────────────────────────────────────────────────── */

export interface BadgeCtx {
  /** Games cleared in this tab session, for the marathon badge. */
  sessionClears: number;
}

export interface BadgeSpec {
  id: string;
  name: string;
  /** Shown on the unearned silhouette — always tells you how to get it. */
  hint: string;
  icon: LucideIcon;
  /** Per-game badges wear the tier ring from that game's record. */
  gameId?: GameId;
  test: (p: Progress, ctx: BadgeCtx) => boolean;
}

const cleared = (p: Progress, id: GameId) => p.games[id]?.tier != null;

/* One badge per game, tiered by the best run — the tier ring is read
   live from the game record, so a bronze upgrades to gold in place. */
const GAME_BADGES: BadgeSpec[] = GAMES.map((g) => ({
  id: `bc-${g.id.replace(/^g-/, '')}`,
  name: g.title,
  hint: `Clear ${g.title} — half marks for bronze, 75% for silver, a clean sweep for gold.`,
  icon: g.icon,
  gameId: g.id,
  test: (p) => cleared(p, g.id),
}));

const META_BADGES: BadgeSpec[] = [
  {
    id: 'bc-summit',
    name: 'Base Camp Summit',
    hint: 'Clear all six Base Camp games.',
    icon: Mountain,
    test: (p) => GAMES.every((g) => cleared(p, g.id)),
  },
  {
    id: 'bc-flawless',
    name: 'Flawless Ascent',
    hint: 'Take gold in all six games.',
    icon: Crown,
    test: (p) => GAMES.every((g) => p.games[g.id]?.tier === 'gold'),
  },
  {
    id: 'bc-scholar',
    name: 'Diligent Scholar',
    hint: 'Mark all six Base Camp modules studied on the roadmap.',
    icon: GraduationCap,
    test: (p) => BASE_CAMP_MILESTONES.every((id) => p.studied.includes(id)),
  },
  {
    id: 'bc-entangled',
    name: 'First Entanglement',
    hint: 'Build a Bell state in Twin Sync.',
    icon: Link2,
    test: (p) => p.flags.includes(FLAG_BELL_BUILT),
  },
  {
    id: 'bc-nohints',
    name: 'Unaided',
    hint: 'Clear any game without opening a single hint.',
    icon: EyeOff,
    test: (p) => GAMES.some((g) => p.games[g.id]?.noHint === true),
  },
  {
    id: 'bc-par',
    name: 'Par for the Course',
    hint: 'Solve every Gate Hopscotch puzzle in par hops or fewer.',
    icon: Footprints,
    test: (p) =>
      Array.from({ length: HOPSCOTCH_PUZZLES }, (_, i) => hopscotchParFlag(i)).every((f) =>
        p.flags.includes(f)
      ),
  },
  {
    id: 'bc-statistician',
    name: 'Statistician',
    hint: 'Call a Collapse Catcher round exactly right.',
    icon: Target,
    test: (p) => p.flags.includes(FLAG_EXACT_PREDICTION),
  },
  {
    id: 'bc-marathon',
    name: 'One Sitting',
    hint: 'Clear three games without leaving the page.',
    icon: Zap,
    test: (_p, ctx) => ctx.sessionClears >= 3,
  },
];

export const BADGES: BadgeSpec[] = [...GAME_BADGES, ...META_BADGES];

export const BADGE_BY_ID: Record<string, BadgeSpec> = BADGES.reduce(
  (acc, b) => ({ ...acc, [b.id]: b }),
  {} as Record<string, BadgeSpec>
);
