'use client';

import type { CSSProperties } from 'react';

/* ══════════════════════════════════════════════════════════════
   STICKMAN — the roadmap's guide characters, and the playing
   pieces for the Qurio Qubit games.
   One inline SVG figure, thirteen poses, limbs animated by the CSS
   keyframes appended to app/globals.css (`sm-*`).
   ══════════════════════════════════════════════════════════════ */

export type StickmanPose =
  | 'wave'
  | 'read'
  | 'stand'
  | 'walk'
  | 'point'
  | 'celebrate'
  | 'think'
  | 'juggle'
  | 'teach'
  | 'climb'
  /* Added for the Qurio Qubit games (/qubit). */
  | 'balance'
  | 'signal'
  | 'fall';

const INK = '#22252A';

/* Limb polylines: shoulder/hip → elbow/knee → hand/foot. */
const ARM_DOWN_L = '32,32 25,44 21,54';
const ARM_DOWN_R = '32,32 39,44 43,54';
const ARM_UP_L = '32,32 22,24 16,12';
const ARM_UP_R = '32,32 42,24 48,12';
const ARM_FWD_L = '32,32 26,44 34,51';
const ARM_FWD_R = '32,32 38,44 30,51';
const ARM_OUT_R = '32,33 44,33 55,30';
const ARM_OUT_L = '32,33 20,33 9,30';
const ARM_CHIN_L = '32,32 23,42 29,27';
const ARM_REACH_R = '32,32 43,22 50,9';
const ARM_REACH_L = '32,32 24,23 19,11';
const ARM_FLAIL_L = '32,32 20,26 13,14';
const ARM_FLAIL_R = '32,32 44,27 52,16';

const LEG_STAND_L = '32,58 27,74 25,90';
const LEG_STAND_R = '32,58 37,74 39,90';
const LEG_STRIDE_L = '32,58 24,72 18,88';
const LEG_STRIDE_R = '32,58 40,73 46,89';
const LEG_BENT_L = '32,58 24,70 28,86';
const LEG_BENT_R = '32,58 41,70 44,86';
/* Feet together — the balance pose needs a single point of contact. */
const LEG_TIGHT_L = '32,58 30,74 29,90';
const LEG_TIGHT_R = '32,58 34,74 35,90';

interface LimbSpec {
  points: string;
  /** CSS class carrying the keyframe animation, if any. */
  anim?: string;
}

interface PoseSpec {
  armL: LimbSpec;
  armR: LimbSpec;
  legL: LimbSpec;
  legR: LimbSpec;
  headAnim?: string;
  figureAnim?: string;
  /** Static transform on the whole figure — survives reduced motion. */
  figureTransform?: string;
}

const POSES: Record<StickmanPose, PoseSpec> = {
  wave: {
    armL: { points: ARM_DOWN_L },
    armR: { points: ARM_UP_R, anim: 'sm-wave' },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
    headAnim: 'sm-bob',
  },
  read: {
    armL: { points: ARM_FWD_L },
    armR: { points: ARM_FWD_R },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
    headAnim: 'sm-read-nod',
  },
  /* Resting pose — the scroll walker falls back to this when the page
     stops moving, and `striding` swaps it for the walk cycle. */
  stand: {
    armL: { points: ARM_DOWN_L },
    armR: { points: ARM_DOWN_R },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
    headAnim: 'sm-bob',
  },
  walk: {
    armL: { points: ARM_DOWN_L, anim: 'sm-swing-a' },
    armR: { points: ARM_DOWN_R, anim: 'sm-swing-b' },
    legL: { points: LEG_STRIDE_L, anim: 'sm-stride-a' },
    legR: { points: LEG_STRIDE_R, anim: 'sm-stride-b' },
  },
  point: {
    armL: { points: ARM_DOWN_L },
    armR: { points: ARM_OUT_R, anim: 'sm-point' },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
  },
  celebrate: {
    armL: { points: ARM_UP_L },
    armR: { points: ARM_UP_R },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
    figureAnim: 'sm-hop',
  },
  think: {
    armL: { points: ARM_CHIN_L },
    armR: { points: ARM_DOWN_R },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
    headAnim: 'sm-tilt',
  },
  juggle: {
    armL: { points: ARM_UP_L, anim: 'sm-swing-a' },
    armR: { points: ARM_UP_R, anim: 'sm-swing-b' },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
  },
  teach: {
    armL: { points: ARM_DOWN_L },
    armR: { points: ARM_OUT_R, anim: 'sm-point' },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
  },
  climb: {
    armL: { points: ARM_REACH_L, anim: 'sm-reach-a' },
    armR: { points: ARM_REACH_R, anim: 'sm-reach-b' },
    legL: { points: LEG_BENT_L },
    legR: { points: LEG_BENT_R },
  },
  /* Arms wide, feet together — steady only while the beam is level. */
  balance: {
    armL: { points: ARM_OUT_L },
    armR: { points: ARM_OUT_R },
    legL: { points: LEG_TIGHT_L },
    legR: { points: LEG_TIGHT_R },
    figureAnim: 'sm-teeter',
  },
  /* Semaphore: two flags, one high one low, for relaying classical bits. */
  signal: {
    armL: { points: ARM_DOWN_L, anim: 'sm-semaphore-b' },
    armR: { points: ARM_REACH_R, anim: 'sm-semaphore-a' },
    legL: { points: LEG_STAND_L },
    legR: { points: LEG_STAND_R },
  },
  /* Tipped over. The rotation is static so it still reads as a fall
     when animation is off; only the dizzy head is animated. */
  fall: {
    armL: { points: ARM_FLAIL_L },
    armR: { points: ARM_FLAIL_R },
    legL: { points: LEG_BENT_L },
    legR: { points: LEG_STRIDE_R },
    headAnim: 'sm-dizzy',
    figureTransform: 'rotate(-24deg)',
  },
};

