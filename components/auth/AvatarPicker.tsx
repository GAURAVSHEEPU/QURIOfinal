'use client';

import Stickman, { type StickmanPose } from '../roadmap/Stickman';

/* ══════════════════════════════════════════════════════════════
   AVATAR PICKER — colour and pose for the learner's stickman.

   This figure is the account: it heads /profile, it sits in the
   nav chip, and it is what turns a filled-in form into somebody.
   Five Atlas accents, three poses, live preview.

   Used twice — on sign-up and again in the /profile account card —
   so it is fully controlled and holds no state of its own.
   ══════════════════════════════════════════════════════════════ */

export interface AccentOption {
  value: string;
  label: string;
}

export const ACCENTS: AccentOption[] = [
  { value: '#ED6A5A', label: 'Coral' },
  { value: '#0081A7', label: 'Cyan' },
  { value: '#9BC1BC', label: 'Mint' },
  { value: '#D9A521', label: 'Amber' },
  { value: '#7C6BB0', label: 'Violet' },
];

export const AVATAR_POSES: { value: StickmanPose; label: string }[] = [
  { value: 'wave', label: 'Waving' },
  { value: 'read', label: 'Reading' },
  { value: 'climb', label: 'Climbing' },
];

export interface AvatarPickerProps {
  accent: string;
  pose: StickmanPose;
  onAccentChange: (accent: string) => void;
  onPoseChange: (pose: StickmanPose) => void;
  /** Smaller preview, for the /profile account card. */
  compact?: boolean;
  disabled?: boolean;
}

export default function AvatarPicker({
  accent,
  pose,
  onAccentChange,
  onPoseChange,
  compact = false,
  disabled = false,
}: AvatarPickerProps) {
  const previewSize = compact ? 72 : 96;

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      <div className="auth-avatar-stage" style={{ minHeight: previewSize + 22 }}>
        <Stickman
          key={`${accent}-${pose}`}
          pose={pose}
          size={previewSize}
          accent={accent}
          label="Your stickman"
        />
      </div>

      <div style={{ flex: 1, minWidth: 190 }}>
        <p className="auth-label" id="avatar-colour-label" style={{ marginBottom: 8 }}>
          Colour
        </p>
        <div role="radiogroup" aria-labelledby="avatar-colour-label" style={{ display: 'flex', gap: 8 }}>
          {ACCENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={accent === option.value}
              aria-label={option.label}
              disabled={disabled}
              onClick={() => onAccentChange(option.value)}
              className="auth-swatch"
              style={{
                background: option.value,
                boxShadow:
                  accent === option.value
                    ? `0 0 0 2px #FAFAF8, 0 0 0 4px ${option.value}`
                    : 'none',
              }}
            />
          ))}
        </div>

        <p className="auth-label" id="avatar-pose-label" style={{ margin: '16px 0 8px' }}>
          Pose
        </p>
        <div
          role="radiogroup"
          aria-labelledby="avatar-pose-label"
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          {AVATAR_POSES.map((option) => {
            const active = pose === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onPoseChange(option.value)}
                className="auth-chip"
                style={{
                  background: active ? accent : '#FFFFFF',
                  borderColor: active ? accent : '#E2E6DF',
                  color: active ? '#FFFFFF' : '#5A6578',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
