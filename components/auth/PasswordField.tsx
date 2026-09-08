'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { type Strength, passwordStrength } from './passwords';

/* ══════════════════════════════════════════════════════════════
   PASSWORD FIELD — input, show/hide toggle, and (on sign-up) the
   strength ladder.

   The climber is positioned with a CSS transition on `bottom`
   rather than a spring, the same reasoning as .qubit-climber and
   .circuit-carrier: a spring in a tab that has stopped painting
   never settles, and this one must be standing on the right rung
   when the tab comes back.
   ══════════════════════════════════════════════════════════════ */

const LADDER_H = 76;
const CLIMBER = 30;
/** Rung heights the climber's feet land on, level 0 → 3. */
const RUNGS = [0, (LADDER_H - CLIMBER) / 3, ((LADDER_H - CLIMBER) * 2) / 3, LADDER_H - CLIMBER];

function StrengthMeter({ strength, empty }: { strength: Strength; empty: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 10 }}>
      {/* ── The ladder ── */}
      <div className="auth-ladder" style={{ height: LADDER_H }} aria-hidden="true">
        <span className="auth-ladder-rail" style={{ left: 3 }} />
        <span className="auth-ladder-rail" style={{ right: 3 }} />
        {RUNGS.map((_, i) => (
          <span key={i} className="auth-ladder-rung" style={{ bottom: 6 + i * ((LADDER_H - 14) / 3) }} />
        ))}
        <span className="auth-climber" style={{ bottom: RUNGS[strength.level] }}>
          <Stickman
            pose={strength.level === 0 ? 'stand' : 'climb'}
            size={CLIMBER}
            accent={strength.colour}
          />
        </span>
      </div>

      {/* ── The bar and its verdict ── */}
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className="auth-strength-seg"
              style={{
                background: strength.level >= step ? strength.colour : '#E2E6DF',
              }}
            />
          ))}
        </div>
        <p
          style={{
            margin: '7px 0 0',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: strength.colour,
          }}
          role="status"
          aria-live="polite"
        >
          {empty ? 'Waiting at the bottom' : strength.label}
        </p>
      </div>
    </div>
  );
}

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string | null;
  hint?: string;
  autoComplete?: string;
  /** Sign-up only — the ladder is noise on a sign-in form. */
  showStrength?: boolean;
  disabled?: boolean;
}

export default function PasswordField({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  hint,
  autoComplete = 'current-password',
  showStrength = false,
  disabled = false,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div>
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className="auth-field"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          style={{ paddingRight: 46 }}
        />
        <button
          type="button"
          className="auth-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showStrength && <StrengthMeter strength={passwordStrength(value)} empty={value.length === 0} />}

      {error && (
        <p className="auth-error" id={errorId}>
          {error}
        </p>
      )}
      {hint && (
        <p className="auth-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
