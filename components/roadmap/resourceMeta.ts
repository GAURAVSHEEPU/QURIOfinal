'use client';

import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  Wrench,
  FileText,
  Users,
  Dumbbell,
  type LucideIcon,
} from 'lucide-react';

import type { ResourceKind } from './roadmapData';

/* Shared presentation for resource kinds, used by both the
   milestone resource lists and the resource library. */

export const KIND_ICON: Record<ResourceKind, LucideIcon> = {
  book: BookOpen,
  course: GraduationCap,
  video: PlayCircle,
  tool: Wrench,
  paper: FileText,
  community: Users,
  practice: Dumbbell,
};

export const KIND_TINT: Record<ResourceKind, { bg: string; fg: string }> = {
  book: { bg: '#FDECE9', fg: '#C4402F' },
  course: { bg: '#E6F4F8', fg: '#00607D' },
  video: { bg: '#FEF3C7', fg: '#B45309' },
  tool: { bg: '#E6EBE0', fg: '#4A6741' },
  paper: { bg: '#EAEDF6', fg: '#2C3A63' },
  community: { bg: '#F0E9F5', fg: '#6B4E9E' },
  practice: { bg: '#E4F1EC', fg: '#2F7A63' },
};

export const KIND_SINGULAR: Record<ResourceKind, string> = {
  book: 'Book',
  course: 'Course',
  video: 'Video',
  tool: 'Tool',
  paper: 'Paper',
  community: 'Community',
  practice: 'Practice',
};
