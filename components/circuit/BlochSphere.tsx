'use client';

import { CIRCUIT_ACCENT } from './circuitData';
import { blochLength, type BlochVector } from './simulator';

/* ══════════════════════════════════════════════════════════════
   BLOCH SPHERE

   A 2-D projection of one qubit's state, using the same skew the
   uploaded builder used (x → right, z → up, y → up-and-right into
   the page) so the ported spheres read the same way. The outline,
   equator and meridian are all sampled through `project` itself,
   so the wireframe and the state dot can never drift apart.

   A short arrow means the qubit is entangled: half a Bell pair
   has no state of its own, and the arrow shrinks to nothing at
   the centre. That is worth saying out loud, so the component
   does, rather than leaving a bare dot in the middle.
   ══════════════════════════════════════════════════════════════ */

const R = 100;

function project(v: BlochVector) {
  return { x: v.x * R + v.y * 38, y: -v.z * R - v.y * 18 };
}

/** Samples a great circle through the projection, as an SVG path. */
function ring(at: (t: number) => BlochVector, steps = 72): string {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = project(at((i / steps) * Math.PI * 2));
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }
  return `${d}Z`;
}

const EQUATOR = ring((t) => ({ x: Math.cos(t), y: Math.sin(t), z: 0 }));
/* The x–z great circle projects onto the silhouette exactly, so the
   useful second wire is the y–z one — it reads as depth. */
const MERIDIAN = ring((t) => ({ x: 0, y: Math.cos(t), z: Math.sin(t) }));

export interface BlochSphereProps {
  vector: BlochVector;
  qubit: number;
  size?: number;
}

export default function BlochSphere({ vector, qubit, size = 168 }: BlochSphereProps) {
  const tip = project(vector);
  const length = blochLength(vector);
  const mixed = length < 0.02;

  const state = mixed
    ? 'entangled — no state of its own'
    : vector.z > 0.98
      ? 'pointing at |0⟩'
      : vector.z < -0.98
        ? 'pointing at |1⟩'
        : 'in superposition';

  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg
        viewBox="-150 -150 300 300"
        width={size}
        height={size}
        role="img"
        aria-label={`Bloch sphere for qubit ${qubit}: x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(
          2
        )}, z ${vector.z.toFixed(2)} — ${state}`}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
      >
        <circle cx={0} cy={0} r={R} fill="#FBFCFA" stroke="#E2E6DF" strokeWidth={1.5} />
        <path d={EQUATOR} fill="none" stroke="#D9DEE4" strokeWidth={1} strokeDasharray="4 4" />
        <path d={MERIDIAN} fill="none" stroke="#EDF0EA" strokeWidth={1} />

        {/* Axes */}
        <line x1={0} y1={R} x2={0} y2={-R} stroke="#C9D1CC" strokeWidth={1} />
        <line x1={-R} y1={0} x2={R} y2={0} stroke="#C9D1CC" strokeWidth={1} />
        <line x1={-38} y1={18} x2={38} y2={-18} stroke="#EDF0EA" strokeWidth={1} />

        <text
          x={0}
          y={-R - 12}
          textAnchor="middle"
          fontSize={19}
          fontFamily="'JetBrains Mono', monospace"
          fill="#5A6578"
        >
          |0⟩
        </text>
        <text
          x={0}
          y={R + 27}
          textAnchor="middle"
          fontSize={19}
          fontFamily="'JetBrains Mono', monospace"
          fill="#5A6578"
        >
          |1⟩
        </text>
        <text x={R + 8} y={5} fontSize={15} fill="#B4BCC6" fontFamily="'JetBrains Mono', monospace">
          x
        </text>

        {/* The state itself */}
        {!mixed && (
          <line
            className="circuit-bloch-arm"
            x1={0}
            y1={0}
            x2={tip.x}
            y2={tip.y}
            stroke={CIRCUIT_ACCENT}
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}
        <circle
          className="circuit-bloch-tip"
          cx={mixed ? 0 : tip.x}
          cy={mixed ? 0 : tip.y}
          r={mixed ? 7 : 10}
          fill={mixed ? '#FFFFFF' : CIRCUIT_ACCENT}
          stroke={mixed ? '#B4BCC6' : '#FFFFFF'}
          strokeWidth={mixed ? 2.5 : 3}
          strokeDasharray={mixed ? '3 3' : undefined}
        />
      </svg>

      <figcaption style={{ marginTop: 2 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: '#22252A',
          }}
        >
          q{qubit}
        </div>
        <div style={{ fontSize: 11.5, color: '#5A6578', marginTop: 2 }}>{state}</div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#8A93A0',
            marginTop: 3,
          }}
        >
          x {vector.x.toFixed(2)} · y {vector.y.toFixed(2)} · z {vector.z.toFixed(2)}
        </div>
      </figcaption>
    </figure>
  );
}
