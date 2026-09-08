'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import AuthSplash from './AuthSplash';
import { NEXT_KEY, useAuth } from './authStore';

/* ══════════════════════════════════════════════════════════════
   AUTH GATE — the lock on the portal.

   Wrapped around the page component inside each of the four
   gated route files under app/, one line apiece. Those pages stay
   server components exporting metadata, and stay ○ (Static).

   The gate is deliberately client-side: there is no server to ask
   who you are, and the whole site is prerendered. So the splash —
   not the page — is what ships in the static HTML, and the real
   answer arrives when the store hydrates. That ordering is what
   stops a signed-out visitor seeing a frame of someone's portal.

   WHERE YOU WERE GOING is parked in sessionStorage rather than a
   query string: useSearchParams would force /login out of static
   rendering unless wrapped in Suspense, and the roadmap page hit
   exactly that wall already.
   ══════════════════════════════════════════════════════════════ */

export interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { account, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const locked = hydrated && !account;

  useEffect(() => {
    if (!locked) return;
    try {
      /* Remember the destination so sign-in returns you here rather
         than dumping everyone on /profile. */
      window.sessionStorage.setItem(NEXT_KEY, pathname);
    } catch {
      /* Private mode — you will just land on /profile instead. */
    }
    router.replace('/login');
  }, [locked, pathname, router]);

  if (!hydrated) return <AuthSplash />;
  if (!account) return <AuthSplash message="Taking you to sign-in…" />;

  return <>{children}</>;
}
