import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MathText } from '@/components/MathText';
import { CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import type { ReviewItem } from '@/lib/report';

export function ExplanationAccordion({ item }: { item: ReviewItem }) {
  const correctLetter = String.fromCharCode(65 + item.correctOption);
  const correctText = item.question.options[item.correctOption];

  return (
    <Accordion type="single" collapsible className="explanation-accordion mt-6">
      <AccordionItem value="explanation" className="border-b-0">
        <AccordionTrigger className="px-5 py-4 hover:bg-accent hover:no-underline">
          <span className="flex items-center gap-2 text-body font-bold text-foreground">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            View Detailed Explanation
          </span>
        </AccordionTrigger>

        <AccordionContent className="border-t bg-card px-5 pb-5 pt-4">
          {/* Compact correct-answer banner */}
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-success-border bg-success px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-foreground" />
            <p className="text-body font-medium text-success-foreground">
              <span className="font-bold">Correct Answer: ({correctLetter})</span>{' '}
              <MathText>{correctText}</MathText>
            </p>
          </div>

          {/* Explanation — label + one block per paragraph */}
        <div className="rounded-lg bg-muted/50 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-label font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Explanation
        </p>
        <div className="space-y-2 text-body leading-relaxed text-foreground">
            {item.question.explanation
            .split(/\n+/)                       // split on blank lines
            .filter(para => para.trim() !== '') // skip empty
            .map((para, i) => (
                <div key={i}>
                <MathText>{para}</MathText>
                </div>
            ))}
        </div>
        </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}