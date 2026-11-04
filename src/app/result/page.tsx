'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { calculateScore } from '@/lib/scoring';
import { Button } from '@/components/ui/button';
import type { Question } from '@/types';

export default function ResultPage() {
  const router = useRouter();
  const email = useTestStore(s => s.email);
  const answers = useTestStore(s => s.answers);
  const timeRemainingSeconds = useTestStore(s => s.timeRemainingSeconds);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      router.replace('/');
      return;
    }
    async function load() {
      const res = await fetch('/ray-optics.json');
      const data = await res.json();
      setQuestions(data);
      setIsLoading(false);
    }
    load();
  }, [email, router]);

  if (isLoading) return <div className="p-8 text-center">Calculating results...</div>;
  if (!email) return null;

  const score = calculateScore(questions, answers);
  const accuracy = Math.round((score / 30) * 100);
  const timeTakenSeconds = (40 * 60) - timeRemainingSeconds;
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-card border rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold">Test Completed</h1>
        
        <div className="space-y-4">
          <div className="text-6xl font-black text-primary">
            {score}<span className="text-3xl text-muted-foreground">/30</span>
          </div>
          <p className="text-lg font-medium">Your Score</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y py-6">
          <div>
            <p className="text-muted-foreground text-sm uppercase">Accuracy</p>
            <p className="text-xl font-bold">{accuracy}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm uppercase">Time Taken</p>
            <p className="text-xl font-bold">{formatTime(timeTakenSeconds)}</p>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={() => router.push('/review')}
        >
          View Solutions
        </Button>
      </div>
    </main>
  );
}