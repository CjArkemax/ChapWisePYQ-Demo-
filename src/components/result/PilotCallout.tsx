interface PilotCalloutProps {
  count: number;
}

export function PilotCallout({ count }: PilotCalloutProps) {
  if (count === 0) return null;

  return (
    <div className="rounded-xl border border-danger-border bg-danger p-4 text-danger-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h3 className="font-bold text-lg">Misconception Alert</h3>
          <p className="text-sm mt-1">
            You were <strong>Sure</strong> but got it wrong on <strong>{count}</strong> {count === 1 ? 'question' : 'questions'}. 
            Revise these from scratch — your confidence was high but the concept was off.
          </p>
        </div>
      </div>
    </div>
  );
}