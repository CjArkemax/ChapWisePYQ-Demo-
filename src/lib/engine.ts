import type { DiagnosisTag, SelfReport } from '@/types';

export function getDiagnosisTag(
  isCorrect: boolean | null,
  selfReport: SelfReport,
  isMarked: boolean
): DiagnosisTag {
  // Unattempted (Cases 7 & 8)
  if (isCorrect === null) {
    return isMarked ? 'MARKED_SKIPPED' : 'UNATTEMPTED';
  }

  // Wrong (Cases 1, 2, 3, 9)
  if (!isCorrect) {
    if (selfReport === 'guess') return 'BLIND_GUESS';
    if (selfReport === 'sure') return 'MISCONCEPTION';
    return 'CONCEPT_GAP'; // 'unsure' OR null (Fallback Case 9)
  }

  // Correct (Cases 4, 5, 6, 10)
  if (selfReport === 'guess' || selfReport === null) return 'LUCKY_GUESS'; // Fallback Case 10
  if (selfReport === 'unsure') return 'NEEDS_CONFIDENCE';
  return 'MASTERED';
}

export function getPacingFlag(
  timeOnQuestionMs: number,
  estTimeSeconds: number
): 'RUSHED' | 'NORMAL' | 'OVERTHINKING' {
  const ratio = timeOnQuestionMs / (estTimeSeconds * 1000);
  
  if (ratio > 2.5) return 'OVERTHINKING';
  if (ratio < 0.4) return 'RUSHED';
  return 'NORMAL';
}