'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, User } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import { useAuth } from './authStore';

/* ══════════════════════════════════════════════════════════════
   ACCOUNT MENU — the nav's right-hand end.

   Replaces the home-only "Sign In" button and now renders on every
   page. Signed out — which is also what prerenders, since the
   server cannot read localStorage — it is that same ghost button,
   so the static HTML and the first client render agree.
   ══════════════════════════════════════════════════════════════ */

export default function AccountMenu() {
  const { account, hydrated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!hydrated || !account) {
    return (
      <Link href="/login" className="btn-atlas-ghost" style={{ padding: '8px 18px', fontSize: 14 }}>
        Sign In
      </Link>
    );
  }

  const firstName = account.name.trim().split(/\s+/)[0] || 'Explorer';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="auth-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ borderColor: open ? account.accent : '#E2E6DF' }}
      >
        <Stickman pose={account.pose} size={26} accent={account.accent} animated={false} />
        <span style={{ maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {firstName}
        </span>
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div className="auth-menu" role="menu">
          <div className="auth-menu-head">
            <Stickman pose={account.pose} size={34} accent={account.accent} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{account.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: '#5A6578',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {account.email}
              </div>
            </div>
          </div>

          <Link href="/profile" role="menuitem" className="auth-menu-item" onClick={() => setOpen(false)}>
            <User size={14} /> My Progress
          </Link>

          {/* No navigation here on purpose: on a public page you simply
              stay put and the chip flips back to Sign In, and on a gated
              one AuthGate does the bouncing. Racing it would be worse. */}
          <button
            type="button"
            role="menuitem"
            className="auth-menu-item"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
