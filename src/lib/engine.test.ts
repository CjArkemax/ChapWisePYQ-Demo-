import { describe, it, expect } from 'vitest';
import { getDiagnosisTag, getPacingFlag } from './engine';

describe('Diagnosis Engine (8 Cases + 2 Fallbacks)', () => {
  it('Case 1: Wrong + Guess -> BLIND_GUESS', () => {
    expect(getDiagnosisTag(false, 'guess', false)).toBe('BLIND_GUESS');
  });
  it('Case 2: Wrong + Sure -> MISCONCEPTION', () => {
    expect(getDiagnosisTag(false, 'sure', false)).toBe('MISCONCEPTION');
  });
  it('Case 3: Wrong + Unsure -> CONCEPT_GAP', () => {
    expect(getDiagnosisTag(false, 'unsure', false)).toBe('CONCEPT_GAP');
  });
  it('Case 4: Correct + Guess -> LUCKY_GUESS', () => {
    expect(getDiagnosisTag(true, 'guess', false)).toBe('LUCKY_GUESS');
  });
  it('Case 5: Correct + Unsure -> NEEDS_CONFIDENCE', () => {
    expect(getDiagnosisTag(true, 'unsure', false)).toBe('NEEDS_CONFIDENCE');
  });
  it('Case 6: Correct + Sure -> MASTERED', () => {
    expect(getDiagnosisTag(true, 'sure', false)).toBe('MASTERED');
  });
  it('Case 7: Unattempted + Marked -> MARKED_SKIPPED', () => {
    expect(getDiagnosisTag(null, null, true)).toBe('MARKED_SKIPPED');
  });
  it('Case 8: Unattempted + Unmarked -> UNATTEMPTED', () => {
    expect(getDiagnosisTag(null, null, false)).toBe('UNATTEMPTED');
  });
  it('Case 9 (Fallback): Wrong + Null -> CONCEPT_GAP', () => {
    expect(getDiagnosisTag(false, null, false)).toBe('CONCEPT_GAP');
  });
  it('Case 10 (Fallback): Correct + Null -> LUCKY_GUESS', () => {
    expect(getDiagnosisTag(true, null, false)).toBe('LUCKY_GUESS');
  });
});

describe('Pacing Engine', () => {
  it('Flags Rushed (< 0.4 ratio)', () => {
    // 30s on a 90s question = 0.33 ratio
    expect(getPacingFlag(30000, 90)).toBe('RUSHED'); 
  });
  it('Flags Overthinking (> 2.5 ratio)', () => {
    // 200s on a 60s question = 3.33 ratio
    expect(getPacingFlag(200000, 60)).toBe('OVERTHINKING');
  });
  it('Flags Normal (Between 0.4 and 2.5)', () => {
    // 90s on a 90s question = 1.0 ratio
    expect(getPacingFlag(90000, 90)).toBe('NORMAL');
  });
});