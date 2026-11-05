import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerState } from '@/types';

export interface Chapter {
  id: string;
  title: string;
  jsonPath: string;
  timeLimitMinutes: number;
}

interface TestState {
  email: string;
  currentQuestionIndex: number;
  answers: Record<string, AnswerState>;
  timeRemainingSeconds: number;
  isSubmitted: boolean;
  attemptId: string | null;
  _hasHydrated: boolean;
  selectedChapter: Chapter | null;

  // Actions
  setChapter: (chapter: Chapter) => void;
  setEmail: (email: string) => void;
  setCurrentQuestion: (index: number) => void;
  updateAnswer: (questionId: string, updates: Partial<AnswerState>) => void;
  tickTimer: () => void;
  setSubmitted: (status: boolean) => void;
  setAttemptId: (id: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  resetStore: () => void;
}

const initialAnswerState: AnswerState = {
  selectedOption: null,
  selfReport: null,
  isMarkedForReview: false,
  timeToFirstSelectMs: null,
  timeOnQuestionMs: 0,
  optionChangesCount: 0,
};

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      email: '',
      currentQuestionIndex: 0,
      answers: {},
      timeRemainingSeconds: 0,      // set when chapter is picked
      isSubmitted: false,
      attemptId: null,
      _hasHydrated: false,
      selectedChapter: null,

      setEmail: (email) => set({ email }),
      setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

      // Setting the chapter immediately drives the timer
      setChapter: (chapter) =>
        set({
          selectedChapter: chapter,
          timeRemainingSeconds: chapter.timeLimitMinutes * 60,
        }),

      updateAnswer: (questionId, updates) =>
        set((state) => {
          const currentAnswer = state.answers[questionId] ?? initialAnswerState;
          return {
            answers: {
              ...state.answers,
              [questionId]: { ...currentAnswer, ...updates },
            },
          };
        }),

      tickTimer: () =>
        set((state) => ({
          timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1),
        })),

      setSubmitted: (status) => set({ isSubmitted: status }),
      setAttemptId: (id) => set({ attemptId: id }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      resetStore: () =>
        set({
          email: '',
          currentQuestionIndex: 0,
          answers: {},
          timeRemainingSeconds: 0,   // recomputed on next setChapter
          isSubmitted: false,
          attemptId: null,
          selectedChapter: null,
        }),
    }),
    {
      name: 'chapwise-test-storage',   // ← renamed
      version: 2,                       // ← new — invalidates old state
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },

    }
  )
);