export interface StickmanProps {
  pose?: StickmanPose;
  /** Rendered height in px; width follows the 64:104 viewBox. */
  size?: number;
  accent?: string;
  /** false freezes every limb — used for reduced-motion and static teasers. */
  animated?: boolean;
  /** Forces the walk cycle on, independent of pose. Used by the scroll walker. */
  striding?: boolean;
  /** Mirrors the figure horizontally. */
  flip?: boolean;
  /** Supplying a label makes the figure meaningful to assistive tech. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Stickman({
  pose = 'wave',
  size = 96,
  accent = '#ED6A5A',
  animated = true,
  striding = false,
  flip = false,
  label,
  className,
  style,
}: StickmanProps) {
  const spec = POSES[pose];
  const width = (size * 64) / 104;

  // The walk cycle can be forced on by the scroll walker regardless of pose.
  const walkSpec = POSES.walk;
  const armL = striding ? walkSpec.armL : spec.armL;
  const armR = striding ? walkSpec.armR : spec.armR;
  const legL = striding ? walkSpec.legL : spec.legL;
  const legR = striding ? walkSpec.legR : spec.legR;

  const cls = (anim?: string) => (animated && anim ? anim : undefined);

  const stroke = {
    stroke: INK,
    strokeWidth: 3.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox="0 0 64 104"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        overflow: 'visible',
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
    >
      <g
        className={cls(spec.figureAnim)}
        style={{ transformOrigin: '32px 92px', transform: spec.figureTransform }}
      >
        {/* ── Pose props that sit behind the figure ── */}
        {pose === 'teach' && (
          <g>
            <rect
              x="46"
              y="8"
              width="34"
              height="26"
              rx="2.5"
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth="2.4"
            />
            <text
              x="63"
              y="25"
              textAnchor="middle"
              fontSize="11"
              fontFamily="'JetBrains Mono', monospace"
              fill={accent}
              fontWeight="700"
            >
              |Φ⁺⟩
            </text>
          </g>
        )}

        {pose === 'juggle' && (
          <g>
            <circle
              className={cls('sm-orbit-a')}
              style={{ transformOrigin: '32px 20px' }}
              cx="16"
              cy="10"
              r="4.5"
              fill={accent}
            />
            <circle
              className={cls('sm-orbit-b')}
              style={{ transformOrigin: '32px 20px' }}
              cx="48"
              cy="10"
              r="4.5"
              fill="#0081A7"
            />
          </g>
        )}

        {pose === 'think' && (
          <g className={cls('sm-flicker')} style={{ transformOrigin: '50px 12px' }}>
            <circle cx="50" cy="12" r="7" fill="#FEF3C7" stroke={INK} strokeWidth="2.2" />
            <path d="M47,19 L53,19" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <path
              d="M50,4 L50,1 M58,12 L61,12 M56,6 L58,4"
              stroke={accent}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ── Legs ── */}
        <polyline
          {...stroke}
          className={cls(legL.anim)}
          style={{ transformOrigin: '32px 58px' }}
          points={legL.points}
        />
        <polyline
          {...stroke}
          className={cls(legR.anim)}
          style={{ transformOrigin: '32px 58px' }}
          points={legR.points}
        />

        {/* ── Torso ── */}
        <line {...stroke} x1="32" y1="26" x2="32" y2="58" />

        {/* ── Arms ── */}
        <polyline
          {...stroke}
          className={cls(armL.anim)}
          style={{ transformOrigin: '32px 32px' }}
          points={armL.points}
        />
        <polyline
          {...stroke}
          className={cls(armR.anim)}
          style={{ transformOrigin: '32px 32px' }}
          points={armR.points}
        />

        {/* ── Head ── */}
        <g className={cls(spec.headAnim)} style={{ transformOrigin: '32px 26px' }}>
          <circle cx="32" cy="16" r="9.5" fill="#FAFAF8" stroke={INK} strokeWidth="3.2" />
          {/* A single accent dot keeps the figure abstract but alive. */}
          <circle cx="32" cy="16" r="2.6" fill={accent} />
        </g>

        {/* ── Pose props that sit in front of the figure ── */}
        {pose === 'read' && (
          <g>
            <rect
              x="19"
              y="44"
              width="26"
              height="18"
              rx="2"
              fill="#E6EBE0"
              stroke={INK}
              strokeWidth="2.4"
            />
            <line x1="32" y1="44" x2="32" y2="62" stroke={INK} strokeWidth="2.2" />
            <line x1="23" y1="50" x2="29" y2="50" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="35" y1="50" x2="41" y2="50" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="23" y1="55" x2="29" y2="55" stroke="#9BC1BC" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="35" y1="55" x2="41" y2="55" stroke="#9BC1BC" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}

        {pose === 'celebrate' && (
          <g>
            <line x1="48" y1="12" x2="48" y2="-8" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
            <path
              className={cls('sm-flag')}
              style={{ transformOrigin: '48px -6px' }}
              d="M48,-8 L70,-3 L48,4 Z"
              fill={accent}
              stroke={accent}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Semaphore flags, pinned to the two hand positions of `signal`. */}
        {pose === 'signal' && (
          <g>
            <g className={cls('sm-semaphore-a')} style={{ transformOrigin: '32px 32px' }}>
              <path
                d="M50,9 L50,-7 L64,-1 L50,4 Z"
                fill={accent}
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
            <g className={cls('sm-semaphore-b')} style={{ transformOrigin: '32px 32px' }}>
              <path
                d="M21,54 L21,38 L7,44 L21,49 Z"
                fill="#9BC1BC"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
