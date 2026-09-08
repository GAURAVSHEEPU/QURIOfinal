'use client';

import { motion } from 'framer-motion';

import Stickman from '../roadmap/Stickman';
import { CIRCUIT_ACCENT, CIRCUIT_SOFT, GATE_BY_NAME } from './circuitData';
import { NUM_COLUMNS, NUM_QUBITS, type GateName } from './simulator';

/* ══════════════════════════════════════════════════════════════
   THE BOARD — three wires, six columns.

   Geometry is fixed in pixels vertically (ROW_H, ROW_GAP) and
   fluid horizontally. That is deliberate: the CNOT connector and
   the walking stickman both need to know where a cell is, and
   the /profile climber taught us that positioning against a
   measured-or-percentage container is the thing that breaks when
   a layout pass lands late. Here the rows are a known pitch, and
   the carrier rides a calc() over a container with an explicit
   minWidth — so neither can ever resolve against a zero box.

   The wire itself is a gradient on the cell background rather
   than a separate line element, so it stays continuous through
   every column at any width.
   ══════════════════════════════════════════════════════════════ */

const ROW_H = 64;
const ROW_GAP = 22;
const PITCH = ROW_H + ROW_GAP;
const LABEL_W = 46;

export type CellValue = GateName | 'CONTROL' | 'TARGET';

const WIRE = `linear-gradient(to bottom,
  transparent calc(50% - 1px),
  #D5DBD4 calc(50% - 1px),
  #D5DBD4 calc(50% + 1px),
  transparent calc(50% + 1px))`;

const COLUMNS = Array.from({ length: NUM_COLUMNS }, (_, i) => i);
const QUBITS = Array.from({ length: NUM_QUBITS }, (_, i) => i);

export interface CircuitBoardProps {
  cells: Record<string, CellValue>;
  cnotControl: { qubit: number; column: number } | null;
  armed: GateName | null;
  /** Column the carrier stickman has reached, or null when he is off-stage. */
  carrier: number | null;
  running: boolean;
  onPlace: (qubit: number, column: number, gate: GateName) => void;
  onCellClick: (qubit: number, column: number) => void;
}

