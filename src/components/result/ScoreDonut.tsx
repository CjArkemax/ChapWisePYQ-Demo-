interface ScoreDonutProps {
  score: number;
  total: number;
}

export function ScoreDonut({ score, total }: ScoreDonutProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (score / total) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-48 w-48">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 150 150">
        {/* Track */}
        <circle
          className="stroke-accent"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="75"
          cy="75"
        />
        {/* Fill */}
        <circle
          className="stroke-primary transition-all duration-1000 ease-out"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="75"
          cy="75"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-display font-bold text-primary leading-none">{score}</span>
        <span className="text-label text-muted-foreground mt-1">OF {total}</span>
      </div>
    </div>
  );
}