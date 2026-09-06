import type { Metadata } from 'next';
import RoadmapPage from '@/components/roadmap/RoadmapPage';

export const metadata: Metadata = {
  title: 'The Quantum Learning Roadmap – Beginner to Research Level | The Qurio Atlas',
  description:
    'A complete, ordered path from zero to research-level quantum computing. Three tracks — Beginner, Intermediate and Pro — with 20 milestones and 55+ curated books, courses, videos, tools, papers and communities.',
};

export default function Page() {
  return <RoadmapPage />;
}
