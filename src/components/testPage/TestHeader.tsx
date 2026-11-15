import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TestHeaderProps {
  timeRemainingSeconds: number;
  onSubmitClick: () => void;
}

export function TestHeader({ timeRemainingSeconds, onSubmitClick }: TestHeaderProps) {
  const router = useRouter();
  
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isLowTime = timeRemainingSeconds < 300; // Under 5 mins

  const handleBack = () => {
    if (confirm("Are you sure you want to leave the test? Your progress is saved, but the timer will keep running.")) {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold hidden sm:inline-block">ChapWise PYQ (Demo)</span>
      </div>

      <div className={`flex items-center gap-2 font-mono text-lg font-bold ${isLowTime ? 'text-destructive' : 'text-primary'}`}>
        <Clock className="h-5 w-5" />
        {formattedTime}
      </div>

      <Button onClick={onSubmitClick} variant="default" className="bg-primary hover:bg-primary/90">
        Submit
      </Button>
    </header>
  );
}