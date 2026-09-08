'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, motion } from 'framer-motion';
import { ArrowRight, CircuitBoard as CircuitIcon, Gamepad2 } from 'lucide-react';

import AtlasNav from '../shared/AtlasNav';
import RoadmapBackground from '../roadmap/RoadmapBackground';
import Stickman from '../roadmap/Stickman';
import { useProgress } from '../qubit/progressStore';

import BoardGrid, { type CellValue } from './CircuitBoard';
import ChallengeList from './ChallengeList';
import CodePanel from './CodePanel';
import GatePalette from './GatePalette';
import QuantumGuide from './QuantumGuide';
import ResultsPanel from './ResultsPanel';
import {
  CHALLENGES,
  CIRCUIT_ACCENT,
  CIRCUIT_SOFT,
  GATE_BY_NAME,
  GUIDE_CNOT_CONTROL,
  GUIDE_CNOT_DONE,
  GUIDE_DONE,
  GUIDE_EMPTY,
  GUIDE_IDLE,
  GUIDE_OTHER_WIRE,
  GUIDE_REMOVED,
  GUIDE_RUNNING,
  GUIDE_SAME_COLUMN,
  GUIDE_SOLVED,
  challengeFlag,
  explainGate,
  type GuideMessage,
  type SectionId,
} from './circuitData';
import { backendStatus, recheckBackend, runCircuit, type BackendStatus } from './engine';
import {
  NUM_COLUMNS,
  NUM_QUBITS,
  qiskitCode,
  type GateName,
  type PlacedGate,
  type SimResult,
} from './simulator';

/* ══════════════════════════════════════════════════════════════
   CIRCUIT STUDIO  ·  /circuit

   The Circuit Realm pillar the landing page has been advertising
   since the first commit. Six links across the site point here.

   Ported from the uploaded standalone builder: same 3×6 board,
   same gates, same Qiskit code generation, same four result
   views. What changed is everything around them — the Atlas
   palette instead of clay-morphism, the project's Stickman
   instead of three hand-rolled SVG figures, tap-to-place so it
   works on a phone, an in-browser engine so it works with no
   backend at all, and challenges instead of the three floating
   learning-cloud popups.

   The board itself is deliberately not persisted. A circuit is a
   scratchpad; only the challenges you clear are worth keeping,
   and those go into the same localStorage progress store /qubit
   and /profile read.
   ══════════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const;
/** How long the carrier spends on each column. */
const STEP_MS = 170;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CircuitStudio() {
  return (
    <MotionConfig reducedMotion="user">
      <Studio />
    </MotionConfig>
  );
}