export default function CircuitBoard({
  cells,
  cnotControl,
  armed,
  carrier,
  running,
  onPlace,
  onCellClick,
}: CircuitBoardProps) {
  /** The other half of a CNOT in this column, if there is one. */
  const partnerOf = (qubit: number, column: number): number | null => {
    const here = cells[`${qubit}-${column}`];
    if (here !== 'CONTROL' && here !== 'TARGET') return null;
    const want = here === 'CONTROL' ? 'TARGET' : 'CONTROL';
    const found = QUBITS.find((q) => cells[`${q}-${column}`] === want);
    return found ?? null;
  };

  const describe = (value: CellValue | undefined, qubit: number, column: number) => {
    const where = `qubit ${qubit}, column ${column + 1}`;
    if (!value) return armed ? `Place ${armed} on ${where}` : `Empty cell, ${where}`;
    if (value === 'CONTROL') return `CNOT control on ${where}. Activate to remove.`;
    if (value === 'TARGET') return `CNOT target on ${where}. Activate to remove.`;
    return `${GATE_BY_NAME[value].name} gate on ${where}. Activate to remove.`;
  };

  return (
    <div>
      {/* ── Column ruler ── */}
      <div
        aria-hidden="true"
        style={{
          display: 'grid',
          gridTemplateColumns: `${LABEL_W}px repeat(${NUM_COLUMNS}, minmax(64px, 1fr))`,
          marginBottom: 6,
        }}
      >
        <span />
        {COLUMNS.map((c) => (
          <span
            key={c}
            style={{
              textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: carrier === c ? CIRCUIT_ACCENT : '#B4BCC6',
              fontWeight: carrier === c ? 700 : 400,
            }}
          >
            t{c + 1}
          </span>
        ))}
      </div>

      {/* ── The carrier's lane ──
          A calc() over a container that is never zero-width, with a
          CSS transition rather than a spring — it lands on the right
          column even in a tab that has stopped painting frames. */}
      <div style={{ position: 'relative', height: 74, marginBottom: 2 }}>
        <div style={{ position: 'absolute', inset: `0 0 0 ${LABEL_W}px` }}>
          <div
            className="circuit-carrier"
            style={{
              position: 'absolute',
              bottom: 0,
              left: `calc(${((carrier ?? 0) + 0.5) * (100 / NUM_COLUMNS)}%)`,
              transform: 'translateX(-50%)',
              opacity: carrier === null ? 0 : 1,
              pointerEvents: 'none',
            }}
          >
            <Stickman
              pose="stand"
              striding={running}
              size={74}
              accent={CIRCUIT_ACCENT}
              label="Stickman carrying the qubits through the circuit"
            />
          </div>
        </div>
      </div>

      {/* ── Wires and cells ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${LABEL_W}px repeat(${NUM_COLUMNS}, minmax(64px, 1fr))`,
          rowGap: ROW_GAP,
        }}
      >
        {QUBITS.map((q) => (
          <Row
            key={q}
            qubit={q}
            cells={cells}
            cnotControl={cnotControl}
            armed={armed}
            carrier={carrier}
            partnerOf={partnerOf}
            describe={describe}
            onPlace={onPlace}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </div>
  );
}

/* ── One wire ─────────────────────────────────────────────────── */

interface RowProps extends Pick<CircuitBoardProps, 'cells' | 'cnotControl' | 'armed' | 'carrier' | 'onPlace' | 'onCellClick'> {
  qubit: number;
  partnerOf: (qubit: number, column: number) => number | null;
  describe: (value: CellValue | undefined, qubit: number, column: number) => string;
}

function Row({
  qubit,
  cells,
  cnotControl,
  armed,
  carrier,
  partnerOf,
  describe,
  onPlace,
  onCellClick,
}: RowProps) {
  return (
    <>
      <div
        style={{
          height: ROW_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          color: '#5A6578',
        }}
      >
        q{qubit}
        <span style={{ fontSize: 10.5, color: '#B4BCC6', marginLeft: 4 }}>|0⟩</span>
      </div>

      {COLUMNS.map((column) => {
        const key = `${qubit}-${column}`;
        const value = cells[key];
        const partner = partnerOf(qubit, column);
        const isControl = value === 'CONTROL';
        const linkDown = partner !== null && partner > qubit;
        const armedControl =
          cnotControl !== null && cnotControl.qubit === qubit && cnotControl.column === column;
        const lit = carrier !== null && carrier >= column;

        return (
          <button
            key={key}
            type="button"
            className="circuit-cell"
            aria-label={describe(value, qubit, column)}
            title={describe(value, qubit, column)}
            onDragOver={(event) => {
              if (!value) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const gate = event.dataTransfer.getData('gate') as GateName;
              if (gate) onPlace(qubit, column, gate);
            }}
            onClick={() => onCellClick(qubit, column)}
            style={{
              position: 'relative',
              height: ROW_H,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: WIRE,
              font: 'inherit',
            }}
          >
            {/* The stretch of wire the carrier has already walked */}
            {lit && (
              <span
                aria-hidden="true"
                className="circuit-wire-live"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 'calc(50% - 1.5px)',
                  height: 3,
                  borderRadius: 2,
                  background: CIRCUIT_ACCENT,
                }}
              />
            )}

            {/* The CNOT link, drawn once from the upper of the pair */}
            {isControl && linkDown && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 1px)',
                  top: '50%',
                  width: 2,
                  height: (partner - qubit) * PITCH,
                  background: CIRCUIT_ACCENT,
                }}
              />
            )}
            {value === 'TARGET' && partner !== null && partner < qubit && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 1px)',
                  bottom: '50%',
                  width: 2,
                  height: (qubit - partner) * PITCH,
                  background: CIRCUIT_ACCENT,
                }}
              />
            )}

            <Cell value={value} armedControl={armedControl} armed={armed} />
          </button>
        );
      })}
    </>
  );
}

/* ── One cell's contents ──────────────────────────────────────── */

function Cell({
  value,
  armedControl,
  armed,
}: {
  value: CellValue | undefined;
  armedControl: boolean;
  armed: GateName | null;
}) {
  if (armedControl) {
    return (
      <span
        aria-hidden="true"
        className="circuit-awaiting"
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: CIRCUIT_ACCENT,
          boxShadow: `0 0 0 5px ${CIRCUIT_SOFT}`,
        }}
      />
    );
  }

  if (!value) {
    return (
      <span
        aria-hidden="true"
        className="circuit-slot"
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 42,
          height: 42,
          borderRadius: 12,
          border: `1.5px dashed ${armed ? CIRCUIT_ACCENT : 'transparent'}`,
          background: armed ? 'rgba(255,255,255,0.75)' : 'transparent',
        }}
      />
    );
  }

  if (value === 'CONTROL') {
    return (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: CIRCUIT_ACCENT,
          boxShadow: '0 0 0 4px #FAFAF8',
        }}
      />
    );
  }

  if (value === 'TARGET') {
    return (
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: `2px solid ${CIRCUIT_ACCENT}`,
          background: '#FAFAF8',
          display: 'grid',
          placeItems: 'center',
          color: CIRCUIT_ACCENT,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ⊕
      </span>
    );
  }

  const spec = GATE_BY_NAME[value];
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        inset: '50% auto auto 50%',
        transform: 'translate(-50%, -50%)',
        width: 42,
        height: 42,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        background: spec.tint,
        border: `1.5px solid ${spec.ink}`,
        color: spec.ink,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 17,
        fontWeight: 700,
      }}
    >
      {spec.glyph}
    </motion.span>
  );
}
