'use client';

import {
  NUM_QUBITS,
  SHOTS,
  idealFrom,
  simulate,
  type Amp,
  type PlacedGate,
  type SimResult,
} from './simulator';

/* ══════════════════════════════════════════════════════════════
   ENGINE — browser first, real Qiskit if it happens to be up.

   The uploaded builder POSTed every run to a FastAPI + Aer server
   and showed "Could not connect to the quantum simulator" when it
   was not running, which is most of the time and always once the
   site is deployed. Here the browser simulator is the floor: it
   always answers, so there is no error state at all. If the
   optional backend in circuit-backend/ is running we prefer it,
   because "your circuit really ran through Qiskit Aer" is worth
   something, and we say which engine answered.

   Two guards matter:

   · Only ever probe from localhost. An https:// page requesting
     http://127.0.0.1:8001 is blocked as mixed content and logs an
     error on every single run — so a deployed build never tries.
   · Remember the verdict for the tab. A missing backend should
     cost one timeout, not one per click.
   ══════════════════════════════════════════════════════════════ */

export const BACKEND_URL = 'http://127.0.0.1:8001/simulate';
const TIMEOUT_MS = 1500;

export type BackendStatus = 'unknown' | 'checking' | 'up' | 'down' | 'offsite';

let status: BackendStatus = 'unknown';

export function backendStatus(): BackendStatus {
  return status;
}

/** Forget the verdict so the next run probes again — the "recheck" button. */
export function recheckBackend(): void {
  if (status === 'up' || status === 'down') status = 'unknown';
}

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
}

interface BackendResponse {
  counts?: Record<string, number>;
  probabilities?: Record<string, number>;
  statevector?: Amp[];
  circuit?: string;
}

/** Anything malformed is treated as "backend down" rather than throwing. */
function adopt(raw: unknown): SimResult | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as BackendResponse;

  const sv = body.statevector;
  if (!Array.isArray(sv) || sv.length !== 1 << NUM_QUBITS) return null;

  const statevector: Amp[] = sv.map((a) => ({
    real: Number(a?.real ?? 0),
    imaginary: Number(a?.imaginary ?? 0),
  }));
  if (statevector.some((a) => !Number.isFinite(a.real) || !Number.isFinite(a.imaginary))) return null;

  const counts = body.counts ?? {};
  const shots = Object.values(counts).reduce((s, c) => s + c, 0) || SHOTS;

  return {
    counts,
    probabilities: body.probabilities ?? {},
    /* Computed here rather than taken from the response: main.py derives
       its probabilities from counts/1024, so the exact numbers have to
       come off the statevector either way. This is what keeps the two
       engines in agreement on the ideal column. */
    ideal: idealFrom(statevector),
    statevector,
    circuit: typeof body.circuit === 'string' ? body.circuit : '',
    engine: 'qiskit',
    shots,
  };
}

async function tryBackend(gates: PlacedGate[]): Promise<SimResult | null> {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_qubits: NUM_QUBITS, gates }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return adopt(await response.json());
  } catch {
    // Not running, wrong port, CORS, timeout, bad JSON — all the same to us.
    return null;
  }
}

export async function runCircuit(gates: PlacedGate[]): Promise<SimResult> {
  if (!isLocalHost()) {
    status = 'offsite';
    return simulate(gates, NUM_QUBITS);
  }

  if (status === 'unknown' || status === 'up') {
    if (status === 'unknown') status = 'checking';
    const live = await tryBackend(gates);
    if (live) {
      status = 'up';
      return live;
    }
    status = 'down';
  }

  return simulate(gates, NUM_QUBITS);
}
