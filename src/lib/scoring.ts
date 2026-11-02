import type { Question, AnswerState, DiagnosisTag } from '@/types';
import { getDiagnosisTag, getPacingFlag } from './engine';

export function calculateScore(
  questions: Question[],
  answers: Record<string, AnswerState>
): number {
  let score = 0;
  for (const q of questions) {
    const ans = answers[q.id];
    if (ans && ans.selectedOption === q.correctOption) {
      score++;
    }
  }
  return score;
}
/* answers:Record<string, AnswerState> 
      "KCET-PHY-2023-Q15": {
        "selectedOption": 2,
        "selfReport": "sure",
        "isMarkedForReview": false,
        "timeToFirstSelectMs": 5000,
        "timeOnQuestionMs": 85000,
        "optionChangesCount": 2
      },
*/ 
export function aggregateDiagnosis(
  questions: Question[],
  answers: Record<string, AnswerState>
): Record<DiagnosisTag, number> {
  const summary: Record<DiagnosisTag, number> = {
    BLIND_GUESS: 0, MISCONCEPTION: 0, CONCEPT_GAP: 0,
    LUCKY_GUESS: 0, NEEDS_CONFIDENCE: 0, MASTERED: 0,
    MARKED_SKIPPED: 0, UNATTEMPTED: 0,
  };

  for (const q of questions) {
    const ans = answers[q.id];
    const isCorrect = ans?.selectedOption !== null && ans?.selectedOption !== undefined 
      ? ans.selectedOption === q.correctOption 
      : null;
      
    const tag = getDiagnosisTag(
      isCorrect, 
      ans?.selfReport ?? null, 
      ans?.isMarkedForReview ?? false
    );
    
    summary[tag]++;
  }
  return summary;
}

export function aggregatePacing(
  questions: Question[],
  answers: Record<string, AnswerState>
) {
  const rushed: string[] = [];
  const overthinking: string[] = [];

  for (const q of questions) {
    const ans = answers[q.id];
    if (!ans || ans.timeOnQuestionMs === 0) continue;

    const flag = getPacingFlag(ans.timeOnQuestionMs, q.est_time_seconds);
    if (flag === 'RUSHED') rushed.push(q.id);
    if (flag === 'OVERTHINKING') overthinking.push(q.id);
  }

  return { rushed, overthinking };
}