function Studio() {
  const { progress, hydrated, raiseFlag } = useProgress();

  const [cells, setCells] = useState<Record<string, CellValue>>({});
  const [cnotControl, setCnotControl] = useState<{ qubit: number; column: number } | null>(null);
  const [armed, setArmed] = useState<GateName | null>(null);

  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [carrier, setCarrier] = useState<number | null>(null);
  const [status, setStatus] = useState<BackendStatus>('unknown');
  const [openSection, setOpenSection] = useState<SectionId | null>('measurement');

  const [guide, setGuide] = useState<GuideMessage>(GUIDE_IDLE);
  const [justPassed, setJustPassed] = useState<string | null>(null);

  const passed = useMemo(
    () =>
      hydrated
        ? CHALLENGES.filter((c) => progress.flags.includes(challengeFlag(c.id))).map((c) => c.id)
        : [],
    [hydrated, progress.flags]
  );

  /* ── Board → gate list ──
     Rebuilt from scratch on every change rather than kept in step
     with the cells, so the two can never disagree. Six columns of
     three cells is nothing to walk. */
  const gates = useMemo<PlacedGate[]>(() => {
    const out: PlacedGate[] = [];
    for (let column = 0; column < NUM_COLUMNS; column++) {
      for (let qubit = 0; qubit < NUM_QUBITS; qubit++) {
        const value = cells[`${qubit}-${column}`];
        if (!value || value === 'TARGET') continue;
        if (value === 'CONTROL') {
          const target = [0, 1, 2].find((q) => cells[`${q}-${column}`] === 'TARGET');
          if (target !== undefined) out.push({ gate: 'CNOT', control: qubit, target, column });
          continue;
        }
        out.push({ gate: value, qubit, column });
      }
    }
    return out;
  }, [cells]);

  const code = useMemo(() => qiskitCode(gates), [gates]);

  /* The tick highlight is a one-shot; clear it so a later pass can
     play it again. */
  useEffect(() => {
    if (!justPassed) return;
    const timer = window.setTimeout(() => setJustPassed(null), 2000);
    return () => window.clearTimeout(timer);
  }, [justPassed]);

  /* ── Placing ─────────────────────────────────────────────────── */

  const place = useCallback(
    (qubit: number, column: number, gate: GateName) => {
      const key = `${qubit}-${column}`;
      if (cells[key]) return;

      if (gate === 'CNOT') {
        setCnotControl({ qubit, column });
        setArmed('CNOT');
        setGuide(GUIDE_CNOT_CONTROL(qubit));
        return;
      }

      setCells((prev) => ({ ...prev, [key]: gate }));
      setArmed(null);
      setGuide(explainGate(gate, qubit));
    },
    [cells]
  );

  /** Removing either half of a CNOT removes both — half a CNOT is not a gate. */
  const removeAt = useCallback((qubit: number, column: number) => {
    setCells((prev) => {
      const value = prev[`${qubit}-${column}`];
      const next = { ...prev };
      if (value === 'CONTROL' || value === 'TARGET') {
        for (let q = 0; q < NUM_QUBITS; q++) {
          const other = next[`${q}-${column}`];
          if (other === 'CONTROL' || other === 'TARGET') delete next[`${q}-${column}`];
        }
      } else {
        delete next[`${qubit}-${column}`];
      }
      return next;
    });
    setGuide(GUIDE_REMOVED);
  }, []);

  const handleCellClick = useCallback(
    (qubit: number, column: number) => {
      /* Step two of a CNOT takes priority over everything else. */
      if (cnotControl) {
        if (cnotControl.qubit === qubit && cnotControl.column === column) {
          setCnotControl(null);
          setArmed(null);
          setGuide(GUIDE_IDLE);
          return;
        }
        if (cnotControl.column !== column) {
          setGuide(GUIDE_SAME_COLUMN);
          return;
        }
        if (cells[`${qubit}-${column}`]) {
          setGuide(GUIDE_OTHER_WIRE);
          return;
        }
        const control = cnotControl.qubit;
        setCells((prev) => ({
          ...prev,
          [`${control}-${column}`]: 'CONTROL',
          [`${qubit}-${column}`]: 'TARGET',
        }));
        setCnotControl(null);
        setArmed(null);
        setGuide(GUIDE_CNOT_DONE(control, qubit));
        return;
      }

      if (cells[`${qubit}-${column}`]) {
        removeAt(qubit, column);
        return;
      }

      if (armed) {
        place(qubit, column, armed);
        return;
      }

      setGuide({
        title: 'Pick a gate first',
        message: 'Choose one from the palette, then tap the cell you want it in.',
        tip: 'H on q₀ is the classic opening move.',
        pose: 'point',
      });
    },
    [armed, cells, cnotControl, place, removeAt]
  );

  /* ── Running ─────────────────────────────────────────────────── */

  /* Guards the walk against a Reset landing mid-run. */
  const runId = useRef(0);

  const onRun = useCallback(async () => {
    if (running) return;
    if (gates.length === 0) {
      setGuide(GUIDE_EMPTY);
      return;
    }

    const id = ++runId.current;
    setRunning(true);
    setResult(null);
    setCnotControl(null);
    setGuide(GUIDE_RUNNING);
    setCarrier(0);

    /* The carrier's walk and the simulation run together — whichever
       takes longer sets the pace. The walk is what makes a 2ms
       computation legible. */
    const stride = (async () => {
      for (let column = 0; column < NUM_COLUMNS; column++) {
        setCarrier(column);
        await wait(STEP_MS);
      }
    })();

    const [out] = await Promise.all([runCircuit(gates), stride]);
    if (id !== runId.current) return;

    setResult(out);
    setStatus(backendStatus());
    setRunning(false);
    setOpenSection((open) => open ?? 'measurement');

    const newly = CHALLENGES.filter((c) => !passed.includes(c.id) && c.test(out));
    newly.forEach((c) => raiseFlag(challengeFlag(c.id)));

    if (newly.length > 0) {
      setJustPassed(newly[0].id);
      setGuide(GUIDE_SOLVED(newly[0].title));
    } else {
      setGuide(GUIDE_DONE(out.engine === 'qiskit'));
    }

    await wait(600);
    if (id === runId.current) setCarrier(null);
  }, [gates, passed, raiseFlag, running]);

  const onReset = useCallback(() => {
    runId.current++;
    setCells({});
    setCnotControl(null);
    setArmed(null);
    setResult(null);
    setRunning(false);
    setCarrier(null);
    setGuide(GUIDE_IDLE);
  }, []);

  const onRecheck = useCallback(() => {
    recheckBackend();
    setStatus(backendStatus());
  }, []);

  const onArm = useCallback((gate: GateName | null) => {
    setArmed(gate);
    setCnotControl(null);
    setGuide(
      gate && gate !== 'CNOT'
        ? {
            title: GATE_BY_NAME[gate].name,
            message: GATE_BY_NAME[gate].explanation,
            tip: `Tap a cell to drop it in. ${GATE_BY_NAME[gate].formula}`,
            pose: 'teach',
          }
        : gate === 'CNOT'
          ? {
              title: 'Controlled-NOT',
              message: 'This one takes two cells. Tap the control wire first, then the target.',
              tip: 'Both must sit in the same column.',
              pose: 'point',
            }
          : GUIDE_IDLE
    );
  }, []);

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
      <AtlasNav current="circuit" />

      <div className="atlas-content-layer">
        {/* ══════════════ HERO ══════════════ */}
        <header style={{ padding: '58px 28px 26px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                <Stickman
                  pose={running ? 'juggle' : 'point'}
                  size={100}
                  accent={CIRCUIT_ACCENT}
                  label="Your circuit guide"
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: CIRCUIT_ACCENT,
                      background: CIRCUIT_SOFT,
                      borderRadius: 999,
                      padding: '5px 11px',
                      marginBottom: 10,
                    }}
                  >
                    <CircuitIcon size={12} /> Circuit Realm
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                    }}
                  >
                    Circuit <span className="atlas-marker">Studio</span>
                  </h1>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: '#5A6578',
                      lineHeight: 1.65,
                      marginTop: 8,
                      maxWidth: 560,
                    }}
                  >
                    Three qubits, six moments in time. Place gates, run 1,024 shots, and read the
                    Qiskit that would do the same thing on real hardware.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/roadmap"
                  className="btn-atlas-ghost"
                  style={{ padding: '10px 18px', fontSize: 14 }}
                >
                  Learn the theory <ArrowRight size={14} />
                </Link>
                <Link
                  href="/qubit"
                  className="btn-atlas-ghost"
                  style={{ padding: '10px 18px', fontSize: 14 }}
                >
                  <Gamepad2 size={14} /> Play the games
                </Link>
              </div>
            </motion.div>
          </div>
        </header>

        {/* ══════════════ THE STUDIO ══════════════ */}
        <main style={{ padding: '0 28px 80px' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }} className="circuit-layout">
            {/* ── Palette ── */}
            <motion.section
              aria-label="Gate palette"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
              className="atlas-card"
              style={{ padding: 16 }}
            >
              <GatePalette armed={armed} onArm={onArm} awaitingTarget={cnotControl !== null} />
            </motion.section>

            {/* ── Board + guide + code ── */}
            <motion.section
              aria-label="Circuit board"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}
            >
              <div className="atlas-card" style={{ padding: '16px 18px 20px' }}>
                <div className="circuit-board-scroll">
                  <div style={{ minWidth: 520 }}>
                    <BoardGrid
                      cells={cells}
                      cnotControl={cnotControl}
                      armed={armed}
                      carrier={carrier}
                      running={running}
                      onPlace={place}
                      onCellClick={handleCellClick}
                    />
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: '#8A93A0', lineHeight: 1.55, marginTop: 14 }}>
                  Time runs left to right. Tap a placed gate to take it off again.
                </p>
              </div>

              <QuantumGuide guide={guide} />

              <CodePanel code={code} diagram={result?.circuit || undefined} />
            </motion.section>

            {/* ── Results + challenges ── */}
            <motion.section
              aria-label="Results and challenges"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}
            >
              <ResultsPanel
                result={result}
                running={running}
                hasGates={gates.length > 0}
                status={status}
                openSection={openSection}
                onToggleSection={(id) => setOpenSection((open) => (open === id ? null : id))}
                onRun={onRun}
                onReset={onReset}
                onRecheck={onRecheck}
              />

              <div className="atlas-card" style={{ padding: 16 }}>
                <ChallengeList passed={passed} justPassed={justPassed} />
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}
