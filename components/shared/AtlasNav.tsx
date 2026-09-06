'use client';

import Link from 'next/link';
import { ArrowRight, Gamepad2, User } from 'lucide-react';

import AtlasLogo from '../landing/AtlasLogo';

/* ══════════════════════════════════════════════════════════════
   ATLAS NAV — the site header, shared by every page.
   Was duplicated inline in LandingPage and RoadmapPage; now that
   /qubit and /profile need it too it lives in one place.
   The current page renders as a static coral pill instead of a
   link, so it is both visually obvious and correct for a11y.
   ══════════════════════════════════════════════════════════════ */

export type NavPageId = 'home' | 'roadmap' | 'qubit' | 'profile';

const CURRENT_PILL = {
  color: '#ED6A5A',
  background: 'rgba(237, 106, 90, 0.1)',
} as const;

interface Item {
  id?: NavPageId;
  label: string;
  /** Hash targets on the landing page; prefixed with `/` from elsewhere. */
  hash?: string;
  href?: string;
}

const ITEMS: Item[] = [
  { label: 'Get Started', hash: '#start' },
  { label: 'Atlas Entries', hash: '#entries' },
  { label: 'Interactives', hash: '#interactives' },
  { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
  { id: 'qubit', label: 'Qurio Qubit', href: '/qubit' },
  { label: 'Circuit Studio', href: '/circuit' },
  { label: 'AI Tutor', href: '/ai-tutor' },
];

export interface AtlasNavProps {
  /** Which page is being rendered — that entry becomes a static pill. */
  current?: NavPageId;
}

export default function AtlasNav({ current }: AtlasNavProps) {
  const onHome = current === 'home';

  return (
    <nav className="atlas-nav">
      <div
        style={{
          width: '100%',
          margin: '0 auto',
          padding: '0 28px 0 0',
          display: 'flex',
          alignItems: 'center',
          background: '#F6F5F0',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <AtlasLogo size={42} showText />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!onHome && (
            <Link href="/" className="atlas-nav-link">
              Home
            </Link>
          )}

          {ITEMS.map((item) => {
            if (item.id && item.id === current) {
              return (
                <span key={item.label} className="atlas-nav-link" aria-current="page" style={CURRENT_PILL}>
                  {item.label}
                </span>
              );
            }
            /* On the landing page the hash items are same-page anchors, so a
               plain <a> is right; from elsewhere they need the route prefix. */
            if (item.hash) {
              return onHome ? (
                <a key={item.label} href={item.hash} className="atlas-nav-link">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={`/${item.hash}`} className="atlas-nav-link">
                  {item.label}
                </Link>
              );
            }
            return (
              <Link key={item.label} href={item.href as string} className="atlas-nav-link">
                {item.label}
              </Link>
            );
          })}

          <div style={{ width: 1, height: 24, background: 'rgba(34, 37, 42, 0.15)', margin: '0 8px' }} />

          {current === 'profile' ? (
            <span
              className="atlas-nav-link"
              aria-current="page"
              style={{ ...CURRENT_PILL, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <User size={14} /> My Progress
            </span>
          ) : (
            <Link
              href="/profile"
              className="atlas-nav-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <User size={14} /> My Progress
            </Link>
          )}

          {onHome && (
            <Link href="/login" className="btn-atlas-ghost" style={{ padding: '8px 18px', fontSize: 14 }}>
              Sign In
            </Link>
          )}

          {current === 'qubit' ? (
            <Link href="/roadmap" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
              Study a module <ArrowRight size={14} />
            </Link>
          ) : current === 'roadmap' ? (
            <Link href="/qubit" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
              <Gamepad2 size={14} /> Play the games
            </Link>
          ) : (
            <Link href="/dashboard" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
              Get Started Free <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
