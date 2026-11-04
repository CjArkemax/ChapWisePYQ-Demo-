import type { SeverityGroup } from '@/lib/report';
import { severityMeta } from '@/lib/report';
import { Button } from '@/components/ui/button';
import type { DiagnosisTag } from '@/types';

interface ActionPlanProps {
  groups: SeverityGroup[];
}

// Helper to map tag to its label and emoji
function getTagMeta(tag: DiagnosisTag) {
  switch (tag) {
    case 'BLIND_GUESS': return { label: 'Blind Guess', emoji: '🚨' };
    case 'MISCONCEPTION': return { label: 'Misconception', emoji: '🧠' };
    case 'CONCEPT_GAP': return { label: 'Concept Gap', emoji: '📖' };
    case 'NEEDS_CONFIDENCE': return { label: 'Needs Practice', emoji: '💪' };
    case 'LUCKY_GUESS': return { label: 'Lucky Guess', emoji: '🍀' };
    case 'MASTERED': return { label: 'Mastered', emoji: '✅' };
    case 'MARKED_SKIPPED': return { label: 'Marked Skipped', emoji: '⏳' };
    case 'UNATTEMPTED': return { label: 'Unattempted', emoji: '⬜' };
  }
}

export function ActionPlan({ groups }: ActionPlanProps) {
  if (groups.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-headline-sm font-bold text-foreground border-b pb-3">Unified Action Plan</h2>
      
      <div className="space-y-4">
        {groups.map((group) => {
          const meta = severityMeta(group.severity);
          
          return (
            <div 
              key={group.severity} 
              className={`rounded-lg border bg-background p-5 border-l-4 ${meta.colorClass}`}
            >
              {/* Severity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                  <span>{meta.emoji}</span> {meta.label}
                </h3>
                {/* Only show practice button if not Mastered */}
                {group.severity !== 'MASTERED' && (
                  <Button variant="outline" size="sm" disabled className="w-fit text-xs">
                    Practice (Coming Soon)
                  </Button>
                )}
              </div>
              
              {/* Concept List */}
              <div className="space-y-4">
                {group.concepts.map((conceptData) => (
                  <div key={conceptData.concept} className="space-y-2">
                    {/* Concept Name */}
                    <h4 className="font-semibold text-foreground text-sm">
                      {conceptData.concept}
                    </h4>
                    
                    {/* Tag Groups inside Concept */}
                    <div className="pl-4 space-y-1 border-l-2 border-muted ml-1">
                      {conceptData.tagGroups.map(tagGroup => {
                        const tMeta = getTagMeta(tagGroup.tag);
                        return (
                          <div key={tagGroup.tag} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="w-5 text-center">{tMeta.emoji}</span>
                            <span>
                              <strong className="text-foreground font-medium">{tMeta.label}:</strong>{' '}
                              {tagGroup.questions.map(q => `Q${q}`).join(', ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}