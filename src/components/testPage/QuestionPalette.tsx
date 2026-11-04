import { cn } from '@/lib/utils';
import type { Question, AnswerState } from '@/types';
import { useEffect, useRef } from 'react';

interface QuestionPaletteProps {
  questions: Question[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  layout?: 'grid' | 'horizontal';
}

export function QuestionPalette({ 
  questions, 
  answers, 
  currentIndex, 
  onNavigate,
  layout = 'grid' 
}: QuestionPaletteProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (layout === 'horizontal' && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex, layout]);

  const getCellState = (qId: string) => {
    const ans = answers[qId];
    const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
    const isMarked = ans?.isMarkedForReview;

    if (isAnswered && isMarked) return 'answered-marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'unvisited';
  };

  const getStateClasses = (state: string) => {
    switch(state) {
      case 'answered':
        return "border-success-solid bg-success text-success-foreground hover:bg-success/90";
      case 'marked':
        return "border-warning-solid bg-warning text-warning-foreground hover:bg-warning/90";
      case 'answered-marked':
        return "border-success-solid bg-success text-success-foreground hover:bg-success/90";
      default:
        return "border-border bg-background text-muted-foreground";
    }
  };

  // FIX 1: callback ref so it never becomes null
  // FIX 2: type="button" so it never submits a form
  const renderButton = (q: Question, i: number) => {
    const state = getCellState(q.id);
    const isCurrent = currentIndex === i;

    return (
      <button
        key={q.id}
        type="button"
        ref={(el) => {
          if (isCurrent) activeRef.current = el;
        }}
        onClick={() => onNavigate(i)}
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors",
          getStateClasses(state),
          isCurrent && "ring-2 ring-primary ring-offset-2",
          layout === 'horizontal' && "snap-center"
        )}
      >
        {i + 1}
        {state === 'answered-marked' && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-warning-solid border border-white" />
        )}
      </button>
    );
  };

  if (layout === 'horizontal') {
    return (
      <div className="flex overflow-x-auto gap-2 p-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {questions.map((q, i) => renderButton(q, i))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-success border" /> Answered</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-warning border" /> Marked</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-success border relative"><div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-warning" /></div> Ans & Marked</div>
        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded border bg-background" /> Unvisited</div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => renderButton(q, i))}
      </div>
    </div>
  );
}