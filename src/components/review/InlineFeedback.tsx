'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useTestStore } from '@/store/useTestStore';
import { toast } from 'sonner';

export function InlineFeedback({ questionId }: { questionId: string }) {
  const attemptId = useTestStore(s => s.attemptId);
  const [thumb, setThumb] = useState<'up' | 'down' | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    if (!attemptId || !thumb) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('pilot_feedback').insert({
        attempt_id: attemptId,
        question_id: questionId,
        thumb,
        student_note: note.trim() || null,
      });

      if (error) throw error;
      setIsSent(true);
      toast.success('Feedback sent. Thanks!');
    } catch (err: any) {
      toast.error('Failed to send feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="mt-6 rounded-xl border border-success-border bg-success/10 p-4 text-center text-sm font-medium text-success-foreground">
        ✅ Feedback sent. Thanks for helping us improve the pilot!
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-foreground">Was this diagnosis accurate?</p>
      
      <div className="flex gap-2 mb-3">
        <Button 
          variant={thumb === 'up' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setThumb('up')}
        >
          👍 Yes
        </Button>
        <Button 
          variant={thumb === 'down' ? 'destructive' : 'outline'} 
          size="sm" 
          onClick={() => setThumb('down')}
        >
          👎 No
        </Button>
      </div>

      {thumb && (
        <div className="space-y-3 mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
          <p className="text-xs text-muted-foreground">
            {thumb === 'up' ? 'Great! Any additional thoughts?' : 'Tell us what actually happened...'}
          </p>
          <Textarea 
            placeholder="Optional note..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={isSubmitting}
            size="sm"
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      )}
    </div>
  );
}