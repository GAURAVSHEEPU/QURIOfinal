import type { Metadata } from 'next';

import TutorWorkflow from '@/components/tutor/TutorWorkflow';

export const metadata: Metadata = {
  title: 'AI Tutor – The Qurio Atlas',
  description: 'A guided quantum learning workflow with contextual AI tutoring.',
};

export default function Page() {
  return <TutorWorkflow />;
}