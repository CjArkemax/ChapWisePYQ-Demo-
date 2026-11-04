'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { QuestionCard } from '@/components/testPage/QuestionCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '@/types';

export default function ReviewPage() {
  const router = useRouter();
  const email = useTestStore(s => s.email);
  const answers = useTestStore(s => s.answers);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Redirect if they landed here without taking a test
    if (!email || Object.keys(answers).length === 0) {
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
  }, [email, answers, router]);

  if (isLoading) return <div className="p-8 text-center">Loading solutions...</div>;
  if (!email) return null;

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAns = answers[currentQ.id] || {
    selectedOption: null, selfReport: null, isMarkedForReview: false,
    timeToFirstSelectMs: null, timeOnQuestionMs: 0, optionChangesCount: 0
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
        <div className="font-semibold">
          Q {currentIndex + 1} / {questions.length}
        </div>
        <Button onClick={() => router.push('/')} variant="outline">
          Finish
        </Button>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
        <QuestionCard 
          question={currentQ}
          index={currentIndex}
          answerState={currentAns}
          isReview={true}
        />

        <div className="flex items-center justify-between pt-4 pb-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Prev
          </Button>
          
          <Button 
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}