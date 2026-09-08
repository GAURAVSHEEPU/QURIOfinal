/* ══════════════════════════════════════════════════════════════
   PASSWORDS — Web Crypto, and nothing else.

   Accounts on this site live in the learner's own browser (see the
   header of authStore.ts). Storing a password in plaintext there
   would be indefensible even so: people reuse passwords, and the
   one they type here is very likely the one guarding something
   that matters. So it is put through PBKDF2 before it is written,
   and the plaintext never leaves the submit handler.

   Be clear-eyed about what that buys. Hashing protects the
   password. It does NOT protect the account: anyone who can open
   devtools on this machine can rewrite qurio.users.v1 however they
   like. /profile says so in as many words.

   SECURE CONTEXT: crypto.subtle only exists in one — https,
   localhost or 127.0.0.1. Open the dev server over a LAN IP
   (http://192.168.x.x:3000) and it is undefined. Callers must ask
   cryptoReady() first and show a message rather than throwing.
   ══════════════════════════════════════════════════════════════ */

/** OWASP's 2023 floor for PBKDF2-HMAC-SHA256. Costs ~0.3s in-browser. */
export const PBKDF2_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const KEY_BITS = 256;

export interface Credential {
  /** base64 */
  salt: string;
  iterations: number;
  /** base64 */
  hash: string;
}

/** True when crypto.subtle is actually available to us. */
export function cryptoReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    typeof window.crypto?.subtle?.deriveBits === 'function'
  );
}

/** The one message every caller shows when cryptoReady() is false. */
export const INSECURE_CONTEXT_MESSAGE =
  'Accounts need a secure connection. Open the site over localhost or https and try again.';

/* ── base64 ───────────────────────────────────────────────────── */

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ── Ids ──────────────────────────────────────────────────────── */

/**
 * randomUUID is secure-context-only too, so it gets the same
 * fallback treatment — an id is not a secret, it only has to be
 * unique, and getRandomValues is available far more widely.
 */
export function newId(): string {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto?.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/* ── Hashing ──────────────────────────────────────────────────── */

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/** Hashes a new password with a fresh salt. Throws if the context is insecure. */
export async function hashPassword(
  password: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<Credential> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, iterations);
  return { salt: toBase64(salt), iterations, hash: toBase64(hash) };
}

/**
 * Re-derives with the stored salt and iteration count — so a record
 * written under an older cost setting still verifies.
 */
export async function verifyPassword(password: string, cred: Credential): Promise<boolean> {
  let expected: Uint8Array;
  try {
    expected = fromBase64(cred.hash);
  } catch {
    return false; // hand-edited or truncated record
  }
  const actual = await derive(password, fromBase64(cred.salt), cred.iterations);
  return timingSafeEqual(actual, expected);
}

/* Fixed-length compare. The window here is tiny and local, but
   short-circuiting on the first differing byte is a habit worth
   not forming. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ── Strength ─────────────────────────────────────────────────── */

export const MIN_PASSWORD_LENGTH = 8;

export type StrengthLevel = 0 | 1 | 2 | 3;

export interface Strength {
  level: StrengthLevel;
  label: string;
  colour: string;
}

const STRENGTH: Record<StrengthLevel, Omit<Strength, 'level'>> = {
  0: { label: 'Too short', colour: '#C6CCD4' },
  1: { label: 'Weak', colour: '#ED6A5A' },
  2: { label: 'Good', colour: '#D9A521' },
  3: { label: 'Strong', colour: '#0081A7' },
};

/**
 * Deliberately coarse — four rungs for the climber to stand on.
 * Length carries most of the weight because it genuinely does.
 */
export function passwordStrength(password: string): Strength {
  if (password.length < MIN_PASSWORD_LENGTH) return { level: 0, ...STRENGTH[0] };

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level: StrengthLevel = score >= 4 ? 3 : score >= 2 ? 2 : 1;
  return { level, ...STRENGTH[level] };
}
