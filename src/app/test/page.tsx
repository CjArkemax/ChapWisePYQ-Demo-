'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useTestStore } from '@/store/useTestStore';
import { useTimer } from '@/hooks/useTimer';
import { supabase } from '@/lib/supabase';
import { calculateScore, aggregateDiagnosis } from '@/lib/scoring';

import { TestHeader } from '@/components/testPage/TestHeader';
import { QuestionCard } from '@/components/testPage/QuestionCard';
import { QuestionPalette } from '@/components/testPage/QuestionPalette';
import { SubmitModal } from '@/components/testPage/SubmitModal';
import { Button } from '@/components/ui/button';

import type { Question, AnswerState } from '@/types';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zustand subscriptions
  const email = useTestStore((s) => s.email);
  const chapter = useTestStore((s) => s.selectedChapter);
  const currentIndex = useTestStore((s) => s.currentQuestionIndex);
  const answers = useTestStore((s) => s.answers);
  const timeRemainingSeconds = useTestStore((s) => s.timeRemainingSeconds);
  const setCurrentQuestion = useTestStore((s) => s.setCurrentQuestion);
  const updateAnswer = useTestStore((s) => s.updateAnswer);
  const hasHydrated = useTestStore((s) => s._hasHydrated);

  const enteredAtRef = useRef<number>(Date.now());
  const isSubmittingRef = useRef<boolean>(false);

  // ── Load questions for the selected chapter ─────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;
    if (!email) {
      router.replace('/');
      return;
    }
    if (!chapter) {
      router.replace('/chapters');
      return;
    }

    const jsonPath = chapter.jsonPath;

    async function loadQuestions() {
      try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Question[] = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to load ${jsonPath}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [email, chapter, hasHydrated, router]);

  // Reset "entered at" timestamp on question change
  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [currentIndex]);

  // ── Submit handler ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      // Read fresh state — avoids stale closure over email/chapter/index
      const state = useTestStore.getState();
      const currentEmail = state.email;
      const currentChapter = state.selectedChapter;
      const currentIndexNow = state.currentQuestionIndex;

      if (
        !currentEmail ||
        !currentChapter ||
        questions.length === 0 ||
        isSubmittingRef.current
      ) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        // Commit time on current question before scoring
        const now = Date.now();
        const currentQ = questions[currentIndexNow];
        if (currentQ) {
          const existingTime = state.answers[currentQ.id]?.timeOnQuestionMs ?? 0;
          state.updateAnswer(currentQ.id, {
            timeOnQuestionMs: existingTime + (now - enteredAtRef.current),
          });
        }

        const finalState = useTestStore.getState();
        const finalAnswers = finalState.answers;
        const timeRemaining = finalState.timeRemainingSeconds;

        const score = calculateScore(questions, finalAnswers);
        const diagnosisSummary = aggregateDiagnosis(questions, finalAnswers);

        // Chapter-driven duration for accurate time-taken
        const totalDuration = currentChapter.timeLimitMinutes * 60;
        const timeTaken = totalDuration - timeRemaining;

        // 1. Insert attempt (awaited — need id for FK)
        const { data: attempt, error: attemptErr } = await supabase
          .from('attempts')
          .insert({
            email: currentEmail,
            chapter_id: currentChapter.id, // ← NEW
            submitted_at: new Date().toISOString(),
            time_taken_seconds: timeTaken,
            score,
            accuracy: Math.round((score / questions.length) * 100),
            diagnosis_summary: diagnosisSummary,
          })
          .select()
          .single();

        if (attemptErr || !attempt) {
          throw attemptErr ?? new Error('Attempt insert returned no row');
        }

        useTestStore.getState().setAttemptId(attempt.id);

        // 2. Bulk insert per-question rows
        const answersData = questions.map((q) => {
          const ans = finalAnswers[q.id];
          return {
            attempt_id: attempt.id,
            question_id: q.id,
            selected_option: ans?.selectedOption ?? null,
            is_correct:
              ans?.selectedOption != null
                ? ans.selectedOption === q.correctOption
                : null,
            self_report: ans?.selfReport ?? null,
            time_on_question_ms: ans?.timeOnQuestionMs ?? 0,
            time_to_first_select_ms: ans?.timeToFirstSelectMs ?? null,
            option_changes_count: ans?.optionChangesCount ?? 0,
            is_marked_for_review: ans?.isMarkedForReview ?? false,
          };
        });

        const { error: answersErr } = await supabase
          .from('attempt_answers')
          .insert(answersData);
        if (answersErr) throw answersErr;

        if (!isAutoSubmit) toast.success('Test submitted successfully!');
        router.push('/result');
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : 'Error submitting test';
        toast.error(message);
        // Release guard so user can retry
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [questions, router],
  );

  useTimer(() => {
    toast.warning("Time's up! Submitting your test...");
    handleSubmit(true);
  });

  // ── Navigation ──────────────────────────────────────────────────────
  const handleNavigate = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const currentQ = questions[currentIndex];
    if (currentQ) {
      const state = useTestStore.getState();
      const existingTime = state.answers[currentQ.id]?.timeOnQuestionMs ?? 0;
      state.updateAnswer(currentQ.id, {
        timeOnQuestionMs: existingTime + (Date.now() - enteredAtRef.current),
      });
    }
    setCurrentQuestion(targetIndex);
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const qId = currentQ.id;
    const state = useTestStore.getState();
    const currentAns = state.answers[qId];

    const updates: Partial<AnswerState> = { selectedOption: optionIndex };

    if (currentAns?.selectedOption == null) {
      updates.timeToFirstSelectMs = Date.now() - enteredAtRef.current;
    } else if (currentAns.selectedOption !== optionIndex) {
      updates.optionChangesCount = (currentAns.optionChangesCount || 0) + 1;
    }
    updateAnswer(qId, updates);
  };

  const handleToggleMark = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.id;
    const currentMark = answers[qId]?.isMarkedForReview || false;
    updateAnswer(qId, { isMarkedForReview: !currentMark });
  };

  // ── Render guards ───────────────────────────────────────────────────
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restoring your test…</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No chapter selected — redirecting…</p>
      </div>
    );
  }

  if (isLoading || !questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading test…</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Question not found.</p>
      </div>
    );
  }

  const currentAns: AnswerState = answers[currentQ.id] || {
    selectedOption: null,
    selfReport: null,
    isMarkedForReview: false,
    timeToFirstSelectMs: null,
    timeOnQuestionMs: 0,
    optionChangesCount: 0,
  };

  const unattemptedCount = questions.filter((q) => {
    const a = answers[q.id];
    return a?.selectedOption == null;
  }).length;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-6">
      <TestHeader
        timeRemainingSeconds={timeRemainingSeconds}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:flex-row md:p-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs">{chapter.title}</span>
          </div>

          <QuestionCard
            question={currentQ}
            index={currentIndex}
            answerState={currentAns}
            onSelectOption={handleSelectOption}
            onSelectConfidence={(report) =>
              updateAnswer(currentQ.id, { selfReport: report })
            }
          />

          <div className="flex items-center justify-between pt-4 pb-4">
            <Button
              variant="outline"
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Prev
            </Button>

            <Button
              variant="outline"
              onClick={handleToggleMark}
              className={
                currentAns.isMarkedForReview
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90 border-warning-solid'
                  : ''
              }
            >
              <Flag className="mr-2 h-4 w-4" />
              {currentAns.isMarkedForReview ? 'Marked for review' : 'Mark for review'}
            </Button>

            {currentIndex === questions.length - 1 ? (
              <Button onClick={() => setIsSubmitModalOpen(true)}>Submit</Button>
            ) : (
              <Button onClick={() => handleNavigate(currentIndex + 1)}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden w-full shrink-0 md:block md:w-72">
          <div className="sticky top-24 rounded-xl border bg-card p-4">
            <QuestionPalette
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onNavigate={handleNavigate}
            />
          </div>
        </aside>
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-40 flex flex-col border-t bg-background md:hidden">
        <div className="border-b">
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
            layout="horizontal"
          />
        </div>
      </div>

      <SubmitModal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
        unattemptedCount={unattemptedCount}
        onConfirm={() => handleSubmit(false)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}