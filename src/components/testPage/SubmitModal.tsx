import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unattemptedCount: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function SubmitModal({ open, onOpenChange, unattemptedCount, onConfirm, isSubmitting }: SubmitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Test?</DialogTitle>
          <DialogDescription>
            {unattemptedCount > 0 
              ? `You have ${unattemptedCount} unattempted questions. Are you sure you want to submit?`
              : "You have answered all questions. Ready to submit?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}