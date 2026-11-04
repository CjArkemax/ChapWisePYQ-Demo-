import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnswerState } from '@/types';

interface TestState {
  email: string;
  currentQuestionIndex: number;
  answers: Record<string, AnswerState>;
  timeRemainingSeconds: number;
  isSubmitted: boolean;

  // Actions
  setEmail: (email: string) => void;
  setCurrentQuestion: (index: number) => void;
  updateAnswer: (questionId: string, updates: Partial<AnswerState>) => void;
  tickTimer: () => void;
  setSubmitted: (status: boolean) => void;
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
      timeRemainingSeconds: 40 * 60, // 40 minutes
      isSubmitted: false,

      setEmail: (email) => set({ email }),
      setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
      
      updateAnswer: (questionId, updates) => set((state) => {
        const currentAnswer = state.answers[questionId] || initialAnswerState;
        return {
          answers: {
            ...state.answers,
            [questionId]: { ...currentAnswer, ...updates },
          },
        };
      }),

      tickTimer: () => set((state) => ({ 
        timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1) 
      })),

      setSubmitted: (status) => set({ isSubmitted: status }),
      
      resetStore: () => set({ 
        email: '', 
        currentQuestionIndex: 0, 
        answers: {}, 
        timeRemainingSeconds: 40 * 60, 
        isSubmitted: false 
      }),
    }),
    {
      name: 'ray-optics-test-storage', // localStorage key
    }
  )
);