import type { Metadata } from 'next';
import AuthGate from '@/components/auth/AuthGate';
import CircuitStudio from '@/components/circuit/CircuitStudio';

export const metadata: Metadata = {
  title: 'Circuit Studio – The Circuit Realm | The Qurio Atlas',
  description:
    'Build three-qubit circuits from H, X, Y, Z and CNOT, run 1,024 shots, and watch the statevector, histogram and Bloch spheres update. The Qiskit code is generated as you go — and five challenges check the state you actually built.',
};

export default function Page() {
  return (
    <AuthGate>
      <CircuitStudio />
    </AuthGate>
  );
}
