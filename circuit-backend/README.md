# Circuit Studio backend (optional)

`/circuit` works with no backend at all — it ships with an in-browser statevector
simulator that produces the same exact probabilities Qiskit would. This folder is
for when you want your circuits to run through **real Qiskit Aer** instead.

`main.py` is the FastAPI server from the original standalone circuit builder,
carried over unmodified.

## Run it

```bash
pip install qiskit qiskit-aer fastapi uvicorn
python circuit-backend/main.py
```

It listens on `http://127.0.0.1:8001`. Reload `/circuit` (or press **recheck**
next to the engine chip) and the chip flips to `Qiskit Aer`.

## How the page decides

- The probe only ever runs when the page is served from `localhost` / `127.0.0.1`.
  A deployed `https://` build would have its request to `http://127.0.0.1:8001`
  blocked as mixed content, so it never tries.
- One 1.5 s timeout per tab. If nothing answers, the browser engine takes over
  silently — there is no error state, because there is always a working engine.
- The **exact** probability column is computed locally from the statevector in
  both paths, so it is identical whichever engine answered. Only the sampled
  1,024-shot counts differ, and those differ run to run anyway.

## Endpoint

`POST /simulate`

```json
{
  "num_qubits": 3,
  "gates": [
    { "gate": "H", "qubit": 0, "column": 0 },
    { "gate": "CNOT", "control": 0, "target": 1, "column": 1 }
  ]
}
```

Responds with `counts`, `probabilities`, `statevector` (8 `{real, imaginary}`
amplitudes) and `circuit` (the ASCII drawing). Gates are applied in `column`
order.

This is not wired into `npm run dev` — start it yourself when you want it.
