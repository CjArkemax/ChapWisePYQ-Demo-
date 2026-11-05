'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import {
  getHeroStats,
  getDiagnosisSummary,
  getPacingFlags,
  getPilotCallout,
  getActionPlan,
} from '@/lib/report';
import { getChapterById, type Chapter } from '@/lib/chapters';
import { ScoreDonut } from '@/components/result/ScoreDonut';
import { MetricsBar } from '@/components/result/MetricsBar';
import { PerformanceLevel } from '@/components/result/PerformanceLevel';
import { DiagnosisPills } from '@/components/result/DiagnosisPills';
import { PilotCallout } from '@/components/result/PilotCallout';
import { PacingFlags } from '@/components/result/PacingFlags';
import { ActionPlan } from '@/components/result/ActionPlan';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronLeft, CircleDashed, XCircle } from 'lucide-react';
import type { AnswerState, Question } from '@/types';
import { supabase } from '@/lib/supabase';

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading report...</div>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const storeEmail = useTestStore((s) => s.email);
  const storeChapter = useTestStore((s) => s.selectedChapter);
  const storeAnswers = useTestStore((s) => s.answers);
  const storeTimeRemaining = useTestStore((s) => s.timeRemainingSeconds);
  const hasHydrated = useTestStore((s) => s._hasHydrated);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [resolvedChapter, setResolvedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!storeEmail && !attemptId) {
      router.replace('/');
      return;
    }

    async function loadData() {
      try {
        // ── 1. Resolve chapter ────────────────────────────────
        //  Live path: use store's chapter
        //  Attempt path: prefer attempt.chapter_id (authoritative for this data)
        let chapter: Chapter | null = storeChapter ?? null;
        let attemptRow: { time_taken_seconds: number | null } | null = null;
        let answerRows: any[] = [];

        if (attemptId) {
          const { data: att } = await supabase
            .from('attempts')
            .select('*')
            .eq('id', attemptId)
            .single();

          if (att) {
            attemptRow = att;
            const fromAttempt = getChapterById(att.chapter_id);
            if (fromAttempt) chapter = fromAttempt;
          }

          const { data: ansData } = await supabase
            .from('attempt_answers')
            .select('*')
            .eq('attempt_id', attemptId);
          answerRows = ansData ?? [];
        }

        if (!chapter) {
          // No store chapter AND no attempt chapter_id → cannot proceed
          router.replace('/');
          return;
        }
        setResolvedChapter(chapter);

        // ── 2. Fetch questions from the resolved chapter ───────
        const qRes = await fetch(chapter.jsonPath);
        if (!qRes.ok) throw new Error(`HTTP ${qRes.status} for ${chapter.jsonPath}`);
        const qData: Question[] = await qRes.json();
        setQuestions(qData);

        // ── 3. Populate answers + timeTaken ─────────────────────
        if (attemptRow && answerRows.length) {
          setTimeTaken(attemptRow.time_taken_seconds ?? 0);
          const reconstructed: Record<string, AnswerState> = {};
          answerRows.forEach((row) => {
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
        } else {
          // Live submit path — chapter drives the duration
          setTimeTaken(chapter.timeLimitMinutes * 60 - storeTimeRemaining);
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
  }, [attemptId, hasHydrated, storeEmail, storeChapter, storeTimeRemaining, router]);

  if (!hasHydrated || isLoading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }
  if (!resolvedChapter) return null; // redirect in-flight

  const stats = getHeroStats(questions, answers, timeTaken);
  const diagnosisSummary = getDiagnosisSummary(questions, answers);
  const callout = getPilotCallout(questions, answers);
  const pacing = getPacingFlags(questions, answers);
  const actionPlan = getActionPlan(questions, answers);

  // Pass chapter explicitly to /review so it can resolve jsonPath
  const reviewHref = attemptId
    ? `/review?attemptId=${attemptId}&chapter=${resolvedChapter.id}`
    : `/review?chapter=${resolvedChapter.id}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-8">
        <div
          className="flex cursor-pointer items-center gap-2 hover:opacity-70"
          onClick={() => router.push('/home')}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-semibold text-foreground">Back to Home</span>
        </div>
        <span className="hidden font-bold text-primary md:block">
          {resolvedChapter.title} — Result
        </span>
        <Button className="hidden md:flex" onClick={() => router.push(reviewHref)}>
          View Solutions
        </Button>
      </header>

      <main className="mx-auto mt-6 w-full max-w-[900px] space-y-6 px-4 pb-12 sm:px-6 md:px-8">
        {/* ── Hero: Score + Donut ─────────────────────────── */}
        <section className="panel flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
          <div className="w-full space-y-2 text-center md:text-left">
            <span className="text-label uppercase tracking-widest text-muted-foreground">
              Mirror Report
            </span>
            <h1 className="text-headline-lg font-bold text-foreground">
              {resolvedChapter.title}
            </h1>
            <p className="text-body text-subtle-foreground">
              KCET PYQ Chapter Test
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success px-3 py-1.5 text-label font-semibold text-success-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {stats.score} Correct
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger-border bg-danger px-3 py-1.5 text-label font-semibold text-danger-foreground">
                <XCircle className="h-3.5 w-3.5" />
                {stats.wrong} Wrong
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-label font-semibold text-muted-foreground">
                <CircleDashed className="h-3.5 w-3.5" />
                {stats.unattempted} Unattempted
              </span>
            </div>
          </div>

          <ScoreDonut score={stats.score} total={stats.total} />
        </section>

        {/* ── Metrics + Performance Level ─────────────────── */}
        <section className="panel space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-headline-sm font-bold text-foreground">
              Performance Metrics
            </h2>
          </div>
          <MetricsBar
            accuracy={stats.accuracy}
            timeTakenSeconds={stats.timeTakenSeconds}
            correctRate={stats.correctRate}
          />
          <PerformanceLevel accuracy={stats.accuracy} />
        </section>

        <DiagnosisPills summary={diagnosisSummary} />
        <PilotCallout count={callout.count} />
        <PacingFlags rushed={pacing.rushed} overthinking={pacing.overthinking} />
        <ActionPlan groups={actionPlan} />

        {/* ── CTAs: desktop ───────────────────────────────── */}
        <div className="hidden flex-col items-center justify-center gap-3 pt-2 md:flex">
          <Button size="lg" onClick={() => router.push(reviewHref)}>
            View Detailed Solutions
          </Button>
          <button
            onClick={() => router.push('/home')}
            className="text-body text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            or Back to Home
          </button>
        </div>

        {/* ── CTAs: mobile ────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-2 md:hidden">
          <Button className="w-full" size="lg" onClick={() => router.push(reviewHref)}>
            View Solutions
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/home')}>
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
}