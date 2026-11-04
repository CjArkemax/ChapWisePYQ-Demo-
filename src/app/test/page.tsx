'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useTestStore } from '@/store/useTestStore';
import { useTimer } from '@/hooks/useTimer';
import { supabase } from '@/lib/supabase';
import { calculateScore, aggregateDiagnosis, aggregatePacing } from '@/lib/scoring';

import { TestHeader } from '@/components/testPage/TestHeader';
import { QuestionCard } from '@/components/testPage/QuestionCard';
import { QuestionPalette } from '@/components/testPage/QuestionPalette';
import { SubmitModal } from '@/components/testPage/SubmitModal';
import { Button } from '@/components/ui/button';

import type { Question } from '@/types';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zustand
  const email = useTestStore((s) => s.email);
  const currentIndex = useTestStore((s) => s.currentQuestionIndex);
  const answers = useTestStore((s) => s.answers);
  const timeRemainingSeconds = useTestStore((s) => s.timeRemainingSeconds);
  const setCurrentQuestion = useTestStore((s) => s.setCurrentQuestion);
  const updateAnswer = useTestStore((s) => s.updateAnswer);
  
  const enteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!email) {
      router.replace('/');
      return;
    }
    async function loadQuestions() {
      try {
        const res = await fetch('/ray-optics.json');
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        toast.error('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [email, router]);

  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [currentIndex]);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!email || questions.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const now = Date.now();
      const currentQ = questions[currentIndex];
      if (currentQ) {
        const timeSpent = now - enteredAtRef.current;
        const existingTime = answers[currentQ.id]?.timeOnQuestionMs || 0;
        updateAnswer(currentQ.id, { timeOnQuestionMs: existingTime + timeSpent });
      }

      const finalState = useTestStore.getState();
      const finalAnswers = finalState.answers;

      const score = calculateScore(questions, finalAnswers);
      const diagnosisSummary = aggregateDiagnosis(questions, finalAnswers);
      const timeTaken = (40 * 60) - timeRemainingSeconds;

      const { data: attempt, error: attemptErr } = await supabase
        .from('attempts')
        .insert({
          email,
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTaken,
          score: score,
          accuracy: Math.round((score / 30) * 100),
          diagnosis_summary: diagnosisSummary,
        })
        .select()
        .single();

      if (attemptErr) throw attemptErr;

      const answersData = questions.map((q) => {
        const ans = finalAnswers[q.id];
        return {
          attempt_id: attempt.id,
          question_id: q.id,
          selected_option: ans?.selectedOption ?? null,
          is_correct: ans?.selectedOption === q.correctOption,
          self_report: ans?.selfReport ?? null,
          time_on_question_ms: ans?.timeOnQuestionMs || 0,
          time_to_first_select_ms: ans?.timeToFirstSelectMs ?? null,
          option_changes_count: ans?.optionChangesCount || 0,
          is_marked_for_review: ans?.isMarkedForReview || false,
        };
      });

      const { error: answersErr } = await supabase.from('attempt_answers').insert(answersData);
      if (answersErr) throw answersErr;

      if (!isAutoSubmit) toast.success('Test submitted successfully!');
      router.push('/result');

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error submitting test');
      setIsSubmitting(false);
    }
  }, [email, questions, currentIndex, answers, timeRemainingSeconds, updateAnswer, router, isSubmitting]);

  useTimer(() => {
    toast.warning("Time's up! Submitting your test...");
    handleSubmit(true);
  });

  const handleNavigate = (targetIndex: number) => {
    const currentQ = questions[currentIndex];
    if (currentQ) {
      const timeSpent = Date.now() - enteredAtRef.current;
      const existingTime = answers[currentQ.id]?.timeOnQuestionMs || 0;
      updateAnswer(currentQ.id, { timeOnQuestionMs: existingTime + timeSpent });
    }
    setCurrentQuestion(targetIndex);
  };

  const handleSelectOption = (optionIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    const qId = currentQ.id;
    const currentAns = answers[qId];
    const updates: any = { selectedOption: optionIndex };
    
    if (currentAns?.selectedOption === null || currentAns?.selectedOption === undefined) {
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

  if (isLoading || !questions.length) return <div className="p-8 text-center">Loading test...</div>;

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div className="p-8 text-center">Question not found.</div>;

  const currentAns = answers[currentQ.id] || {
    selectedOption: null, selfReport: null, isMarkedForReview: false,
    timeToFirstSelectMs: null, timeOnQuestionMs: 0, optionChangesCount: 0
  };
  
  const unattemptedCount = questions.filter(q => {
    const a = answers[q.id];
    return !a || a.selectedOption === null || a.selectedOption === undefined;
  }).length;

    return (
    <div className="min-h-screen bg-background pb-32 md:pb-6">
      <TestHeader 
        timeRemainingSeconds={timeRemainingSeconds} 
        onSubmitClick={() => setIsSubmitModalOpen(true)} 
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:flex-row md:p-6">
        {/* Main Question Area */}
        <div className="flex-1 space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </div>

          <QuestionCard 
            question={currentQ}
            index={currentIndex}
            answerState={currentAns}
            onSelectOption={handleSelectOption}
            onSelectConfidence={(report) => updateAnswer(currentQ.id, { selfReport: report })}
          />

          {/* Controls */}
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
              className={currentAns.isMarkedForReview ? "bg-warning text-warning-foreground hover:bg-warning/90 border-warning-solid" : ""}
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

        {/* Desktop Palette */}
        <aside className="hidden w-full md:w-72 shrink-0 md:block">
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

      {/* Mobile Sticky Footer (Horizontal Palette + Submit) */}
      <div className="fixed bottom-4 left-0 right-0 border-t bg-background flex flex-col md:hidden z-40">
        
        {/* Tiny Legend */}
        {/* <div className="flex items-center justify-center gap-3 px-2 pt-2 pb-1 text- text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-success" />
            <span>Ans</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-warning" />
            <span>Marked</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-success relative">
            <div className="absolute top-0 right-0 h-1 w-1 rounded-full bg-warning" />
            </div>
            <span>Ans+Mark</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm border border-border bg-background" />
            <span>Unvisited</span>
        </div>
        </div> */}

        {/* Horizontal Scrollable Strip */}
        <div className="border-b">
          <QuestionPalette 
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
            layout="horizontal"
          />
        </div>
        
        {/* Submit Button */}
        {/* <div className="p-3">
          <Button className="w-full" onClick={() => setIsSubmitModalOpen(true)}>
            Submit Test
          </Button>
        </div> */}
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