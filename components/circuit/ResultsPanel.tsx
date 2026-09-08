'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Play, RotateCcw, RefreshCw, Cpu, MonitorSmartphone } from 'lucide-react';

import Stickman from '../roadmap/Stickman';
import BlochSphere from './BlochSphere';
import { CIRCUIT_ACCENT, CIRCUIT_SOFT, CIRCUIT_INK, SECTIONS, type SectionId } from './circuitData';
import type { BackendStatus } from './engine';
import {
  NUM_QUBITS,
  SHOTS,
  agreement,
  blochVector,
  marginalOne,
  type SimResult,
} from './simulator';

/* ══════════════════════════════════════════════════════════════
   RESULTS

   The uploaded builder showed a single probability column derived
   from counts/1024. This shows two: `sampled` (what 1,024 shots
   returned) beside `exact` (|amp|²). They differ by shot noise —
   which is the whole point of /qubit's Shot Noise game — and the
   exact column is identical whichever engine ran the circuit, so
   it is also how you can tell the two engines agree.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;
const QUBITS = Array.from({ length: NUM_QUBITS }, (_, i) => i);

export interface ResultsPanelProps {
  result: SimResult | null;
  running: boolean;
  hasGates: boolean;
  status: BackendStatus;
  openSection: SectionId | null;
  onToggleSection: (id: SectionId) => void;
  onRun: () => void;
  onReset: () => void;
  onRecheck: () => void;
}

export default function ResultsPanel({
  result,
  running,
  hasGates,
  status,
  openSection,
  onToggleSection,
  onRun,
  onReset,
  onRecheck,
}: ResultsPanelProps) {
  const qiskit = result?.engine === 'qiskit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-atlas-coral"
          onClick={onRun}
          disabled={running}
          style={{
            flex: '1 1 150px',
            justifyContent: 'center',
            padding: '11px 18px',
            fontSize: 14,
            background: CIRCUIT_ACCENT,
            opacity: running ? 0.65 : 1,
            cursor: running ? 'progress' : 'pointer',
          }}
        >
          <Play size={14} /> {running ? 'Running…' : 'Run circuit'}
        </button>
        <button
          type="button"
          className="btn-atlas-ghost"
          onClick={onReset}
          disabled={running}
          style={{ padding: '11px 16px', fontSize: 14 }}
        >
          <RotateCcw size={14} /> Clear
        </button>
      </div>

      {/* ── Which engine answered ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: qiskit ? CIRCUIT_SOFT : '#F6F7F4',
          border: `1px solid ${qiskit ? CIRCUIT_ACCENT : '#E2E6DF'}`,
          borderRadius: 12,
          padding: '9px 11px',
        }}
      >
        {qiskit ? (
          <Cpu size={14} color={CIRCUIT_ACCENT} style={{ flexShrink: 0 }} />
        ) : (
          <MonitorSmartphone size={14} color="#5A6578" style={{ flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 11.5, color: '#3A3F47', lineHeight: 1.5, flex: 1, minWidth: 0 }}>
          {qiskit ? (
            <>
              Ran on <strong>Qiskit Aer</strong> at 127.0.0.1:8001.
            </>
          ) : (
            <>
              Running in your browser. The exact odds are the same either way — only the sampled
              counts differ.
            </>
          )}
        </span>
        {!qiskit && status !== 'offsite' && (
          <button
            type="button"
            onClick={onRecheck}
            title="Look for a local Qiskit backend again"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: '#5A6578',
              fontSize: 11,
              font: 'inherit',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={12} /> recheck
          </button>
        )}
      </div>

      {/* ── The result, or a stand-in for it ── */}
      {!result ? (
        <Placeholder running={running} hasGates={hasGates} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map((section) => {
            const open = openSection === section.id;
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${open ? CIRCUIT_ACCENT : '#E2E6DF'}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggleSection(section.id)}
                  aria-expanded={open}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '13px 14px',
                    background: open ? CIRCUIT_SOFT : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                  }}
                >
                  <Icon size={15} color={CIRCUIT_ACCENT} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#22252A',
                      }}
                    >
                      {section.title}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: '#5A6578', marginTop: 1 }}>
                      {section.blurb}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    color="#8A93A0"
                    style={{
                      flexShrink: 0,
                      transition: 'transform 0.25s',
                      transform: open ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '4px 14px 16px' }}>
                        <SectionBody id={section.id} result={result} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Empty / running ──────────────────────────────────────────── */

function Placeholder({ running, hasGates }: { running: boolean; hasGates: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#FFFFFF',
        border: '1px dashed #D5DBD4',
        borderRadius: 16,
        padding: '18px 16px',
      }}
    >
      <Stickman
        pose={running ? 'juggle' : 'read'}
        size={78}
        accent={CIRCUIT_ACCENT}
        style={{ flexShrink: 0 }}
      />
      <p style={{ fontSize: 13, color: '#5A6578', lineHeight: 1.6 }}>
        {running
          ? 'Measuring 1,024 times…'
          : hasGates
            ? 'Circuit ready. Hit Run and the results land here.'
            : 'Drop a gate on the board, then run it. Results land here.'}
      </p>
    </div>
  );
}

/* ── Section bodies ───────────────────────────────────────────── */

function SectionBody({ id, result }: { id: SectionId; result: SimResult }) {
  if (id === 'measurement') return <Measurement result={result} />;
  if (id === 'histogram') return <Histogram result={result} />;
  if (id === 'statevector') return <Statevector result={result} />;
  return <Spheres result={result} />;
}

