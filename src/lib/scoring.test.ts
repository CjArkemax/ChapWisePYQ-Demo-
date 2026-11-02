import { describe, it, expect } from 'vitest';
import { calculateScore, aggregateDiagnosis, aggregatePacing } from './scoring';
import type { Question, AnswerState } from '@/types';

// Mock Data
const mockQuestions: Question[] = [
  { id: 'q1', question: '', imageUrl: null, options: [], correctOption: 1, explanation: '', difficulty: 'easy', concept: 'Reflection & Plane Mirrors', year: 2024, est_time_seconds: 60 },
  { id: 'q2', question: '', imageUrl: null, options: [], correctOption: 2, explanation: '', difficulty: 'medium', concept: 'Prism & Dispersion', year: 2024, est_time_seconds: 90 },
  { id: 'q3', question: '', imageUrl: null, options: [], correctOption: 0, explanation: '', difficulty: 'hard', concept: 'Lens Formula & Magnification', year: 2024, est_time_seconds: 120 },
];

const emptyAnswer: AnswerState = {
  selectedOption: null, selfReport: null, isMarkedForReview: false,
  timeToFirstSelectMs: null, timeOnQuestionMs: 0, optionChangesCount: 0
};

describe('Scoring & Aggregation', () => {
  it('Scores 0 on all-wrong / unattempted', () => {
    const answers = { q1: { ...emptyAnswer, selectedOption: 0 }, q2: emptyAnswer, q3: emptyAnswer };
    expect(calculateScore(mockQuestions, answers)).toBe(0);
  });

  it('Scores 3 on all-correct', () => {
    const answers = { 
      q1: { ...emptyAnswer, selectedOption: 1 }, 
      q2: { ...emptyAnswer, selectedOption: 2 },
      q3: { ...emptyAnswer, selectedOption: 0 }
    };
    expect(calculateScore(mockQuestions, answers)).toBe(3);
  });

  it('Aggregates mixed diagnosis correctly', () => {
    const answers: Record<string, AnswerState> = {
      q1: { ...emptyAnswer, selectedOption: 1, selfReport: 'sure' }, // Correct + Sure = MASTERED
      q2: { ...emptyAnswer, selectedOption: 0, selfReport: 'guess' }, // Wrong + Guess = BLIND_GUESS
      q3: { ...emptyAnswer, isMarkedForReview: true } // Unattempted + Marked = MARKED_SKIPPED
    };
    
    const summary = aggregateDiagnosis(mockQuestions, answers);
    
    expect(summary.MASTERED).toBe(1);
    expect(summary.BLIND_GUESS).toBe(1);
    expect(summary.MARKED_SKIPPED).toBe(1);
    expect(summary.CONCEPT_GAP).toBe(0);
  });

  it('Aggregates pacing correctly', () => {
    const answers: Record<string, AnswerState> = {
      q1: { ...emptyAnswer, timeOnQuestionMs: 20000 }, // Rushed (20s / 60s = 0.33)
      q2: { ...emptyAnswer, timeOnQuestionMs: 250000 }, // Overthinking (250s / 90s = 2.77)
      q3: { ...emptyAnswer, timeOnQuestionMs: 120000 } // Normal (120s / 120s = 1.0)
    };

    const pacing = aggregatePacing(mockQuestions, answers);
    expect(pacing.rushed).toContain('q1');
    expect(pacing.overthinking).toContain('q2');
    expect(pacing.rushed.length).toBe(1);
    expect(pacing.overthinking.length).toBe(1);
  });
});