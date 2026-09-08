'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';

import { CIRCUIT_ACCENT, CIRCUIT_INK, CIRCUIT_SOFT } from './circuitData';

/* ══════════════════════════════════════════════════════════════
   THE QISKIT CODE

   This is the page's real deliverable: whatever you build on the
   board, the code below runs it in Colab or a local notebook. It
   updates as you place gates — no need to run first — which is
   why it lives beside the board rather than inside the results.

   The ASCII diagram underneath is whatever engine answered last,
   so it doubles as proof the two agree.
   ══════════════════════════════════════════════════════════════ */

export interface CodePanelProps {
  code: string;
  /** The ASCII drawing from the last run, if there has been one. */
  diagram?: string;
}

export default function CodePanel({ code, diagram }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* Clipboard is blocked in some embedded contexts; the code is
         selectable either way, so this is not worth an error state. */
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E6DF',
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '12px 14px',
          borderBottom: '1px solid #EDF0EA',
        }}
      >
        <Code2 size={15} color={CIRCUIT_ACCENT} style={{ flexShrink: 0 }} />
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
            Qiskit code
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: '#5A6578', marginTop: 1 }}>
            Live. Paste it straight into a notebook.
          </span>
        </span>
        <button
          type="button"
          onClick={copy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0,
            background: copied ? CIRCUIT_SOFT : '#F6F7F4',
            border: `1px solid ${copied ? CIRCUIT_ACCENT : '#E2E6DF'}`,
            borderRadius: 9,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 11.5,
            fontWeight: 700,
            color: copied ? CIRCUIT_INK : '#3A3F47',
            font: 'inherit',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '13px 14px',
          overflowX: 'auto',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5,
          lineHeight: 1.7,
          color: '#3A3F47',
          background: '#FBFCFA',
        }}
      >
        <code>{code}</code>
      </pre>

      {diagram && (
        <div style={{ borderTop: '1px solid #EDF0EA' }}>
          <div
            style={{
              padding: '10px 14px 0',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8A93A0',
            }}
          >
            Diagram
          </div>
          <pre
            style={{
              margin: 0,
              padding: '6px 14px 14px',
              overflowX: 'auto',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              lineHeight: 1.45,
              color: '#5A6578',
            }}
          >
            <code>{diagram}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
