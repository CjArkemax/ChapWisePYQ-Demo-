import type { Question, AnswerState, ConceptTag, DiagnosisTag } from '@/types';
import { aggregateDiagnosis, aggregatePacing } from './scoring';
import { getDiagnosisTag } from './engine';

export type Severity = 'REBUILD' | 'REVIEW' | 'BRUSH_UP' | 'MASTERED' | 'UNATTEMPTED';

export interface ActionPlanTagGroup {
  tag: DiagnosisTag;
  questions: number[];
}

export interface ActionPlanConcept {
  concept: ConceptTag;
  tagGroups: ActionPlanTagGroup[];
}

export interface SeverityGroup {
  severity: Severity;
  concepts: ActionPlanConcept[];
}

export function getHeroStats(questions: Question[], answers: Record<string, AnswerState>, timeTakenSeconds: number) {
  let score = 0;
  let wrong = 0;
  let unattempted = 0;

  questions.forEach((q, i) => {
    const ans = answers[q.id];
    if (!ans || ans.selectedOption === null || ans.selectedOption === undefined) {
      unattempted++;
    } else if (ans.selectedOption === q.correctOption) {
      score++;
    } else {
      wrong++;
    }
  });

  const accuracy = Math.round((score / questions.length) * 100);
  const correctRate = score + wrong > 0 ? Math.round((score / (score + wrong)) * 100) : 0;

  return { score, total: questions.length, accuracy, correctRate, wrong, unattempted, timeTakenSeconds };
}

export function getDiagnosisSummary(questions: Question[], answers: Record<string, AnswerState>) {
  return aggregateDiagnosis(questions, answers);
}

export function getPacingFlags(questions: Question[], answers: Record<string, AnswerState>) {
  const pacing = aggregatePacing(questions, answers);
  
  const mapToDisplay = (ids: string[]) => ids.map(id => {
    const qIndex = questions.findIndex(q => q.id === id);
    const q = questions[qIndex];
    const timeMs = answers[id]?.timeOnQuestionMs || 0;
    return {
      questionNumber: qIndex + 1,
      questionId: id,
      timeOnQuestionMs: timeMs,
      estTimeSeconds: q?.est_time_seconds || 60,
      ratio: timeMs / ((q?.est_time_seconds || 60) * 1000)
    };
  });

  return {
    rushed: mapToDisplay(pacing.rushed).sort((a, b) => a.ratio - b.ratio),
    overthinking: mapToDisplay(pacing.overthinking).sort((a, b) => b.ratio - a.ratio)
  };
}

export function getPilotCallout(questions: Question[], answers: Record<string, AnswerState>) {
  const summary = aggregateDiagnosis(questions, answers);
  return { show: summary.MISCONCEPTION > 0, count: summary.MISCONCEPTION };
}

