import type { Metadata } from 'next';
import QubitPage from '@/components/qubit/QubitPage';

export const metadata: Metadata = {
  title: 'Qurio Qubit – The Base Camp Arcade | The Qurio Atlas',
  description:
    'Six stickman games, one for each Base Camp module. Balance amplitudes, catch a collapse, hop the gates, sync a Bell pair, diagnose shot noise and run BB84 — then collect bronze, silver and gold.',
};

export default function Page() {
  return <QubitPage />;
}
