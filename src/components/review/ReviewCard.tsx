import { MathText } from '@/components/MathText';
import { DiagnosisTagLine } from './DiagnosisTagLine';
import { cn } from '@/lib/utils';
import type { ReviewItem } from '@/lib/report';

export function ReviewCard({ item }: { item: ReviewItem }) {
  const { question, selectedOption, correctOption } = item;

  const diffColors = {
    easy: "bg-success/20 text-success-foreground border-success/30",
    medium: "bg-warning/20 text-warning-foreground border-warning/30",
    hard: "bg-danger/20 text-danger-foreground border-danger/30",
  };

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-b pb-3">
        <span className="font-bold text-foreground">Q {item.questionNumber}</span>
        <span>•</span>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", diffColors[question.difficulty])}>
          {question.difficulty}
        </span>
        <span className='ml-auto'>[ {question.year} ]</span>
      </div>


      <div className="text-lg leading-relaxed whitespace-pre-wrap mb-6">
        <MathText>{question.question}</MathText>
      </div>
      <DiagnosisTagLine item={item} />

      {question.imageUrl && (
        <div className="pyq-figure mb-6" data-ratio="16:9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.imageUrl} loading="lazy" alt={question.id} />
        </div>
      )}

      <div className="space-y-3">
        {question.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrectOption = correctOption === i;
          
          let optionClass = "border-border bg-card";
          let indicatorClass = "border-muted-foreground text-muted-foreground";

          if (isCorrectOption) {
            optionClass = "border-success-solid bg-success/10";
            indicatorClass = "border-success-solid bg-success text-success-foreground";
          } else if (isSelected) {
            optionClass = "border-destructive bg-danger/10";
            indicatorClass = "border-destructive bg-destructive text-destructive-foreground";
          }

          return (
            <div
              key={i}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-4 text-left",
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
            </div>
          );
        })}
      </div>
    </div>
  );
}