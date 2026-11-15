import { useEffect } from 'react';
import { useTestStore } from '@/store/useTestStore';

export function useTimer(onTimeUp: () => void) {
  const timeRemainingSeconds = useTestStore((state) => state.timeRemainingSeconds);
  const tickTimer = useTestStore((state) => state.tickTimer);

  useEffect(() => {
    // 1. Setup interval
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer]);

  useEffect(() => {
    // 2. Update Tab Title
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `${formatted} — ChapWise PYQ (Demo)`;

    // 3. Trigger auto-submit when it hits 0
    if (timeRemainingSeconds === 0) {
      onTimeUp();
    }
  }, [timeRemainingSeconds, onTimeUp]);
}