/** Outcomes worth showing, most likely first. */
function outcomes(result: SimResult): string[] {
  const keys = new Set([...Object.keys(result.ideal), ...Object.keys(result.counts)]);
  return [...keys].sort((a, b) => (result.ideal[b] ?? 0) - (result.ideal[a] ?? 0) || a.localeCompare(b));
}

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

function Measurement({ result }: { result: SimResult }) {
  const rows = outcomes(result);
  return (
    <>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        <caption
          style={{
            captionSide: 'top',
            textAlign: 'left',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11.5,
            color: '#5A6578',
            paddingBottom: 8,
            lineHeight: 1.5,
          }}
        >
          Qubits read left to right as q₂ q₁ q₀, the way Qiskit prints them.
        </caption>
        <thead>
          <tr style={{ color: '#8A93A0', textAlign: 'right' }}>
            <th style={{ textAlign: 'left', fontWeight: 500, paddingBottom: 6 }}>state</th>
            <th style={{ fontWeight: 500, paddingBottom: 6 }}>shots</th>
            <th style={{ fontWeight: 500, paddingBottom: 6 }}>sampled</th>
            <th style={{ fontWeight: 500, paddingBottom: 6 }}>exact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((key) => (
            <tr key={key} style={{ borderTop: '1px solid #EDF0EA' }}>
              <td style={{ padding: '6px 0', color: '#22252A', fontWeight: 700 }}>|{key}⟩</td>
              <td style={{ textAlign: 'right', color: '#5A6578' }}>{result.counts[key] ?? 0}</td>
              <td style={{ textAlign: 'right', color: '#5A6578' }}>
                {pct(result.probabilities[key] ?? 0)}
              </td>
              <td style={{ textAlign: 'right', color: CIRCUIT_INK, fontWeight: 700 }}>
                {pct(result.ideal[key] ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11.5, color: '#8A93A0', lineHeight: 1.55, marginTop: 10 }}>
        {SHOTS} shots. The gap between <em>sampled</em> and <em>exact</em> is shot noise — run it
        again and it moves.
      </p>
    </>
  );
}

function Histogram({ result }: { result: SimResult }) {
  const rows = outcomes(result);
  const top = Math.max(...rows.map((k) => result.ideal[k] ?? 0), 0.001);

  /* Two wires that are each 50/50 yet always agree: worth a cheer. */
  const entangled = QUBITS.some((a) =>
    QUBITS.some(
      (b) =>
        b > a &&
        Math.abs(marginalOne(result.statevector, a) - 0.5) < 0.02 &&
        Math.abs(marginalOne(result.statevector, b) - 0.5) < 0.02 &&
        agreement(result.statevector, a, b) > 0.99
    )
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((key, i) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5,
                color: '#22252A',
                width: 48,
                flexShrink: 0,
              }}
            >
              |{key}⟩
            </span>
            <span
              style={{
                flex: 1,
                height: 16,
                background: '#F1F3EE',
                borderRadius: 8,
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              <motion.span
                className="circuit-bar"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(((result.ideal[key] ?? 0) / top) * 100, 2)}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                style={{
                  display: 'block',
                  height: '100%',
                  borderRadius: 8,
                  background: CIRCUIT_ACCENT,
                }}
              />
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#5A6578',
                width: 46,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {pct(result.ideal[key] ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {/* ── The twins ── */}
      {entangled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 4,
            marginTop: 12,
            background: CIRCUIT_SOFT,
            borderRadius: 14,
            padding: '8px 12px',
          }}
        >
          <Stickman pose="signal" size={66} accent={CIRCUIT_ACCENT} />
          <span
            style={{
              fontSize: 11.5,
              color: '#7A5B0A',
              lineHeight: 1.5,
              textAlign: 'center',
              paddingBottom: 10,
            }}
          >
            Entangled. Two wires, one answer — they always agree.
          </span>
          <Stickman pose="signal" size={66} accent={CIRCUIT_ACCENT} flip />
        </motion.div>
      )}
    </>
  );
}

function Statevector({ result }: { result: SimResult }) {
  const fmt = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {result.statevector.map((amp, i) => {
        const p = amp.real * amp.real + amp.imaginary * amp.imaginary;
        const label = i.toString(2).padStart(NUM_QUBITS, '0');
        const zero = p < 1e-12;
        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              padding: '5px 8px',
              borderRadius: 8,
              background: zero ? 'transparent' : '#FBFCFA',
              color: zero ? '#B4BCC6' : '#3A3F47',
            }}
          >
            <span style={{ width: 46, color: zero ? '#B4BCC6' : '#22252A', fontWeight: 700 }}>
              |{label}⟩
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              {fmt(amp.real)}
              {amp.imaginary < 0 ? ' − ' : ' + '}
              {fmt(Math.abs(amp.imaginary))}i
            </span>
            <span style={{ color: zero ? '#B4BCC6' : CIRCUIT_INK }}>{pct(p)}</span>
          </div>
        );
      })}
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11.5,
          color: '#8A93A0',
          lineHeight: 1.55,
          marginTop: 6,
        }}
      >
        Amplitudes can be negative or imaginary; probabilities cannot. Square the amplitude and the
        phase disappears — that is why Z is invisible in the histogram.
      </p>
    </div>
  );
}

function Spheres({ result }: { result: SimResult }) {
  return (
    <div className="roadmap-grid-3" style={{ gap: 8 }}>
      {QUBITS.map((q) => (
        <BlochSphere key={q} qubit={q} vector={blochVector(result.statevector, q)} size={150} />
      ))}
    </div>
  );
}
