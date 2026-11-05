'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { CHAPTERS, type Chapter } from '@/lib/chapters';
import { Badge } from '@/components/ui/badge';

// Optional: metadata shown on each card (not part of Chapter type)
const chapterMeta: Record<
  string,
  { desc: string; questions: number; difficulty: string }
> = {
  'ray-optics': { desc: 'Class 12 Physics', questions: 30, difficulty: 'Medium' },
  'motion-straight-line': { desc: 'Class 11 Physics', questions: 11, difficulty: 'Easy–Medium' },
  electrostatics: { desc: 'Class 12 Physics', questions: 30, difficulty: 'Medium' },
};

export default function ChaptersPage() {
  const router = useRouter();
  const email = useTestStore((s) => s.email);
  const hasHydrated = useTestStore((s) => s._hasHydrated);
  const setChapter = useTestStore((s) => s.setChapter);

  // Guard: wait for hydration, then check email
  useEffect(() => {
    if (!hasHydrated) return;
    if (!email) router.replace('/');
  }, [hasHydrated, email, router]);

  if (!hasHydrated || !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-body">Loading…</p>
      </div>
    );
  }

  const handleSelect = (chapter: Chapter) => {
    // setChapter also sets timeRemainingSeconds = timeLimitMinutes * 60
    setChapter(chapter);
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-headline-lg font-bold text-foreground">
            Select a Chapter
          </h1>
          <p className="text-body text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{email}</span>
          </p>
        </header>

        <div className="grid gap-3">
          {CHAPTERS.map((chapter) => {
            const meta = chapterMeta[chapter.id];
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => handleSelect(chapter)}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary hover:bg-accent/40"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <h2 className="text-headline-sm font-bold text-foreground">
                      {chapter.title}
                    </h2>
                    <p className="text-body text-muted-foreground">{meta?.desc}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {chapter.timeLimitMinutes} min
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-label text-muted-foreground">
                  <span className="rounded-md border border-border bg-background px-2 py-1">
                    {meta?.questions} questions
                  </span>
                  <span className="rounded-md border border-border bg-background px-2 py-1">
                    {meta?.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}