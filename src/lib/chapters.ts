// src/lib/chapters.ts
// Shared chapter registry — imported by result + review pages to resolve
// `attempts.chapter_id` back to { title, jsonPath, timeLimitMinutes }.
// Structurally identical to `Chapter` in useTestStore; assignable both ways.

export interface Chapter {
  id: string;
  title: string;
  jsonPath: string;
  timeLimitMinutes: number;
  commingSoon?: boolean; // optional, for future chapters not yet available
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ray-optics',
    title: 'Ray Optics',
    jsonPath: '/ray-optics.json',
    timeLimitMinutes: 40,
  },
  {
    id: 'motion-straight-line',
    title: 'Motion in a Straight Line',
    jsonPath: '/motion-straight-line.json',
    timeLimitMinutes: 15,
    // commingSoon: true, // not yet available
  },
  {
    id: 'electrostatics',
    title: 'Electrostatics',
    jsonPath: '/electrostatics.json',
    timeLimitMinutes: 35,
  },
  { 
    id: 'matrices', 
    title: 'Matrices', 
    jsonPath: '/matrices.json', 
    timeLimitMinutes: 42 
  },
  { 
    id: 'determinants', 
    title: 'Determinants', 
    jsonPath: '/determinants.json', 
    timeLimitMinutes: 40 
  },
];

export function getChapterById(
  id: string | null | undefined,
): Chapter | null {
  if (!id) return null;
  return CHAPTERS.find((c) => c.id === id) ?? null;
}