export function getActionPlan(
  questions: Question[],
  answers: Record<string, AnswerState>,
): SeverityGroup[] {
  const planMap: Record<Severity, Record<string, Record<string, number[]>>> = {
    REBUILD: {},
    REVIEW: {},
    BRUSH_UP: {},
    MASTERED: {},
    UNATTEMPTED: {}, // <--- ADDED THIS
  };

  questions.forEach((q, i) => {
    const ans = answers[q.id];

    const isCorrect =
      ans?.selectedOption != null
        ? ans.selectedOption === q.correctOption
        : null;

    const tag = getDiagnosisTag(
      isCorrect,
      ans?.selfReport ?? null,
      ans?.isMarkedForReview ?? false,
    );

    let sev: Severity = 'MASTERED';
    if (tag === 'BLIND_GUESS' || tag === 'MISCONCEPTION') {
      sev = 'REBUILD';
    } else if (
      tag === 'CONCEPT_GAP' ||
      tag === 'LUCKY_GUESS'
    ) {
      sev = 'REVIEW';
    } else if (tag === 'NEEDS_CONFIDENCE') {
      sev = 'BRUSH_UP';
    } else if (tag === 'MARKED_SKIPPED' || tag === 'UNATTEMPTED') {
      sev = 'UNATTEMPTED'; // <--- SEPARATED THIS
    }

    const conceptMap = (planMap[sev][q.concept] ??= {});
    const tagQuestions = (conceptMap[tag] ??= []);
    tagQuestions.push(i + 1);
  });

  // <--- ADDED UNATTEMPTED TO THE ARRAY
  return (['REBUILD', 'REVIEW', 'BRUSH_UP', 'MASTERED', 'UNATTEMPTED'] as Severity[])
    .map((sev) => {
      const conceptsList: ActionPlanConcept[] = [];

      Object.entries(planMap[sev]).forEach(([conceptName, tagsForConcept]) => {
        const tagGroups: ActionPlanTagGroup[] = Object.entries(tagsForConcept)
          .map(([tagName, questionNumbers]) => ({
            tag: tagName as DiagnosisTag,
            questions: [...questionNumbers].sort((a, b) => a - b),
          }))
          .sort((a, b) => a.tag.localeCompare(b.tag));

        conceptsList.push({
          concept: conceptName as ConceptTag,
          tagGroups,
        });
      });

      return {
        severity: sev,
        concepts: conceptsList.sort((a, b) =>
          a.concept.localeCompare(b.concept),
        ),
      };
    })
    .filter((group) => group.concepts.length > 0);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatEstimate(s: number): string {
  return `est ${s}s`;
}

export function severityMeta(sev: Severity) {
  switch (sev) {
    case 'REBUILD':
      return { label: 'REBUILD FROM SCRATCH', emoji: '🔴', colorClass: 'border-l-destructive' };
    case 'REVIEW':
      return { label: 'REVIEW SPECIFIC TOPIC', emoji: '🟡', colorClass: 'border-l-warning-solid' };
    case 'BRUSH_UP':
      return { label: 'BRUSH UP', emoji: '🟢', colorClass: 'border-l-success-solid' };
    case 'MASTERED':
      return { label: 'Mastered', emoji: '✅', colorClass: 'border-l-border' };
    case 'UNATTEMPTED':
      return { label: 'UNATTEMPTED', emoji: '⬜', colorClass: 'border-l-muted-foreground' };
  }
}


export interface ReviewItem {
  questionNumber: number;
  questionId: string;
  question: Question;
  selectedOption: number | null;
  correctOption: number;
  diagnosisTag: DiagnosisTag;
  diagnosisLabel: string;
  diagnosisEmoji: string;
  timeOnQuestionMs: number;
  estTimeSeconds: number;
  concept: ConceptTag;
  isCorrect: boolean | null;
  isMarkedForReview: boolean;
}

export function labelFor(tag: DiagnosisTag): string {
  switch (tag) {
    case 'BLIND_GUESS': return 'Blind Guess';
    case 'MISCONCEPTION': return 'Misconception Detected';
    case 'CONCEPT_GAP': return 'Concept Gap';
    case 'LUCKY_GUESS': return 'Lucky Guess';
    case 'NEEDS_CONFIDENCE': return 'Needs Confidence Practice';
    case 'MASTERED': return 'Mastered';
    case 'MARKED_SKIPPED': return 'Marked for Review (Skipped)';
    case 'UNATTEMPTED': return 'Unattempted';
  }
}

export function emojiFor(tag: DiagnosisTag): string {
  switch (tag) {
    case 'BLIND_GUESS': return '🚨';
    case 'MISCONCEPTION': return '🧠';
    case 'CONCEPT_GAP': return '📖';
    case 'LUCKY_GUESS': return '🍀';
    case 'NEEDS_CONFIDENCE': return '💪';
    case 'MASTERED': return '✅';
    case 'MARKED_SKIPPED': return '⏳';
    case 'UNATTEMPTED': return '⬜';
  }
}

export function getReviewItem(
  questions: Question[],
  answers: Record<string, AnswerState>,
  index: number,
): ReviewItem {
  const q = questions[index];
  if (!q) {
    throw new Error(
      `getReviewItem: index ${index} out of bounds (length=${questions.length})`,
    );
  }

  const a = answers[q.id];
  const isCorrect =
    a?.selectedOption != null ? a.selectedOption === q.correctOption : null;
  const tag = getDiagnosisTag(
    isCorrect,
    a?.selfReport ?? null,
    a?.isMarkedForReview ?? false,
  );

  return {
    questionNumber: index + 1,
    questionId: q.id,
    question: q,
    selectedOption: a?.selectedOption ?? null,
    correctOption: q.correctOption,
    diagnosisTag: tag,
    diagnosisLabel: labelFor(tag),
    diagnosisEmoji: emojiFor(tag),
    timeOnQuestionMs: a?.timeOnQuestionMs ?? 0,
    estTimeSeconds: q.est_time_seconds,
    concept: q.concept,
    isCorrect,
    isMarkedForReview: a?.isMarkedForReview ?? false,
  };
}