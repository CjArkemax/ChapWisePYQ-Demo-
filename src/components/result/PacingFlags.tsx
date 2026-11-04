import { formatDuration, formatEstimate } from '@/lib/report';

interface PacingItem {
  questionNumber: number;
  timeOnQuestionMs: number;
  estTimeSeconds: number;
}

interface PacingFlagsProps {
  rushed: PacingItem[];
  overthinking: PacingItem[];
}

export function PacingFlags({ rushed, overthinking }: PacingFlagsProps) {
  if (rushed.length === 0 && overthinking.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-headline-sm font-bold text-foreground border-b pb-3">Pacing Flags</h2>
      
      <div className="space-y-3">
        {overthinking.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-warning-border bg-warning p-3 text-warning-foreground">
            <span className="font-bold text-sm">⏱️ Overthinking</span>
            <p className="text-sm">
              {overthinking.map(item => 
                `Q${item.questionNumber} (${formatDuration(item.timeOnQuestionMs)})`
              ).join(' , ')}
            </p>
          </div>
        )}

        {rushed.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border bg-muted p-3 text-muted-foreground">
            <span className="font-bold text-sm text-foreground">⚡ Rushed</span>
            <p className="text-sm">
              {rushed.map(item => 
                `Q${item.questionNumber} (${formatDuration(item.timeOnQuestionMs)})`
              ).join(' , ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}