'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { 
  getHeroStats, 
  getDiagnosisSummary, 
  getPacingFlags, 
  getPilotCallout,
  getActionPlan 
} from '@/lib/report';
import { ScoreDonut } from '@/components/result/ScoreDonut';
import { MetricsBar } from '@/components/result/MetricsBar';
import { PerformanceLevel } from '@/components/result/PerformanceLevel';
import { DiagnosisPills } from '@/components/result/DiagnosisPills';
import { PilotCallout } from '@/components/result/PilotCallout';
import { PacingFlags } from '@/components/result/PacingFlags';
import { ActionPlan } from '@/components/result/ActionPlan';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import type { Question } from '@/types';

export default function ResultPage() {
  const router = useRouter();
  const email = useTestStore(s => s.email);
  const answers = useTestStore(s => s.answers);
  const timeRemainingSeconds = useTestStore(s => s.timeRemainingSeconds);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!email) { router.replace('/'); return; }
    fetch('/ray-optics.json').then(res => res.json()).then(data => {
      setQuestions(data);
      setIsLoading(false);
    });
  }, [email, router]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!email) return null;

  const timeTakenSeconds = (40 * 60) - timeRemainingSeconds;
  
  // Data Contract
  const stats = getHeroStats(questions, answers, timeTakenSeconds);
  const diagnosisSummary = getDiagnosisSummary(questions, answers);
  const callout = getPilotCallout(questions, answers);
  const pacing = getPacingFlags(questions, answers);
  const actionPlan = getActionPlan(questions, answers);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-8">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-70" onClick={() => router.push('/')}>
          <ChevronLeft className="h-5 w-5" />
          <span className="font-semibold text-foreground">Back to Dashboard</span>
        </div>
        <span className="font-bold text-primary hidden md:block">Ray Optics — Result</span>
        <Button className="hidden md:flex" onClick={() => router.push('/review')}>
          View Solutions
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[900px] px-4 md:px-8 mt-6 space-y-6">
        
        {/* Hero Panel */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-label text-muted-foreground uppercase tracking-wider">Mirror Report</span>
            <h1 className="text-headline-md font-bold text-foreground">Ray Optics</h1>
            <p className="text-body text-subtle-foreground">Class 12 Physics • KCET Standard</p>
            
            <div className="pt-4 flex flex-col gap-2 text-sm font-medium">
              <div className="flex items-center gap-2"><span className="text-success-solid">✅</span> {stats.score} Correct</div>
              <div className="flex items-center gap-2"><span className="text-destructive">❌</span> {stats.wrong} Wrong</div>
              <div className="flex items-center gap-2"><span className="text-muted-foreground">⬜</span> {stats.unattempted} Unattempted</div>
            </div>
          </div>

          <ScoreDonut score={stats.score} total={stats.total} />
        </div>

        {/* Metrics & Performance */}
        <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
          <MetricsBar 
            accuracy={stats.accuracy} 
            timeTakenSeconds={stats.timeTakenSeconds} 
            correctRate={stats.correctRate} 
          />
          <PerformanceLevel accuracy={stats.accuracy} />
        </div>

        {/* Diagnosis Pills */}
        <DiagnosisPills summary={diagnosisSummary} />

        {/* Pilot Callout */}
        <PilotCallout count={callout.count} />

        {/* Pacing Flags */}
        <PacingFlags rushed={pacing.rushed} overthinking={pacing.overthinking} />

        {/* Action Plan (NEW) */}
        <ActionPlan groups={actionPlan} />

        {/* Desktop CTA */}
        <div className="hidden md:flex flex-col items-center justify-center pt-6 pb-12 gap-3">
          <Button size="lg" onClick={() => router.push('/review')}>
            View Detailed Solutions
          </Button>
          <button onClick={() => router.push('/')} className="text-sm text-muted-foreground hover:underline">
            or Back to Dashboard
          </button>
        </div>

        {/* Mobile CTA */}
        <div className="md:hidden flex flex-col gap-3 pt-4">
          <Button className="w-full" size="lg" onClick={() => router.push('/review')}>
            View Solutions
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>

      </main>
    </div>
  );
}