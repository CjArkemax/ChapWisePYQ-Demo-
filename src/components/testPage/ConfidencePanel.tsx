import { Button } from '@/components/ui/button';
import type { SelfReport } from '@/types';
import { cn } from '@/lib/utils';

interface ConfidencePanelProps {
  selfReport: SelfReport;
  onChange: (report: SelfReport) => void;
}

export function ConfidencePanel({ selfReport, onChange }: ConfidencePanelProps) {
  const options: { label: string; value: SelfReport; icon: string }[] = [
    { label: 'Sure', value: 'sure', icon: '😊' },
    { label: 'Unsure', value: 'unsure', icon: '🤔' },
    { label: 'Guess', value: 'guess', icon: '🎲' },
  ];

  return (
    <div className="mt-6 rounded-lg border bg-muted/50 p-4">
      <p className="mb-3 text-sm font-medium text-foreground">How confident are you?</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selfReport === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={cn("flex-1 sm:flex-none gap-2", isActive && "ring-2 ring-primary ring-offset-2")}
              onClick={() => onChange(isActive ? null : opt.value)}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}