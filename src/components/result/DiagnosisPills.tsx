import type { DiagnosisTag } from '@/types';

interface DiagnosisPillsProps {
  summary: Record<DiagnosisTag, number>;
}

export function DiagnosisPills({ summary }: DiagnosisPillsProps) {
  const pills: { label: string; tag: DiagnosisTag; emoji: string; className: string }[] = [
    { label: 'Blind Guess', tag: 'BLIND_GUESS', emoji: '🚨', className: 'bg-danger text-danger-foreground border-danger-border' },
    { label: 'Misconception', tag: 'MISCONCEPTION', emoji: '🧠', className: 'bg-danger text-danger-foreground border-danger-border' },
    { label: 'Concept Gap', tag: 'CONCEPT_GAP', emoji: '📖', className: 'bg-warning text-warning-foreground border-warning-border' },
    { label: 'Needs Practice', tag: 'NEEDS_CONFIDENCE', emoji: '💪', className: 'bg-warning text-warning-foreground border-warning-border' },
    { label: 'Lucky Guess', tag: 'LUCKY_GUESS', emoji: '🍀', className: 'bg-warning text-warning-foreground border-warning-border' },
    { label: 'Mastered', tag: 'MASTERED', emoji: '✅', className: 'bg-success text-success-foreground border-success-border' },
    { label: 'Marked Skipped', tag: 'MARKED_SKIPPED', emoji: '⏳', className: 'bg-muted text-muted-foreground border-border' },
    { label: 'Unattempted', tag: 'UNATTEMPTED', emoji: '⬜', className: 'bg-muted text-muted-foreground border-border' },
  ];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-headline-sm font-bold text-foreground mb-4 border-b pb-3">Diagnosis Summary</h2>
      <div className="flex flex-wrap gap-3">
        {pills.map((pill) => {
          const count = summary[pill.tag] || 0;
          // Phase 2 spec: Default show all 8 so student sees 0s
          return (
            <div 
              key={pill.tag} 
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${pill.className}`}
            >
              <span>{pill.emoji}</span>
              <span>{count} {pill.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}