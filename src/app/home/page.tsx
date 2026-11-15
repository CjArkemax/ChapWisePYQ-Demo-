'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronRight, Play, LogOut, ClipboardList, Clock, Trophy, History, FileText, Target, Sparkles, Heart } from 'lucide-react';
import { formatDuration } from '@/lib/report';

interface PastAttempt {
  id: string;
  score: number;
  submitted_at: string;
  time_taken_seconds: number;
}

// Per-chapter question count for display (not in Chapter type — display only)
const QUESTION_COUNT: Record<string, number> = {
  'ray-optics': 30,
  'motion-straight-line': 11,
  'electrostatics': 30,
};

const scoreTone = (score: number, total: number) => {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 80) return 'success';
  if (pct >= 50) return 'warning';
  return 'danger';
};

const toneStyles: Record<string, string> = {
  success: 'border-success-border bg-success text-success-foreground',
  warning: 'border-warning-border bg-warning text-warning-foreground',
  danger: 'border-danger-border bg-danger text-danger-foreground',
};

export default function HomePage() {
  const router = useRouter();
  const email = useTestStore((s) => s.email);
  const chapter = useTestStore((s) => s.selectedChapter);
  const hasHydrated = useTestStore((s) => s._hasHydrated);
  const resetStore = useTestStore((s) => s.resetStore);

  const [attempts, setAttempts] = useState<PastAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const totalQuestions = chapter ? QUESTION_COUNT[chapter.id] ?? 30 : 30;

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

    async function fetchAttempts() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('attempts')
        .select('id, score, submitted_at, time_taken_seconds')
        .eq('email', email)
        .eq('chapter_id', chapter!.id)
        .order('submitted_at', { ascending: false });

      if (!error && data) setAttempts(data);
      setIsLoading(false);
    }
    fetchAttempts();
  }, [email, chapter, hasHydrated, router]);

  const handleStartTest = () => {
    if (!chapter) return; // unreachable — render guard prevents it

    // Capture before reset wipes everything
    const currentEmail = email;
    const currentChapter = chapter;

    resetStore(); // wipes email + chapter + timer

    // Restore — setChapter also resets timeRemainingSeconds to timeLimitMinutes * 60
    useTestStore.getState().setEmail(currentEmail);
    useTestStore.getState().setChapter(currentChapter);

    router.push('/test');
  };

  if (!hasHydrated || !email || !chapter || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-label font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const bestScore =
    attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top brand bar ─────────────────────────────── */}
      <header className="w-full border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-headline-sm font-bold text-foreground">
              ChapWisePYQ(demo)
            </span>
          </div>
          <button
            onClick={() => {
              resetStore();
              router.replace('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-label font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out / Switch user
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pb-16">
        {/* ── Greeting ────────────────────────────────── */}
        <div className="mt-10 text-center space-y-2">
          <h1 className="text-display text-foreground">Welcome back! 👋</h1>
          <p className="text-body-lg text-muted-foreground">
            Logged in as <span className="font-semibold text-foreground">{email}</span>
          </p>
          <button
            onClick={() => {
              // Keep email, drop chapter → back to picker
              const currentEmail = email;
              resetStore();
              useTestStore.getState().setEmail(currentEmail);
              router.push('/chapters');
            }}
            className="mt-1 text-label font-semibold text-primary underline-offset-4 hover:underline"
          >
            Change chapter
          </button>
        </div>

        {/* ── Quick stats (this chapter) ───────────────── */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            {
              icon: History,
              label: 'Attempts',
              value: String(attempts.length),
              badge: 'border-border bg-card text-foreground',
            },
            {
              icon: Trophy,
              label: 'Best Score',
              value: attempts.length ? `${bestScore}/${totalQuestions}` : '—',
              badge: 'border-success-border bg-success text-success-foreground',
            },
            {
              icon: Target,
              label: 'Average',
              value: attempts.length ? `${avgScore}/${totalQuestions}` : '—',
              badge: 'border-warning-border bg-warning text-warning-foreground',
            },
          ].map(({ icon: Icon, label, value, badge }) => (
            <div key={label} className="panel flex flex-col items-center gap-1 p-4 text-center">
              <span
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-lg border ${badge}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-headline-sm font-bold text-foreground tabular-nums">{value}</p>
              <p className="text-label text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Test Rules + CTA ─────────────────────────── */}
        <div className="panel mt-8 space-y-5 p-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground">
              <ClipboardList className="h-4 w-4" />
            </span>
            <h2 className="text-headline-md font-bold text-foreground">
              {chapter.title} — Test Rules
            </h2>
          </div>

          <ul className="space-y-3">
            {[
              <>The test contains <strong className="text-foreground">{totalQuestions} questions</strong>.</>,
              <>You have <strong className="text-foreground">{chapter.timeLimitMinutes} minutes</strong> to complete it.</>,
              <>Tag your confidence (Sure / Unsure / Guess) after every answer for accurate diagnosis.</>,
              <>Do not refresh while submitting. (Your progress is saved automatically).</>,
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-body text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-label font-bold text-secondary-foreground">
                  {i + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full" size="lg" onClick={handleStartTest}>
            <Play className="mr-2 h-4 w-4" /> Start New Test
          </Button>
        </div>

        {/* ── Past Attempts (this chapter) ─────────────── */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-headline-md font-bold text-foreground">
              Past Attempts — {chapter.title}
            </h2>
          </div>

          {attempts.length === 0 ? (
            <div className="guest-banner text-body text-muted-foreground">
              No attempts yet for this chapter. Start one above!
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((att, index) => {
                const tone = scoreTone(att.score, totalQuestions);
                return (
                  <button
                    key={att.id}
                    onClick={() => router.push(`/result?attemptId=${att.id}`)}
                    className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-label font-bold text-secondary-foreground tabular-nums">
                        {String(attempts.length - index).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">
                          Attempt {attempts.length - index}
                        </p>
                        <p className="text-label text-muted-foreground">
                          {new Date(att.submitted_at).toLocaleDateString()}
                          <span className="mx-1.5">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(att.time_taken_seconds * 1000)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-label font-bold tabular-nums ${toneStyles[tone]}`}
                      >
                        {att.score}/{totalQuestions}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-8 text-center">
          <p className="text-headline-sm font-bold text-foreground">ChapWisePYQ(demo)</p>
          <p className="max-w-sm text-body text-muted-foreground">
            Practice smarter with confidence-tagged diagnostics and mirror reports.
          </p>
          <div className="mt-3 flex w-full flex-col items-center gap-1 border-t border-border pt-4">
            <p className="text-label text-muted-foreground flex items-center gap-1">
              <span className="font-bold text-foreground">Built by a student for students</span>
              <Heart className="h-3.5 w-3.5 text-danger-foreground" />
            </p>
            <p className="text-label text-subtle-foreground">
              © {new Date().getFullYear()} ChapWisePYQ. All rights reserved. <span className="font-bold text-foreground">| By Dinesh Chavan</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}