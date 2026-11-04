interface PerformanceLevelProps {
  accuracy: number;
}

export function PerformanceLevel({ accuracy }: PerformanceLevelProps) {
  const getLevel = (acc: number) => {
    if (acc > 70) return { label: 'MASTERED', badgeClass: 'bg-success text-success-foreground border-success-border', fillClass: 'bg-primary' };
    if (acc >= 40) return { label: 'REVIEW', badgeClass: 'bg-warning text-warning-foreground border-warning-border', fillClass: 'bg-warning-solid' };
    return { label: 'NEEDS PRACTICE', badgeClass: 'bg-danger text-danger-foreground border-danger-border', fillClass: 'bg-destructive' };
  };

  const level = getLevel(accuracy);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-muted-foreground uppercase tracking-wider">Performance Level</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${level.badgeClass}`}>
          {level.label}
        </span>
      </div>
      
      <div className="relative">
        <div className="h-3 w-full overflow-hidden rounded-full bg-accent">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${level.fillClass}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
        
        {/* Ticks */}
        <div className="flex justify-between mt-1 text-[10px] text-subtle-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}