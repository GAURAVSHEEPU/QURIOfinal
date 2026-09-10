'use client';

import Link from 'next/link';
import { ArrowRight, Gamepad2, User } from 'lucide-react';

import AtlasLogo from '../landing/AtlasLogo';
import AccountMenu from '../auth/AccountMenu';

/* ══════════════════════════════════════════════════════════════
   ATLAS NAV — the site header, shared by every page.
   Was duplicated inline in LandingPage and RoadmapPage; now that
   /qubit and /profile need it too it lives in one place.
   The current page renders as a static coral pill instead of a
   link, so it is both visually obvious and correct for a11y.
   ══════════════════════════════════════════════════════════════ */

export type NavPageId = 'home' | 'roadmap' | 'qubit' | 'circuit' | 'profile' | 'login';

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
  // { label: 'Get Started', hash: '#start' },
  { label: 'Atlas Entries', hash: '#entries' },
  
  { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
  { id: 'qubit', label: 'Qurio Qubit', href: '/qubit' },
  { label: 'Circuit Studio', id: 'circuit', href: '/circuit' },
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

        {/* Gap and link sizing live in .atlas-nav-cluster rather than inline,
            because they tighten on narrower laptops — the account chip was
            enough extra width to break this row in two at 1360px. */}
        <div className="atlas-nav-cluster">
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

          {/* On /login itself the account controls and the sign-up CTA are
              all pointing at the page you are already on, so the header
              drops back to plain navigation. */}
          {current !== 'login' && (
            <>
              <div
                style={{ width: 1, height: 24, background: 'rgba(34, 37, 42, 0.15)', margin: '0 8px' }}
              />

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

              {/* Signed out — and during prerender — this is the Sign In button. */}
              <AccountMenu />

              {current === 'qubit' ? (
                <Link href="/roadmap" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
                  Study a module <ArrowRight size={14} />
                </Link>
              ) : current === 'roadmap' ? (
                <Link href="/qubit" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
                  <Gamepad2 size={14} /> Play the games
                </Link>
              ) : (
                <Link href="/login#signup" className="btn-atlas-coral" style={{ padding: '9px 20px', fontSize: 14 }}>
                  Get Started Free <ArrowRight size={14} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
