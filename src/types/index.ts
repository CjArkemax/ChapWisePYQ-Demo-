export type SelfReport = 'sure' | 'unsure' | 'guess' | null;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ConceptTag = 
  | 'Reflection & Plane Mirrors'
  | 'Spherical Mirrors (Concave/Convex)'
  | 'Refraction & Snell\'s Law'
  | 'Total Internal Reflection'
  | 'Prism & Dispersion'
  | 'Lens Formula & Magnification'
  | 'Power of a Lens'
  | 'Optical Instruments'
  | 'Refraction at Spherical Surfaces';

export type DiagnosisTag = 
  | 'BLIND_GUESS'         // Case 1: Wrong, Guess
  | 'MISCONCEPTION'       // Case 2: Wrong, Sure
  | 'CONCEPT_GAP'         // Case 3: Wrong, Unsure (or missing tag)
  | 'LUCKY_GUESS'         // Case 4: Correct, Guess (or missing tag)
  | 'NEEDS_CONFIDENCE'    // Case 5: Correct, Unsure
  | 'MASTERED'            // Case 6: Correct, Sure
  | 'MARKED_SKIPPED'      // Case 7: Unattempted, Marked
  | 'UNATTEMPTED';        // Case 8: Unattempted, Not Marked

export interface Question {
  id: string;
  question: string;
  imageUrl: string | null;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: Difficulty;
  concept: ConceptTag;
  year: number;
  est_time_seconds: number;
}

export interface AnswerState {
  selectedOption: number | null;
  selfReport: SelfReport;
  isMarkedForReview: boolean;
  timeToFirstSelectMs: number | null;
  timeOnQuestionMs: number;
  optionChangesCount: number;
}