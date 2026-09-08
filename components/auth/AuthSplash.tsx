'use client';

import RoadmapBackground from '../roadmap/RoadmapBackground';
import Stickman from '../roadmap/Stickman';

/* ══════════════════════════════════════════════════════════════
   AUTH SPLASH — what a gated route shows while it works out who
   you are.

   This is also what gets PRERENDERED for every gated page, which
   is the whole reason it exists: the server has no localStorage,
   so it cannot know you are signed in, and rendering the portal
   optimistically would flash real content at a signed-out visitor
   before the redirect landed.
   ══════════════════════════════════════════════════════════════ */

export interface AuthSplashProps {
  message?: string;
}

export default function AuthSplash({ message = 'Checking your pass…' }: AuthSplashProps) {
  return (
    <div
      style={{
        background: '#FAFAF8',
        color: '#22252A',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <RoadmapBackground />

      <div
        className="atlas-content-layer"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 28px',
        }}
      >
        <div style={{ textAlign: 'center' }} role="status" aria-live="polite">
          <Stickman pose="think" size={112} accent="#ED6A5A" label="" />
          <p
            style={{
              marginTop: 14,
              fontSize: 14.5,
              color: '#5A6578',
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
