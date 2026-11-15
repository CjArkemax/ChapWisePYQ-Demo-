import { MathText } from '@/components/MathText';
import { ConfidencePanel } from './ConfidencePanel';
import { cn } from '@/lib/utils';
import type { Question, AnswerState } from '@/types';

interface QuestionCardProps {
  question: Question;
  index: number;
  answerState: AnswerState;
  onSelectOption?: (index: number) => void;
  onSelectConfidence?: (report: AnswerState['selfReport']) => void;
  isReview?: boolean;
}

export function QuestionCard({
  question,
  index,
  answerState,
  onSelectOption,
  onSelectConfidence,
  isReview = false,
}: QuestionCardProps) {
  
  const diffColors = {
    easy: "bg-success/20 text-success-foreground border-success/30",
    medium: "bg-warning/20 text-warning-foreground border-warning/30",
    hard: "bg-danger/20 text-danger-foreground border-danger/30",
  };

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-b pb-3">
        <span className="font-bold text-foreground">Q {index + 1}</span>
        <span>•</span>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", diffColors[question.difficulty])}>
          {question.difficulty}
        </span>
        <span className='ml-auto'>[ {question.year} ]</span>
      </div>

      <div className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">
        <MathText>{question.question}</MathText>
      </div>

      {question.imageUrl && (
        <div className="pyq-figure mb-6" data-ratio="16:9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.imageUrl} loading="lazy" alt={question.id} />
        </div>
      )}

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isSelected = answerState.selectedOption === i;
          const isCorrectOption = question.correctOption === i;
          
          let optionClass = "border-border bg-card";
          let indicatorClass = "border-muted-foreground text-muted-foreground";

          if (isReview) {
            if (isCorrectOption) {
              optionClass = "border-success-solid bg-success/10";
              indicatorClass = "border-success-solid bg-success text-success-foreground";
            } else if (isSelected) {
              optionClass = "border-destructive bg-danger/10";
              indicatorClass = "border-destructive bg-destructive text-destructive-foreground";
            }
          } else {
            if (isSelected) {
              optionClass = "border-primary bg-primary/5 ring-1 ring-primary";
              indicatorClass = "border-primary bg-primary text-primary-foreground";
            }
          }

          return (
            <button
              key={i}
              type="button"
              disabled={isReview}
              onClick={() => onSelectOption?.(i)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                !isReview && "hover:bg-accent",
                optionClass
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                indicatorClass
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1 pt-0.5">
                <MathText>{opt}</MathText>
              </div>
            </button>
          );
        })}
      </div>

      {!isReview && answerState.selectedOption !== null && onSelectConfidence && (
        <ConfidencePanel 
          selfReport={answerState.selfReport} 
          onChange={onSelectConfidence} 
        />
      )}
    </div>
  );
}