'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { supabase } from '@/lib/supabase';
import { getChapterById, type Chapter } from '@/lib/chapters';
import { getReviewItem } from '@/lib/report';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ExplanationAccordion } from '@/components/review/ExplainationAccordion';
import { InlineFeedback } from '@/components/review/InlineFeedback';
import { QuestionPalette } from '@/components/testPage/QuestionPalette';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnswerState, Question } from '@/types';

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading solutions...</div>}>
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const chapterParam = searchParams.get('chapter');

  const storeEmail = useTestStore((s) => s.email);
  const storeChapter = useTestStore((s) => s.selectedChapter);
  const storeAnswers = useTestStore((s) => s.answers);
  const hasHydrated = useTestStore((s) => s._hasHydrated);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [resolvedChapter, setResolvedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!storeEmail && !attemptId) {
      router.replace('/');
      return;
    }

    async function loadData() {
      try {
        // ── 1. Resolve chapter (URL param → store → attempt.chapter_id) ──
        let chapter: Chapter | null = getChapterById(chapterParam) ?? storeChapter ?? null;

        if (attemptId) {
          // If we still don't have a chapter, or want authoritative source for past attempts
          const { data: att } = await supabase
            .from('attempts')
            .select('chapter_id')
            .eq('id', attemptId)
            .single();

          const fromAttempt = getChapterById(att?.chapter_id);
          if (fromAttempt) chapter = fromAttempt;
        }

        if (!chapter) {
          router.replace('/');
          return;
        }
        setResolvedChapter(chapter);

        // ── 2. Fetch questions for the resolved chapter ──────────
        const qRes = await fetch(chapter.jsonPath);
        if (!qRes.ok) throw new Error(`HTTP ${qRes.status} for ${chapter.jsonPath}`);
        const qData: Question[] = await qRes.json();
        setQuestions(qData);

        // ── 3. Populate answers ──────────────────────────────────
        if (attemptId) {
          const { data: ansData } = await supabase
            .from('attempt_answers')
            .select('*')
            .eq('attempt_id', attemptId);

          if (ansData) {
            const reconstructed: Record<string, AnswerState> = {};
            ansData.forEach((row) => {
              reconstructed[row.question_id] = {
                selectedOption: row.selected_option,
                selfReport: row.self_report,
                isMarkedForReview: row.is_marked_for_review,
                timeOnQuestionMs: row.time_on_question_ms ?? 0,
                timeToFirstSelectMs: row.time_to_first_select_ms,
                optionChangesCount: row.option_changes_count ?? 0,
              };
            });
            setAnswers(reconstructed);
          }
        } else {
          setAnswers(storeAnswers);
        }
      } catch (err) {
        console.error(err);
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [attemptId, chapterParam, hasHydrated, storeEmail, storeChapter, storeAnswers, router]);

  if (!hasHydrated || isLoading) {
    return <div className="p-8 text-center">Loading solutions...</div>;
  }
  if (!storeEmail && !attemptId) return null;
  if (!resolvedChapter || questions.length === 0) return null;

  const item = getReviewItem(questions, answers, currentIndex);

  // Preserve chapter + attemptId across navigation back to /result
  const resultParams = new URLSearchParams();
  if (attemptId) resultParams.set('attemptId', attemptId);
  resultParams.set('chapter', resolvedChapter.id);
  const resultHref = `/result?${resultParams.toString()}`;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm md:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(resultHref)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">Answer Review</span>
            <span className="text-xs text-muted-foreground">{resolvedChapter.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Q {currentIndex + 1} / {questions.length}
          </span>
          <Button onClick={() => router.push(resultHref)} variant="default" className="bg-primary">
            Finish
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:flex-row md:p-6">
        <div className="flex-1 space-y-2">
          <ReviewCard item={item} />
          <ExplanationAccordion key={`explain-${item.questionId}`} item={item} />
          <InlineFeedback
            key={`feedback-${item.questionId}`}
            questionId={item.questionId}
          />

          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Prev
            </Button>
            <Button
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={currentIndex === questions.length - 1}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="hidden w-full shrink-0 md:block md:w-72">
          <div className="sticky top-24 rounded-xl border bg-card p-4">
            <QuestionPalette
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onNavigate={setCurrentIndex}
              isReview={true}
            />
          </div>
        </aside>

        <div className="fixed bottom-4 left-0 right-0 z-40 flex flex-col border-t bg-background md:hidden">
          <div className="border-b">
            <QuestionPalette
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              onNavigate={setCurrentIndex}
              layout="horizontal"
              isReview={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}