import { formatDuration } from '@/lib/report';

interface MetricsBarProps {
  accuracy: number;
  timeTakenSeconds: number;
  correctRate: number;
}

export function MetricsBar({ accuracy, timeTakenSeconds, correctRate }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex flex-col gap-1 rounded-lg border bg-background p-4">
        <span className="text-label text-muted-foreground uppercase tracking-wider">Accuracy</span>
        <span className="text-headline-md font-bold text-foreground">{accuracy}%</span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border bg-background p-4">
        <span className="text-label text-muted-foreground uppercase tracking-wider">Time Taken</span>
        <span className="text-headline-md font-bold text-foreground">{formatDuration(timeTakenSeconds * 1000)}</span>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border bg-background p-4">
        <span className="text-label text-muted-foreground uppercase tracking-wider">Correct Rate</span>
        <span className="text-headline-md font-bold text-foreground">{correctRate}%</span>
        <span className="text-xs text-subtle-foreground">of attempted</span>
      </div>
    </div>
  );
}