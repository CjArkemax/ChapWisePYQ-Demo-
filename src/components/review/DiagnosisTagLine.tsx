import type { ReviewItem } from '@/lib/report';
import { formatDuration, formatEstimate } from '@/lib/report';

export function DiagnosisTagLine({ item }: { item: ReviewItem }) {
  const tagColors = {
    BLIND_GUESS: "bg-danger text-danger-foreground border-danger-border",
    MISCONCEPTION: "bg-danger text-danger-foreground border-danger-border",
    CONCEPT_GAP: "bg-warning text-warning-foreground border-warning-border",
    NEEDS_CONFIDENCE: "bg-warning text-warning-foreground border-warning-border",
    LUCKY_GUESS: "bg-warning text-warning-foreground border-warning-border",
    MARKED_SKIPPED: "bg-warning text-warning-foreground border-warning-border",
    MASTERED: "bg-success text-success-foreground border-success-border",
    UNATTEMPTED: "bg-muted text-muted-foreground border-border",
  };

  const colorClass = tagColors[item.diagnosisTag] || tagColors.UNATTEMPTED;

  return (
    <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
      <span className={`rounded-md border px-2 py-1 ${colorClass}`}>
        {item.diagnosisEmoji} {item.diagnosisLabel}
      </span>
      <span className="rounded-md border bg-muted/50 px-2 py-1 text-muted-foreground flex items-center gap-1">
        ⏱️ {formatDuration(item.timeOnQuestionMs)} ({formatEstimate(item.estTimeSeconds)})
      </span>
      <span className="rounded-md border bg-muted/50 px-2 py-1 text-muted-foreground flex items-center gap-1">
        📂 {item.concept}
      </span>
    </div>
  );
}