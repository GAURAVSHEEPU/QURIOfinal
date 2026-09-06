'use client';

/* ══════════════════════════════════════════════════════════════
   ROADMAP BACKGROUND
   A fixed, pointer-transparent animated backdrop built purely
   from SVG + CSS. Deliberately not WebGL: the landing page
   already runs a Three.js scene (QuantumBackground3D), and a
   second GL context underneath a long scroll-driven page is not
   a good trade. All animation is transform/opacity only.

   Positions are hard-coded rather than randomised so that the
   server and client markup match exactly (no hydration drift).
   ══════════════════════════════════════════════════════════════ */

interface Floater {
  left: string;
  top: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const FLOATERS: Floater[] = [
  { left: '6%', top: '14%', size: 10, color: '#ED6A5A', duration: 19, delay: 0 },
  { left: '17%', top: '68%', size: 6, color: '#0081A7', duration: 24, delay: -3 },
  { left: '27%', top: '32%', size: 14, color: '#9BC1BC', duration: 17, delay: -7 },
  { left: '38%', top: '82%', size: 8, color: '#ED6A5A', duration: 22, delay: -11 },
  { left: '46%', top: '9%', size: 7, color: '#0081A7', duration: 26, delay: -5 },
  { left: '55%', top: '55%', size: 12, color: '#9BC1BC', duration: 20, delay: -14 },
  { left: '63%', top: '24%', size: 6, color: '#ED6A5A', duration: 28, delay: -2 },
  { left: '71%', top: '76%', size: 11, color: '#0081A7', duration: 18, delay: -9 },
  { left: '79%', top: '41%', size: 8, color: '#9BC1BC', duration: 23, delay: -16 },
  { left: '86%', top: '12%', size: 13, color: '#ED6A5A', duration: 21, delay: -6 },
  { left: '92%', top: '61%', size: 7, color: '#0081A7', duration: 25, delay: -12 },
  { left: '11%', top: '45%', size: 9, color: '#9BC1BC', duration: 27, delay: -19 },
  { left: '33%', top: '58%', size: 5, color: '#ED6A5A', duration: 30, delay: -8 },
  { left: '68%', top: '92%', size: 9, color: '#9BC1BC', duration: 16, delay: -4 },
];

export default function RoadmapBackground() {
  return (
    <div className="roadmap-bg" aria-hidden="true">
      {/* ── Layer 1: drifting dot lattice ── */}
      <div className="roadmap-bg-grid" />

      {/* ── Layer 2: floating qubits ── */}
      <div className="roadmap-bg-floaters">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="roadmap-bg-floater"
            style={{
              left: f.left,
              top: f.top,
              width: f.size,
              height: f.size,
              background: f.color,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 3: interference wavefronts ── */}
      <svg
        className="roadmap-bg-waves"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        focusable="false"
      >
        <g className="roadmap-bg-wave roadmap-bg-wave-a">
          <path
            d="M-720,210 Q-630,120 -540,210 T-360,210 T-180,210 T0,210 T180,210 T360,210 T540,210 T720,210 T900,210 T1080,210 T1260,210 T1440,210 T1620,210 T1800,210 T1980,210 T2160,210"
            fill="none"
            stroke="#0081A7"
            strokeWidth="2"
          />
        </g>
        <g className="roadmap-bg-wave roadmap-bg-wave-b">
          <path
            d="M-720,240 Q-600,330 -480,240 T-240,240 T0,240 T240,240 T480,240 T720,240 T960,240 T1200,240 T1440,240 T1680,240 T1920,240 T2160,240"
            fill="none"
            stroke="#ED6A5A"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* ── Layer 4: counter-rotating orbital rings ── */}
      <svg className="roadmap-bg-orbits" viewBox="0 0 400 400" focusable="false">
        <g className="roadmap-bg-orbit roadmap-bg-orbit-a">
          <ellipse
            cx="200"
            cy="200"
            rx="170"
            ry="64"
            fill="none"
            stroke="#22252A"
            strokeWidth="1.2"
            strokeDasharray="6 8"
          />
        </g>
        <g className="roadmap-bg-orbit roadmap-bg-orbit-b">
          <ellipse
            cx="200"
            cy="200"
            rx="140"
            ry="140"
            fill="none"
            stroke="#9BC1BC"
            strokeWidth="1.4"
            strokeDasharray="4 10"
          />
        </g>
        <g className="roadmap-bg-orbit roadmap-bg-orbit-c">
          <ellipse
            cx="200"
            cy="200"
            rx="64"
            ry="170"
            fill="none"
            stroke="#ED6A5A"
            strokeWidth="1.2"
            strokeDasharray="8 6"
          />
        </g>
      </svg>
    </div>
  );
}
